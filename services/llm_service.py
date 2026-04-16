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

async def call_groq(system_prompt: str, user_prompt: str, model: str = "llama-3.1-8b-instant", max_tokens: int = 800) -> str:
    """Call Groq API with robust error handling."""
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
        return response.choices[0].message.content
    except Exception as e:
        log.error("Groq API error", error=str(e))
        return "{}"

async def call_gemini(system_prompt: str, user_prompt: str, model: str = "gemini-2.0-flash", max_tokens: int = 2000) -> str:
    """Call Gemini API. Note: using gemini-1.5-flash as default stable version."""
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
        return response.text
    except Exception as e:
        log.error("Gemini API error", error=str(e))
        return "{}"

def clean_json_response(raw: str) -> dict:
    """Extract and parse JSON from AI response."""
    try:
        # Strip markdown fences
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        return json.loads(cleaned)
    except Exception as e:
        log.error("JSON parsing error", error=str(e), raw=raw[:100])
        return {}
