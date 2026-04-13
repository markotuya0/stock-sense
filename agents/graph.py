from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    researcher_node,
    macro_node,
    technical_node,
    risk_node,
    orchestrator_node,
    validator_node,
    synthesizer_node
)

def create_pipeline():
    """Constructs the 7-agent LangGraph pipeline."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("macro", macro_node)
    workflow.add_node("technical", technical_node)
    workflow.add_node("risk", risk_node)
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("synthesizer", synthesizer_node)

    # Define Edges (Sequential for now, can be branched/conditional later)
    workflow.set_entry_point("researcher")
    workflow.add_edge("researcher", "macro")
    workflow.add_edge("macro", "technical")
    workflow.add_edge("technical", "risk")
    workflow.add_edge("risk", "orchestrator")
    workflow.add_edge("orchestrator", "validator")
    workflow.add_edge("validator", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()

# Example usage interface
pipeline = create_pipeline()
