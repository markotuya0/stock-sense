from agents.graph import create_pipeline

def run_test():
    app = create_pipeline()
    initial_state = {
        "ticker": "AAPL",
        "market": "US",
        "steps_completed": [],
        "logs": []
    }
    
    print("--- STARTING PIPELINE TEST ---")
    result = app.invoke(initial_state)
    
    print("\n--- PIPELINE LOGS ---")
    for log in result["logs"]:
        print(log)
        
    print("\n--- FINAL RESULT ---")
    print(f"Ticker: {result['ticker']}")
    print(f"Recommendation: {result['final_recommendation']}")
    print(f"Verified: {result['is_verified']}")
    print(f"Steps: {result['steps_completed']}")

if __name__ == "__main__":
    run_test()
