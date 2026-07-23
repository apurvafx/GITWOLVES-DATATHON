from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import auth, cases, chat
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

app = FastAPI(
    title="KSP-CrimePilot API",
    description="Backend API for KSP-CrimePilot Conversational AI and Crime Analytics Platform",
    version="1.0.0"
)

# Configure CORS for frontend access (Vite on 5173, Next.js on 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon ease of development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(chat.router)

@app.get("/")
def get_status():
    return {
        "status": "online",
        "service": "KSP-CrimePilot API Gateway",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
