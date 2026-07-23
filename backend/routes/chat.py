from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.routes.auth import get_current_user
import os
import re
import json

# LangChain Imports
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

router = APIRouter(prefix="/api/chat", tags=["chat"])
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "ksp_crime.db")

# Load environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ChatMessage(BaseModel):
    message: str
    language: str = "English"  # "English" or "Kannada"
    history: list = []         # [{'role': 'user', 'content': '...'}, {'role': 'assistant', 'content': '...'}]

# LangChain SQL Database initialization
db = SQLDatabase.from_uri(f"sqlite:///{DB_PATH}")

# System prompt details for SQL Agent
SQL_SYSTEM_INSTRUCTIONS = """
You are KSP-CrimePilot, the AI SQL Database Copilot for the Karnataka State Police.
Your task is to analyze natural language queries and translate them into valid SQLite read-only SELECT queries.
You have access to a database with the following table definitions:
{table_info}

Guidelines:
- ALWAYS generate SQLite-compatible read-only SELECT queries.
- NEVER generate INSERT, UPDATE, DELETE, or DROP queries.
- Do NOT add markdown formatting or code blocks like ```sql around the SQL statement. Just return the raw SQL.
- If a query cannot be written (e.g., query is not about database, or general chat), return an empty string.
- Be precise with JOINs. Join CaseMaster with Unit and District to filter by DistrictName or Police Station Name.
- Make case-insensitive searches where appropriate by using the 'LIKE' operator.
"""

@router.post("/")
def process_chat(chat_request: ChatMessage, user: dict = Depends(get_current_user)):
    user_msg = chat_request.message
    lang = chat_request.language
    history = chat_request.history
    
    if not GEMINI_API_KEY:
        return {
            "response": "Gemini API key is missing in backend environment variables.",
            "sql_query": "",
            "explanation": "No key configured.",
            "data": [],
            "nodes": [],
            "edges": [],
            "coordinates": []
        }

    try:
        # 1. Initialize LangChain ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=GEMINI_API_KEY, 
            temperature=0.0
        )
        
        # 2. SQL Query Generation Chain
        prompt = ChatPromptTemplate.from_messages([
            ("system", SQL_SYSTEM_INSTRUCTIONS),
            ("human", "Translate the user message to SQL. History:\n{history}\nUser: {query}")
        ])
        
        # Format history for prompt
        history_str = "\n".join([f"{h['role']}: {h['content']}" for h in history[-5:]])
        
        sql_chain = (
            RunnablePassthrough.assign(table_info=lambda _: db.get_table_info())
            | prompt
            | llm
            | StrOutputParser()
        )
        
        # Run the chain to generate raw SQL
        sql_query = sql_chain.invoke({
            "query": user_msg,
            "history": history_str
        }).strip()
        
        # Strip markdown syntax just in case
        sql_query = re.sub(r"^```sql\s*", "", sql_query, flags=re.IGNORECASE)
        sql_query = re.sub(r"\s*```$", "", sql_query)
        sql_query = sql_query.strip()
        
    except Exception as e:
        print(f"LangChain SQL Generation Error: {e}")
        sql_query = ""

    db_results = []
    explanation = "SQL compiled successfully." if sql_query else "General conversation query."
    
    # 3. Safe database execution
    if sql_query:
        # Security Guard: Only SELECT queries allowed
        if not re.match(r"^\s*SELECT", sql_query, re.IGNORECASE):
            sql_query = ""
            explanation = "SQL blocked for security (Only SELECT allowed)."
        else:
            try:
                # Use LangChain DB utility to run query
                raw_results = db.run(sql_query)
                # Convert raw string output to python dicts if possible
                try:
                    # In SQLite, db.run returns string representation of list of tuples.
                    # We will query via standard sqlite3 to get JSON-serializable Row dicts.
                    conn = sqlite3.connect(DB_PATH)
                    conn.row_factory = sqlite3.Row
                    cursor = conn.cursor()
                    cursor.execute(sql_query)
                    rows = cursor.fetchall()
                    db_results = [dict(row) for row in rows]
                    conn.close()
                except Exception:
                    db_results = [{"result": raw_results}]
            except Exception as e:
                db_results = [{"error": str(e)}]
                explanation = "SQL execution failed."

    # 4. Response Synthesis Chain
    try:
        synthesis_system = """
        You are KSP-CrimePilot, a helpful, voice-enabled AI investigator assistant.
        Your task is to answer the user query in the requested language ({language}).
        Answer based on the database results: {results}
        If the results list is empty or contains errors, explain that no matching records were found.
        Keep your response professional, clear, and structured.
        """
        
        synth_prompt = ChatPromptTemplate.from_messages([
            ("system", synthesis_system),
            ("human", "User: {query}")
        ])
        
        synth_chain = synth_prompt | llm | StrOutputParser()
        natural_response = synth_chain.invoke({
            "query": user_msg,
            "language": lang,
            "results": json.dumps(db_results)
        }).strip()
        
    except Exception as e:
        natural_response = f"Error generating answer: {e}"

    # 5. Extract visual nodes and coordinates dynamically
    coordinates = []
    nodes = []
    edges = []
    
    for row in db_results:
        if "latitude" in row and "longitude" in row and row["latitude"] and row["longitude"]:
            coordinates.append({
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "label": row.get("CrimeNo") or row.get("BriefFacts", "")[:30]
            })
        
        if "AccusedName" in row:
            acc_id = f"acc_{row['AccusedName'].replace(' ', '_').lower()}"
            nodes.append({"id": acc_id, "label": row["AccusedName"], "type": "accused"})
            if "CaseMasterID" in row:
                edges.append({
                    "source": acc_id, 
                    "target": f"case_{row['CaseMasterID']}", 
                    "label": "Accused"
                })
        if "VictimName" in row:
            label = "Victim" if user.get("role") == "Policymaker" else row["VictimName"]
            vic_id = f"vic_{row.get('VictimMasterID', hash(label))}"
            nodes.append({"id": vic_id, "label": label, "type": "victim"})
            if "CaseMasterID" in row:
                edges.append({
                    "source": vic_id, 
                    "target": f"case_{row['CaseMasterID']}", 
                    "label": "Victimized"
                })

    return {
        "response": natural_response,
        "sql_query": sql_query,
        "explanation": explanation,
        "data": db_results if user.get("role") != "Policymaker" else [{"anonymized": "Data hidden for policymaker governance"}],
        "nodes": nodes,
        "edges": edges,
        "coordinates": coordinates
    }
