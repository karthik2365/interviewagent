"""
FastAPI Application Entry Point.

Evalia — Multi-Agent Interview Evaluation System
─────────────────────────────────────────────────
5 specialized CrewAI agents conduct a multi-stage interview evaluation.
Each round produces a structured verdict. The final committee agent
reviews all verdicts (without seeing the resume) and makes a hiring decision.

Pipeline:
  1. Screening Agent     — evaluates resume fit
  2. Technical Agent     — evaluates technical answers
  3. Behavioral Agent    — evaluates behavioral/STAR responses
  4. Recommendation Agent — synthesizes a hiring recommendation
  5. Committee Evaluator — makes final HIRE/HOLD/REJECT decision

Memory Architecture:
  1. SESSION CONTEXT  — in-memory (state.py)
  2. DECISION MEMORY  — flat files (verdicts/*.txt) + SQLite (database.py)
  3. AGENT CONTEXT    — explicit passing (crew_runner.py)
"""

import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request

from routes import router
from database import init_db

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Application Lifecycle ────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("Initializing Evalia backend...")
    init_db()
    logger.info("Database initialized.")
    yield
    # Shutdown
    logger.info("Shutting down Evalia backend.")


app = FastAPI(
    title="Evalia — Multi-Agent Interview Evaluation System",
    description=(
        "A distributed interview evaluation pipeline comprising 5 autonomous AI agents "
        "for resume screening, technical assessment, behavioral evaluation, hiring "
        "recommendations, and an isolated committee decision."
    ),
    version="2.0.0",
    lifespan=lifespan,
)


# ── CORS ─────────────────────────────────────────────────────────────

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {error_msg}")

    # Detect rate-limit / quota errors from Gemini
    if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
        return JSONResponse(
            status_code=429,
            content={
                "detail": "AI rate limit reached. Please wait a moment and try again.",
                "error_type": "rate_limit",
            },
        )

    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {error_msg}"},
    )


# ── Routes ───────────────────────────────────────────────────────────

app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "Evalia — Multi-Agent Interview Evaluation System",
        "version": "2.0.0",
        "status": "running",
        "agents": [
            "Screening Agent",
            "Technical Agent",
            "Behavioral Agent",
            "Recommendation Agent",
            "Committee Evaluator",
        ],
        "endpoints": [
            "POST /start",
            "POST /round/2/answer",
            "POST /round/3/answer",
            "GET  /final-decision",
            "GET  /status",
            "GET  /roles",
            "GET  /evaluations",
            "GET  /evaluations/{id}",
            "GET  /evaluations/{id}/report",
            "GET  /evaluations/{id}/pipeline",
            "GET  /dashboard/stats",
        ],
    }
