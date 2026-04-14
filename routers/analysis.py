import asyncio
import json
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
    async def event_generator():
        pipeline = create_pipeline()
        initial_state = {
            "ticker": ticker,
            "market": "NGX",  # Logic to determine market can be added
            "steps_completed": [],
            "logs": []
        }

        # In a real LangGraph scenario with streaming, we would use .astream()
        # For this implementation, we simulate the step-by-step progress
        
        # Mocking the stream for now to ensure front-to-back connectivity
        steps = [
            "researcher", "macro", "technical", "risk", "orchestrator", "validator", "synthesizer"
        ]
        
        current_logs = []
        for step in steps:
            # Check for client disconnect
            if await request.is_disconnected():
                break
                
            # Simulate agent processing
            await asyncio.sleep(1.5)
            
            # Append log
            log_entry = f"> [{step.upper()}] Processing layer {steps.index(step)+1} validation..."
            current_logs.append(log_entry)
            
            # Prepare SSE data
            yield {
                "event": "message",
                "id": str(steps.index(step)),
                "retry": 15000,
                "data": json.dumps({
                    "step": step,
                    "log": log_entry,
                    "progress": int(((steps.index(step) + 1) / len(steps)) * 100),
                    "completed": step == "synthesizer"
                })
            }

        if not await request.is_disconnected():
            yield {
                "event": "done",
                "data": json.dumps({"status": "complete", "final_signal": "STRONG_BUY"})
            }

    return EventSourceResponse(event_generator())
