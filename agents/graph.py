from langgraph.graph import StateGraph, END
from .state import AgentState
from .researcher import researcher_agent
from .macro_agent import macro_agent
from .analyst_agent import analyst_agent
from .arbiter_writer import arbiter_writer_agent
from .technical_node import technical_node
from .risk_node import risk_node

def create_pipeline():
    """Constructs the optimized 7-agent LangGraph pipeline."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("researcher", researcher_agent)
    workflow.add_node("macro", macro_agent)
    workflow.add_node("technical", technical_node)
    workflow.add_node("risk", risk_node)
    workflow.add_node("analyst", analyst_agent)
    workflow.add_node("synthesizer", arbiter_writer_agent)

    # Define Edges
    workflow.set_entry_point("researcher")
    workflow.add_edge("researcher", "macro")
    workflow.add_edge("macro", "technical")
    workflow.add_edge("technical", "risk")
    workflow.add_edge("risk", "analyst")
    workflow.add_edge("analyst", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()

# Example usage interface
pipeline = create_pipeline()
