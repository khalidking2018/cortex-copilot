from fastapi import FastAPI
import os
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routers.login import router as login_router
from routers.dashboard import router as dashboard_router
from routers.analytics import router as analytics_router
from routers.chat import router as chat_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production/CORS safety
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(chat_router)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "message": "Cortex Copilot Running 🚀"
    }

# Serve static files from React build directory if it exists
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")