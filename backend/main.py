"""
FastAPI Application Entry Point.

Multi-Round AI Interview Agent System
─────────────────────────────────────
4 specialized CrewAI agents conduct a multi-stage interview.
Each round produces a verdict file. The final agent reads all
verdicts and makes a hiring decision.

Memory Architecture:
  1. SESSION CONTEXT  — in-memory (state.py)
  2. DECISION MEMORY  — flat files (verdicts/*.txt)
  3. AGENT CONTEXT    — explicit passing (crew_runner.py)
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router

# Load environment variables from .env file
load_dotenv()

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Interview Agent System",
    description="Multi-round interview pipeline with specialized AI agents.",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — return JSON instead of plain text "Internal Server Error"
from fastapi.responses import JSONResponse
from starlette.requests import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    logger.error(f"Unhandled error: {error_msg}")

    # Detect rate-limit / quota errors from Gemini
    if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Gemini API rate limit reached. Please wait a moment and try again.",
                "error_type": "rate_limit",
            },
        )

    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {error_msg}"},
    )


app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "AI Interview Agent System",
        "status": "running",
        "endpoints": [
            "POST /start",
            "POST /round/2/answer",
            "POST /round/3/answer",
            "GET  /final-decision",
            "GET  /status",
        ],
    }
