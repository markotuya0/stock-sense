import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Request, Depends
from sse_starlette.sse import EventSourceResponse
from agents.graph import create_pipeline
from middleware.tier_guard import require_pro
from db.models import User

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])

@router.get("/stream/{ticker}")
async def stream_analysis(
    ticker: str, 
    request: Request,
    current_user: User = Depends(require_pro)
):
    """
    Streams the 7-layer agent analysis in real-time using SSE.
    """
    market = "NGX" if ticker.upper().endswith(".NG") else "US"

    async def event_generator():
        pipeline = create_pipeline()
        initial_state = {
            "ticker": ticker,
            "market": market,
            "steps_completed": [],
            "logs": [],
            "is_verified": False,
        }

        # Initial status event
        yield {
            "event": "message",
            "id": "0",
            "retry": 15000,
            "data": json.dumps(
                {
                    "step": "start",
                    "log": f"> [SYSTEM] Analysis started for {ticker.upper()} ({market})",
                    "progress": 5,
                    "completed": False,
                }
            ),
        }

        try:
            final_state = await pipeline.ainvoke(initial_state)
            if await request.is_disconnected():
                return

            logs = final_state.get("logs", [])
            total_logs = len(logs) if logs else 1
            for idx, log_line in enumerate(logs, start=1):
                progress = min(95, int((idx / total_logs) * 100))
                yield {
                    "event": "message",
                    "id": str(idx),
                    "retry": 15000,
                    "data": json.dumps(
                        {
                            "step": "pipeline",
                            "log": log_line,
                            "progress": progress,
                            "completed": False,
                        }
                    ),
                }
                await asyncio.sleep(0.05)

            final_signal = final_state.get("final_recommendation", "HOLD")
            yield {
                "event": "done",
                "data": json.dumps(
                    {
                        "status": "complete",
                        "final_signal": final_signal,
                        "steps_completed": final_state.get("steps_completed", []),
                        "completed_at": datetime.utcnow().isoformat(),
                    }
                ),
            }
        except Exception as exc:
            yield {
                "event": "done",
                "data": json.dumps(
                    {
                        "status": "failed",
                        "error": str(exc),
                        "final_signal": "HOLD",
                    }
                ),
            }

    return EventSourceResponse(event_generator())
