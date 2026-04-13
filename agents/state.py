from typing import Annotated, List, TypedDict, Optional
from pydantic import BaseModel, Field

class AgentState(TypedDict):
    """
    State passed between agents in the LangGraph pipeline.
    """
    ticker: str
    market: str  # 'US' or 'NGX'
    
    # Analysis Layers
    steps_completed: List[str]
    research_data: Optional[str]
    macro_score: Optional[float]
    technical_score: Optional[float]
    risk_score: Optional[float]
    alpha_conviction: Optional[float]
    
    # Final Output
    is_verified: bool
    final_recommendation: Optional[str]
    logs: List[str]

class AnalysisResult(BaseModel):
    ticker: str
    recommendation: str
    confidence: float
    layers: dict
