import structlog
from groq import AsyncGroq
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from config import settings
import json
import re

log = structlog.get_logger()

# Configure Clients
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
genai.configure(api_key=settings.GOOGLE_API_KEY)

async def call_groq(system_prompt: str, user_prompt: str, model: str = "llama-3.1-8b-instant", max_tokens: int = 800) -> dict:
    """Call Groq API with robust error handling. Returns dict with content and usage."""
    try:
        response = await groq_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
            temperature=0.1,
        )
        return {
            "content": response.choices[0].message.content,
            "tokens_in": response.usage.prompt_tokens,
            "tokens_out": response.usage.completion_tokens,
        }
    except Exception as e:
        log.error("Groq API error", error=str(e))
        return {"content": "{}", "tokens_in": 0, "tokens_out": 0}

async def call_gemini(system_prompt: str, user_prompt: str, model: str = "gemini-2.0-flash", max_tokens: int = 2000) -> dict:
    """Call Gemini API. Returns dict with content and usage."""
    try:
        gemini_model = genai.GenerativeModel(
            model_name=f"models/{model}" if not model.startswith("models/") else model,
            system_instruction=system_prompt,
        )
        response = await gemini_model.generate_content_async(
            user_prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=max_tokens,
                temperature=0.1,
            )
        )
        usage = response.usage_metadata if hasattr(response, 'usage_metadata') else None
        tokens_in = usage.prompt_token_count if usage else 0
        tokens_out = usage.candidates_token_count if usage else 0
        return {
            "content": response.text,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
        }
    except Exception as e:
        log.error("Gemini API error", error=str(e))
        return {"content": "{}", "tokens_in": 0, "tokens_out": 0}

def clean_json_response(raw: str, max_retries: int = 2) -> dict:
    """Extract and parse JSON from AI response. Handle truncated responses gracefully."""
    if not raw:
        return {}

    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()

    # Try to parse JSON
    for attempt in range(max_retries):
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            # If JSON is incomplete/truncated, try to fix it
            if attempt == 0:
                # Try adding common closing brackets if response seems truncated
                if cleaned.endswith('"'):
                    # Likely truncated string, close it
                    test_json = cleaned + "}"
                    try:
                        return json.loads(test_json)
                    except:
                        pass

                if not cleaned.endswith("}"):
                    # Try closing with a bracket
                    for close_attempt in [cleaned + "}", cleaned + "]}",  cleaned + "]}"]:
                        try:
                            return json.loads(close_attempt)
                        except:
                            continue

            if attempt == max_retries - 1:
                log.error(
                    "JSON parsing failed after retries",
                    error=str(e),
                    raw_length=len(raw),
                    cleaned_length=len(cleaned),
                    raw_preview=raw[:150]
                )
                return {}

    return {}
