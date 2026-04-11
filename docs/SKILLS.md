# StockSense — SKILLS.md
## Agent Prompt Engineering & LangGraph Patterns

> This file teaches Claude how to build the multi-agent system correctly.
> Read before writing any agent code.

---

## Table of Contents

1. [LangGraph Fundamentals](#1-langgraph-fundamentals)
2. [Agent Prompt Patterns](#2-agent-prompt-patterns)
3. [Model Selection Per Task](#3-model-selection-per-task)
4. [Groq Integration](#4-groq-integration)
5. [Gemini Integration](#5-gemini-integration)
6. [Parallel Agent Execution](#6-parallel-agent-execution)
7. [Output Validation Patterns](#7-output-validation-patterns)
8. [NGX Data Handling Patterns](#8-ngx-data-handling-patterns)
9. [Streaming Patterns](#9-streaming-patterns)
10. [Cost Tracking](#10-cost-tracking)

---

## 1. LangGraph Fundamentals

### State flows through the graph — never use global variables

```python
from langgraph.graph import StateGraph, END
from dataclasses import dataclass, field

# The state object is the ONLY way to share data between agents
# Never use global variables or module-level state
# Every agent reads from state and writes to state

@dataclass
class AgentState:
    input: StockInput = None
    cleaned_data: CleanedData = None
    research: ResearchOutput = None
    macro: MacroOutput = None
    regulatory: RegulatoryOutput = None
    analyst: AnalystOutput = None
    critic: CriticOutput = None
    arbiter: ArbiterOutput = None
    events: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    tokens_used: int = 0
    cost_usd: float = 0.0

# Agent function signature — always:
# async def run_AGENT_NAME(state: AgentState) -> AgentState:
async def run_researcher(state: AgentState) -> AgentState:
    # Read from state
    symbol = state.input.symbol
    data = state.cleaned_data

    # Do work...
    result = await call_groq(...)

    # Write to state
    state.research = result
    state.events.append({"type": "agent_complete", "agent": "researcher"})

    # ALWAYS return state
    return state

# Build and compile the graph once — use as singleton
graph = StateGraph(AgentState)
graph.add_node("researcher", run_researcher)
# ... add more nodes
compiled = graph.compile(checkpointer=checkpointer)
```

### Conditional edges for smart routing

```python
def should_continue(state: AgentState) -> str:
    """Route based on state — called after data cleaning."""
    if state.cleaned_data is None:
        return "error"
    if state.cleaned_data.data_quality == "STALE":
        return "serve_cache"
    if state.cleaned_data.data_quality == "LOW":
        return "analyst_limited"  # skip parallel research, go straight to analyst
    return "parallel_research"

graph.add_conditional_edges(
    "data_cleaning",
    should_continue,
    {
        "parallel_research": "parallel_research",
        "analyst_limited":   "analyst",
        "serve_cache":       END,
        "error":             END,
    }
)
```

---

## 2. Agent Prompt Patterns

### Structure every prompt as: SYSTEM (cached) + USER (dynamic)

```python
# System prompts are STATIC — same for every call
# They are cached by Groq/Gemini — cached tokens are FREE or cheaper
# Never put dynamic data in the system prompt

# CORRECT PATTERN
RESEARCHER_SYSTEM = """You are the Researcher Agent for StockSense AI..."""  # static

def build_researcher_user_prompt(data: CleanedData) -> str:
    """Dynamic part — contains the actual stock data."""
    lines = [f"Symbol: {data.symbol}"]
    lines.append(f"Price: {data.currency} {data.price}")
    if data.rsi is not None:
        lines.append(f"RSI: {data.rsi:.1f}")
    else:
        lines.append("RSI: not available")
    # Only include fields that have actual data — never "RSI: None"
    return "\n".join(lines)

# API call structure
response = groq_client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "system", "content": RESEARCHER_SYSTEM},  # cached
        {"role": "user",   "content": build_researcher_user_prompt(data)},  # dynamic
    ],
    response_format={"type": "json_object"},  # force JSON output
    max_tokens=800,    # always set max_tokens — prevent runaway output
    temperature=0.1,   # low temperature for financial analysis = more consistent
)
```

### Prompt injection prevention

```python
def sanitise_for_prompt(text: str, max_len: int = 150) -> str:
    """Clean external data before injecting into prompts."""
    if not text:
        return "Unknown"
    # Remove control characters and characters that break JSON
    cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", text)
    cleaned = cleaned.replace('"', "'")   # no double quotes
    cleaned = cleaned.replace("\\", "")   # no backslashes
    return cleaned[:max_len].strip()

# Always sanitise: company names, news headlines, any external text
symbol = sanitise_for_prompt(raw_symbol, max_len=10)
company_name = sanitise_for_prompt(raw_name, max_len=100)
```

---

## 3. Model Selection Per Task

```python
# Rules for which model to use for which agent

AGENT_MODELS = {
    # FREE: Groq rate limits: 14,400 req/day, 500k tokens/day for llama-3.1-8b-instant
    "researcher":        "llama-3.1-8b-instant",   # data extraction — 8b is enough
    "macro_agent":       "llama-3.1-8b-instant",   # structured data extraction
    "regulatory_agent":  "llama-3.1-8b-instant",   # pattern matching
    "layer1_scanner":    "llama-3.1-8b-instant",   # daily scanner signals

    # PAID: Gemini Flash — use for reasoning tasks only
    "analyst":           "gemini-2.0-flash-exp",   # $0.10/$0.40 per 1M tokens
    "critic":            "gemini-2.0-flash-exp",   # same model = consistent format
    "arbiter_writer":    "gemini-2.5-flash-preview", # best reasoning, $0.30/$2.50

    # Fallback when Groq is rate limited
    "fallback":          "gemini-2.0-flash-exp",
}

# Decision logic
def select_model(agent_name: str, groq_available: bool) -> str:
    if not groq_available and agent_name in ["researcher", "macro_agent", "regulatory_agent"]:
        return AGENT_MODELS["fallback"]  # paid fallback
    return AGENT_MODELS.get(agent_name, "llama-3.1-8b-instant")
```

---

## 4. Groq Integration

```python
from groq import AsyncGroq
import structlog

log = structlog.get_logger()
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

async def call_groq(
    system_prompt: str,
    user_prompt: str,
    model: str = "llama-3.1-8b-instant",
    max_tokens: int = 800,
) -> str:
    """Call Groq API with error handling and token tracking."""
    try:
        response = await groq_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
            temperature=0.1,
        )
        tokens_in  = response.usage.prompt_tokens
        tokens_out = response.usage.completion_tokens
        log.info("Groq call complete", model=model, tokens_in=tokens_in, tokens_out=tokens_out)
        return response.choices[0].message.content

    except Exception as e:
        error_str = str(e)
        if "rate_limit" in error_str.lower() or "429" in error_str:
            log.warning("Groq rate limited", model=model)
            raise GroqRateLimitError("Groq rate limit hit")
        if "timeout" in error_str.lower():
            log.warning("Groq timeout", model=model)
            raise GroqTimeoutError("Groq timed out")
        log.error("Groq API error", error=error_str)
        raise

# Groq free tier limits (2026):
# llama-3.1-8b-instant: 14,400 req/day, 500k tokens/day, 30 req/min
# llama-3.3-70b-versatile: lower limits — use as fallback only
# Cached tokens DO NOT count toward rate limits
```

---

## 5. Gemini Integration

```python
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

genai.configure(api_key=settings.GOOGLE_API_KEY)

async def call_gemini(
    system_prompt: str,
    user_prompt: str,
    model: str = "gemini-2.0-flash-exp",
    max_tokens: int = 2000,
) -> str:
    """Call Gemini API. Used for Analyst, Critic, Arbiter agents."""
    gemini_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt,    # Gemini uses system_instruction
        generation_config=GenerationConfig(
            response_mime_type="application/json",   # force JSON output
            max_output_tokens=max_tokens,
            temperature=0.1,
        ),
    )
    response = await gemini_model.generate_content_async(user_prompt)
    return response.text

# Cost tracking for Gemini
GEMINI_COSTS = {
    "gemini-2.0-flash-exp": {"input": 0.10, "output": 0.40},    # per 1M tokens
    "gemini-2.5-flash-preview": {"input": 0.30, "output": 2.50},
}

def estimate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    costs = GEMINI_COSTS.get(model, {"input": 0.10, "output": 0.40})
    return (tokens_in / 1_000_000 * costs["input"] +
            tokens_out / 1_000_000 * costs["output"])
```

---

## 6. Parallel Agent Execution

```python
import asyncio

async def run_parallel_research(state: AgentState) -> AgentState:
    """
    Run Researcher, Macro, and Regulatory agents simultaneously.
    This cuts latency by ~45% vs sequential execution.
    Use return_exceptions=True so one failure doesn't kill others.
    """
    state.events.append({"type": "parallel_start"})

    tasks = [
        asyncio.create_task(run_researcher(state)),
        asyncio.create_task(run_macro_agent(state)),
        asyncio.create_task(run_regulatory_agent(state)),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle each result — partial failure is acceptable
    agent_names = ["researcher", "macro_agent", "regulatory_agent"]
    outputs = ["research", "macro", "regulatory"]

    for i, (name, attr) in enumerate(zip(agent_names, outputs)):
        if isinstance(results[i], Exception):
            state.errors.append(f"{name} failed: {str(results[i])}")
            state.events.append({"type": "agent_error", "agent": name})
            setattr(state, attr, None)  # None is handled gracefully downstream
        else:
            # Each task modifies state and returns it
            # Extract just the relevant output from the completed state
            completed_state = results[i]
            setattr(state, attr, getattr(completed_state, attr))
            state.events.append({"type": "agent_complete", "agent": name})

    return state

# IMPORTANT: Each parallel agent should only write to its own field
# Researcher writes to state.research
# Macro writes to state.macro
# Regulatory writes to state.regulatory
# No agent should write to another agent's field
```

---

## 7. Output Validation Patterns

### Three-layer validation — apply to every AI response

```python
import json
import re
from pydantic import BaseModel, ValidationError

def validate_ai_output(raw: str, schema: type[BaseModel], current_price: float = None) -> BaseModel:
    """
    Full 3-layer validation pipeline.
    Raises ValueError if output is unrecoverable.
    Applies corrections silently for recoverable issues.
    """
    # LAYER 1: Extract valid JSON
    cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start == -1:
        raise ValueError(f"No JSON found: {raw[:200]}")
    try:
        data = json.loads(cleaned[start:end])
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}")

    # LAYER 2: Pydantic schema validation
    try:
        result = schema(**data)
    except ValidationError as e:
        raise ValueError(f"Schema validation failed: {e}")

    # LAYER 3: Financial sanity checks (if applicable)
    if current_price and hasattr(result, "price_target"):
        max_target = current_price * 2.0
        min_target = current_price * 0.4
        if result.price_target > max_target:
            result.price_target = max_target
        if result.price_target < min_target:
            result.price_target = min_target
        if hasattr(result, "upside_pct"):
            result.upside_pct = round(
                (result.price_target - current_price) / current_price * 100, 2
            )

    return result

# Retry pattern for AI calls
MAX_RETRIES = 2

async def call_with_retry(agent_fn, state, schema, current_price=None):
    for attempt in range(MAX_RETRIES + 1):
        try:
            raw = await agent_fn(state)
            return validate_ai_output(raw, schema, current_price)
        except (ValueError, ValidationError) as e:
            if attempt == MAX_RETRIES:
                return None  # Return None — fallback handles this
            await asyncio.sleep(2 ** attempt)
    return None
```

---

## 8. NGX Data Handling Patterns

### Always apply these checks for any NGX stock

```python
class NGXDataCleaningAgent:
    """
    Apply ALL checks below for every NGX stock.
    None of these are optional — NGX data is genuinely unreliable.
    """

    # CHECK 1: Stale price detection
    # Identical closing price for 3+ consecutive days = no real trading
    @staticmethod
    def is_stale_price(prices: list[float], threshold: int = 3) -> bool:
        consecutive = 0
        for i in range(1, len(prices)):
            if prices[i] == prices[i-1]:
                consecutive += 1
                if consecutive >= threshold:
                    return True
            else:
                consecutive = 0
        return False

    # CHECK 2: Kobo/Naira confusion
    # NGX equity prices should never be above ₦10,000
    # Prices like 68,000 are almost certainly in kobo (should be ₦680)
    @staticmethod
    def fix_currency_unit(price: float, symbol: str) -> tuple[float, bool]:
        if price > 10_000:
            return price / 100, True   # (corrected_price, was_corrected)
        return price, False

    # CHECK 3: Zero volume handling
    # NEVER interpolate zero volume — zero means no trading, not missing data
    @staticmethod
    def handle_zero_volume(volume: float) -> float | None:
        if volume == 0:
            return None  # explicit null, not 0
        return volume

    # CHECK 4: RSI from trading days only
    # RSI requires 14 TRADING DAYS — not 14 calendar days
    @staticmethod
    def compute_rsi_trading_days_only(price_history: list[dict]) -> float | None:
        trading_days = [
            d["close"] for d in price_history
            if d.get("volume") and d["volume"] > 0
        ]
        if len(trading_days) < 14:
            return None  # insufficient real trading data
        return ta_rsi(trading_days)

    # CHECK 5: Data reliability scoring
    def score_reliability(self, data: dict) -> tuple[int, str, list[str]]:
        score = 100
        warnings = []

        if self.is_stale_price(data.get("prices", [])):
            score -= 30
            warnings.append("Price unchanged for 3+ consecutive days")

        vol_30d = data.get("avg_volume_30d", 0)
        if vol_30d < 500_000:  # less than 500k shares avg volume
            score -= 20
            warnings.append(f"Low liquidity: avg volume {vol_30d:,.0f}")

        if data.get("rsi") is None:
            score -= 15
            warnings.append("RSI unavailable — insufficient trading history")

        if data.get("last_trade_days_ago", 0) > 2:
            days = data["last_trade_days_ago"]
            score -= 15
            warnings.append(f"Last trade was {days} days ago")

        if score >= 70:   quality = "HIGH"
        elif score >= 40: quality = "MEDIUM"
        else:             quality = "LOW"

        return score, quality, warnings
```

---

## 9. Streaming Patterns

### Emit events at the right moments

```python
# Standard event types — use these exact type strings
# Frontend components listen for these and render accordingly

EVENTS = {
    # Pipeline started
    "started":           {"type": "started",           "message": str},

    # Data quality result
    "data_quality":      {"type": "data_quality",       "quality": str, "price": float, "currency": str},

    # Individual agent updates
    "agent_running":     {"type": "agent_running",      "agent": str},
    "agent_complete":    {"type": "agent_complete",     "agent": str, "finding": str},
    "agent_error":       {"type": "agent_error",        "agent": str, "error": str},

    # Analysis milestones
    "analyst_complete":  {"type": "analyst_complete",   "signal": str, "score": float},
    "critic_complete":   {"type": "critic_complete",    "counter": str, "challenges": int},
    "dispute_detected":  {"type": "dispute_detected",   "analyst": str, "critic": str},

    # Final result
    "report_ready":      {"type": "report_ready",       "signal": str, "score": float},
    "complete":          {"type": "complete"},

    # Errors
    "error":             {"type": "error",              "message": str},
    "cache_served":      {"type": "cache_served",       "message": str},
}

# Add events to state inside agent functions
def emit_event(state: AgentState, event: dict) -> None:
    state.events.append(event)

# SSE format — always: "data: {json}\n\n"
async def generate_sse_events(state_stream):
    async for chunk in state_stream:
        current_state = list(chunk.values())[0]
        for event in current_state.events:
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)  # yield control
```

---

## 10. Cost Tracking

### Track every token spent — enforce hard limits

```python
# services/budget_service.py

async def check_budget(user_id: str) -> None:
    """
    Call this before every AI agent call.
    Raises BudgetExceededError if limits are hit.
    """
    # Check user daily budget
    user_daily = await get_user_daily_spend(user_id)
    if user_daily >= settings.BUDGET_PER_USER_DAILY_USD:
        raise BudgetExceededError(
            f"Daily budget exceeded for user {user_id}. "
            f"Spent: ${user_daily:.4f} / ${settings.BUDGET_PER_USER_DAILY_USD:.2f}"
        )

    # Check platform daily budget
    platform_daily = await get_platform_daily_spend()
    if platform_daily >= settings.BUDGET_PLATFORM_DAILY_USD:
        raise BudgetExceededError(
            f"Platform daily budget exceeded. "
            f"Spent: ${platform_daily:.2f} / ${settings.BUDGET_PLATFORM_DAILY_USD:.2f}"
        )

async def record_spend(user_id: str, model: str, tokens_in: int, tokens_out: int) -> float:
    """Record spend in Redis for budget tracking."""
    cost = estimate_cost(model, tokens_in, tokens_out)
    today_key = f"spend:user:{user_id}:{date.today().isoformat()}"
    platform_key = f"spend:platform:{date.today().isoformat()}"

    await redis_client.incrbyfloat(today_key, cost)
    await redis_client.incrbyfloat(platform_key, cost)
    await redis_client.expire(today_key, 86400 * 2)      # keep 2 days
    await redis_client.expire(platform_key, 86400 * 2)

    log.info("Spend recorded", user_id=user_id, model=model, cost_usd=cost)
    return cost

# Token limits per analysis
MAX_TOKENS_PER_AGENT = {
    "researcher":        800,
    "macro_agent":       600,
    "regulatory_agent":  600,
    "analyst":           1200,
    "critic":            1000,
    "arbiter_writer":    2500,   # longest — writes two versions of report
}
# Total budget per analysis: ~6,700 tokens max across all agents
# At mixed model pricing: < $0.01 per analysis
```

---

## Quick Reference — Common Patterns

### ✅ Do this
```python
# Always return state from agent functions
async def run_agent(state: AgentState) -> AgentState:
    # ... do work ...
    return state

# Always sanitise external strings for prompts
name = sanitise_for_prompt(raw_name, max_len=100)

# Always set max_tokens
response = groq.chat.completions.create(..., max_tokens=800)

# Always use response_format={"type": "json_object"} for structured output
```

### ❌ Never do this
```python
# Never use global state in agents
global current_analysis  # ❌ breaks concurrent requests

# Never trust AI output without validation
signal = json.loads(raw_response)["signal"]  # ❌ could be anything

# Never put dynamic data in system prompt
SYSTEM = f"Analyse {symbol}"  # ❌ not cacheable

# Never interpolate user input into prompts without sanitising
prompt = f"Research {user_input}"  # ❌ prompt injection risk
```

---

*StockSense SKILLS.md — v1.0.0*
