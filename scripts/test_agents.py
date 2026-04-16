import asyncio
import os
from dotenv import load_dotenv
from agents.graph import pipeline

# Load local env
load_dotenv()

async def test_deep_analysis(ticker: str, market: str):
    print(f"🚀 Starting Deep Analysis for {ticker} ({market})...")
    
    initial_state = {
        "ticker": ticker,
        "market": market,
        "logs": [],
        "steps_completed": [],
        "is_verified": True
    }
    
    try:
        # Run the pipeline
        final_state = await pipeline.ainvoke(initial_state)
        
        print("\n--- ANALYSIS LOGS ---")
        for log in final_state.get("logs", []):
            print(log)
            
        print("\n--- FINAL RESULT ---")
        print(f"SIGNAL: {final_state.get('final_recommendation')}")
        print(f"STEPS: {final_state.get('steps_completed')}")
        
        if final_state.get("report_data"):
            print("\n--- REPORT DATA (ARBITER) ---")
            print(f"PRO REPORT: {final_state['report_data'].get('professional_report')[:100]}...")
            
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")

if __name__ == "__main__":
    if not os.getenv("GROQ_API_KEY") or not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  MISSING KEYS: Please add GROQ_API_KEY and GOOGLE_API_KEY to your .env file.")
    else:
        # Test with a US stock
        asyncio.run(test_deep_analysis("NVDA", "US"))
        # Test with an NGX stock
        # asyncio.run(test_deep_analysis("ZENITHB.LG", "NGX"))
