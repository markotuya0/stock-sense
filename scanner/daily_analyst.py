import json
import re
import asyncio
from typing import List, Dict, Any, Optional, Type
from pydantic import BaseModel, Field, ValidationError
from groq import AsyncGroq
import structlog
from config import settings

log = structlog.get_logger()

# --- Pydantic Schemas ---

class Layer1Signal(BaseModel):
    symbol: str
    signal: str = Field(pattern="^(STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL)$")
    score: float = Field(ge=0.1, le=9.9)
    price_target: float
    risk_score: int = Field(ge=1, le=10)
    reason: str
    beginner_note: str
    learn_term: str
    learn_explanation: str

class BatchSignals(BaseModel):
    signals: List[Layer1Signal]

# --- Daily Analyst ---

class DailyAnalyst:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"

    def _get_system_prompt(self) -> str:
        return """You are the Layer 1 Daily Scanner Analyst for StockSense AI.
Your job is to analyze stock market candidates and provide high-quality signals.

For each stock, provide:
1. Signal: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL.
2. Score: 0.1 to 9.9 (where 9.9 is extremely strong).
3. Price target: A realistic 6-12 month target.
4. Risk score: 1 to 10 (where 10 is highest risk).
5. Reason: One professional sentence for experienced investors.
6. Beginner note: One plain-English sentence for new investors.
7. Learn term: One financial term relevant to the analysis.
8. Learn explanation: A simple 1-sentence explanation of that term.

Output MUST be a JSON object with a "signals" key containing a list of objects.
"""

    def _build_user_prompt(self, candidates: List[Dict[str, Any]]) -> str:
        prompt_lines = ["Analyze the following stock market candidates:"]
        for c in candidates:
            line = f"- {c['symbol']} ({c['name']}): Price {c['currency']} {c['price']}, Change {c['change_pct']}%, Vol Ratio {c['volume_ratio']}"
            if "warnings" in c and c["warnings"]:
                line += f", Data Quality Warnings: {', '.join(c['warnings'])}"
            prompt_lines.append(line)
        return "\n".join(prompt_lines)

    async def _call_groq(self, user_prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=2000,
                temperature=0.1,
            )
            return response.choices[0].message.content
        except Exception as e:
            log.error("Groq API call failed", error=str(e))
            raise

    def _validate_output(self, raw_json: str) -> List[Layer1Signal]:
        try:
            data = json.loads(raw_json)
            validated = BatchSignals(**data)
            return validated.signals
        except (json.JSONDecodeError, ValidationError) as e:
            log.error("AI output validation failed", error=str(e), raw=raw_json)
            # Optional: Implement a fallback or retry here
            return []

    async def analyze_batch(self, candidates: List[Dict[str, Any]]) -> List[Layer1Signal]:
        """Analyze a batch of stocks (max 5-10 recommended)."""
        if not candidates:
            return []
        
        user_prompt = self._build_user_prompt(candidates)
        raw_output = await self._call_groq(user_prompt)
        return self._validate_output(raw_output)

    async def analyze_all(self, candidates: List[Dict[str, Any]], batch_size: int = 5) -> List[Layer1Signal]:
        """Process all candidates in batches."""
        all_signals = []
        for i in range(0, len(candidates), batch_size):
            batch = candidates[i:i+batch_size]
            log.info("Analyzing batch", start=i, end=min(i+batch_size, len(candidates)))
            signals = await self.analyze_batch(batch)
            all_signals.extend(signals)
            # Small sleep to respect rate limits if needed
            await asyncio.sleep(1)
        
        return all_signals

if __name__ == "__main__":
    # Test candidates
    test_candidates = [
        {"symbol": "ZENITHB", "name": "Zenith Bank Plc", "price": 38.50, "currency": "NGN", "change_pct": 1.2, "volume_ratio": 1.5, "warnings": []},
        {"symbol": "NVDA", "name": "NVIDIA Corp", "price": 875.0, "currency": "USD", "change_pct": 2.1, "volume_ratio": 2.0, "warnings": []}
    ]
    
    async def main():
        analyst = DailyAnalyst()
        signals = await analyst.analyze_all(test_candidates)
        for s in signals:
            print(s.model_dump_json(indent=2))
            
    asyncio.run(main())
