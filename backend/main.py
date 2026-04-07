from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import upload, analysis, model

app = FastAPI(title="AI Learning Dashboard API", description="Production-grade AI Data Analysis backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development; adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(model.router, prefix="/api/model", tags=["Machine Learning"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Learning Dashboard Backend is running."}
