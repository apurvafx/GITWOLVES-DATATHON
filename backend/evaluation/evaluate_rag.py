import os
import sys
import time
import json
from datetime import datetime

# Set console encoding to UTF-8 on Windows to prevent UnicodeEncodeError for Kannada
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Adjust path to find backend modules
EVAL_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(EVAL_DIR)
sys.path.append(os.path.dirname(BACKEND_DIR))

# LOAD ENVIRONMENT VARIABLES FIRST before importing chat module
# so that GEMINI_API_KEY is available during import initialization
from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from backend.routes.chat import process_chat, ChatMessage

# Mock User context for evaluation
EVAL_USER = {
    "username": "evaluator",
    "name": "RAG Evaluator Agent",
    "role": "Investigator",
    "kgid": "KGID-KA-EVAL"
}

# Test suite containing English and Kannada queries, ground-truth tables/expectations
TEST_SUITE = [
    {
        "id": 1,
        "name": "Simple Count (English)",
        "query": "How many cases are registered in Bengaluru City?",
        "language": "English",
        "expected_facts": ["3 cases", "registered", "Bengaluru"],
        "expect_sql": True
    },
    {
        "id": 2,
        "name": "Accused Lookup (English)",
        "query": "Who is the accused listed in case CrimeNo 104430006202600001?",
        "language": "English",
        "expected_facts": ["Rajesh Gowda"],
        "expect_sql": True
    },
    {
        "id": 3,
        "name": "Multilingual Filter (Kannada)",
        "query": "ಮೈಸೂರಿನಲ್ಲಿ ಒಟ್ಟು ಎಷ್ಟು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ?", # How many cases registered in Mysuru?
        "language": "Kannada",
        "expected_facts": ["1", "ಮೈಸೂರು"],
        "expect_sql": True
    },
    {
        "id": 4,
        "name": "Financial Crime Sum (English)",
        "query": "What is the total amount funneled to Suresh Hegde's bank account in CaseMasterID 1?",
        "language": "English",
        "expected_facts": ["90,000", "ACC-SURESH-901"],
        "expect_sql": True
    },
    {
        "id": 5,
        "name": "Out-of-Scope Guard (English)",
        "query": "What is the capital of India?",
        "language": "English",
        "expected_facts": ["New Delhi"],
        "expect_sql": False  # Should handle general knowledge without breaking on SQL
    }
]

def run_evaluation():
    print("=" * 70)
    print(" KSP-CRIMEPILOT: RAG & TEXT-TO-SQL PIPELINE EVALUATION SUITE")
    print("=" * 70)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Model: gemini-1.5-flash")
    print(f"Framework: LangChain SQLDatabase + LCEL Chain")
    print("-" * 70)

    # Check for API Key
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY environment variable is not set. Cannot run evaluation.")
        return

    results = []
    passed_sql_syntactic = 0
    passed_factual = 0

    for test in TEST_SUITE:
        print(f"\n[Test #{test['id']}] Running: {test['name']}")
        print(f"  Query: \"{test['query']}\"")
        
        start_time = time.time()
        
        # Prepare mock chat message payload
        chat_msg = ChatMessage(
            message=test["query"],
            language=test["language"],
            history=[]
        )
        
        # Call backend chat router processing
        try:
            response = process_chat(chat_msg, user=EVAL_USER)
            latency = time.time() - start_time
            
            sql_query = response.get("sql_query", "")
            synth_resp = response.get("response", "")
            explanation = response.get("explanation", "")
            db_data = response.get("data", [])
            
            print(f"  Latency: {latency:.2f}s")
            
            # 1. SQL Correctness Check
            sql_status = "N/A"
            sql_correct = True
            if test["expect_sql"]:
                if sql_query:
                    # Check for SQLite error in results
                    has_error = len(db_data) > 0 and "error" in db_data[0]
                    if not has_error:
                        sql_status = "PASS (Valid SQL executed)"
                        passed_sql_syntactic += 1
                    else:
                        sql_status = f"FAIL (SQLite Error: {db_data[0]['error']})"
                        sql_correct = False
                else:
                    sql_status = "FAIL (No SQL generated when expected)"
                    sql_correct = False
            else:
                if not sql_query:
                    sql_status = "PASS (Correctly identified out-of-scope/no SQL)"
                    passed_sql_syntactic += 1
                else:
                    sql_status = "WARNING (SQL generated for general query)"
            
            print(f"  SQL Output: {sql_query if sql_query else '[None]'}")
            print(f"  SQL Evaluation: {sql_status}")
            
            # 2. Fact Check/Faithfulness Check (Simple check for keywords in output)
            fact_matches = []
            for fact in test["expected_facts"]:
                # Check case-insensitive substring
                match = fact.lower() in synth_resp.lower() or fact.lower() in str(db_data).lower()
                fact_matches.append(match)
                
            factual_acc = sum(fact_matches) / len(test["expected_facts"]) if test["expected_facts"] else 1.0
            factual_pass = factual_acc >= 0.5 # Pass if more than 50% of key facts are recovered
            
            if factual_pass:
                passed_factual += 1
                fact_status = "PASS"
            else:
                fact_status = "FAIL"
                
            print(f"  AI Answer: \"{synth_resp}\"")
            print(f"  Factual Recovery: {fact_status} ({factual_acc*100:.1f}% key facts recovered)")
            
            results.append({
                "id": test["id"],
                "name": test["name"],
                "query": test["query"],
                "latency_sec": latency,
                "generated_sql": sql_query,
                "sql_status": sql_status,
                "ai_response": synth_resp,
                "factual_recovery_percent": factual_acc * 100,
                "status": "PASS" if (sql_correct and factual_pass) else "FAIL"
            })
            
        except Exception as e:
            print(f"  FAIL (Exception occurred: {e})")
            results.append({
                "id": test["id"],
                "name": test["name"],
                "query": test["query"],
                "status": "FAIL",
                "error": str(e)
            })

    # Summary Report
    print("\n" + "=" * 70)
    print(" EVALUATION METRICS SUMMARY")
    print("=" * 70)
    total_tests = len(TEST_SUITE)
    print(f"Total Test Cases Evaluated: {total_tests}")
    print(f"SQL Syntactic Pass Rate:   {passed_sql_syntactic}/{total_tests} ({passed_sql_syntactic/total_tests*100:.1f}%)")
    print(f"Factual Correctness Rate:  {passed_factual}/{total_tests} ({passed_factual/total_tests*100:.1f}%)")
    
    avg_latency = sum([r.get("latency_sec", 0) for r in results]) / len(results)
    print(f"Average Pipeline Latency:   {avg_latency:.2f}s")
    
    # Save output report
    report_path = os.path.join(EVAL_DIR, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "sql_pass_rate": passed_sql_syntactic / total_tests,
                "factual_pass_rate": passed_factual / total_tests,
                "avg_latency": avg_latency
            },
            "detailed_results": results
        }, f, indent=2)
    print(f"Saved detailed metrics log to: {report_path}")
    print("=" * 70)

if __name__ == "__main__":
    run_evaluation()
