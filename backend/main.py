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

from fastapi import WebSocket, WebSocketDisconnect
from backend.websocket_manager import manager

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain active connection
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os

# Serve React build (dist directory) static assets and SPA routes
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

@app.exception_handler(404)
async def custom_404_handler(request, exc):
    # API endpoints should return JSON 404
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    # Serve index.html for frontend SPA routing
    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse(status_code=404, content={"detail": "Frontend assets not found. Build the frontend first."})

if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Bind to PORT environment variable assigned by AppSail
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
