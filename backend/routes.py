"""
API Routes — FastAPI endpoints for the interview pipeline.

FastAPI handles orchestration only — no decision-making logic here.
All decisions are made by CrewAI agents via crew_runner.py.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from state import get_state, update_state, reset_state, interview_state
from crew_runner import (
    run_screening,
    run_technical_questions,
    run_technical_evaluation,
    run_scenario_question,
    run_scenario_evaluation,
    run_hiring_committee,
)

router = APIRouter()


# ── Request / Response Models ────────────────────────────────────────


class StartRequest(BaseModel):
    resume: str


class AnswerRequest(BaseModel):
    answer: str


# ── POST /start ──────────────────────────────────────────────────────


@router.post("/start")
async def start_interview(req: StartRequest):
    """
    Start a new interview.
    - Resets session context and decision memory
    - Stores resume in SESSION CONTEXT
    - Runs ScreeningAgent with resume only (AGENT CONTEXT)
    - Writes verdict to DECISION MEMORY (verdicts/round1.txt)
    - Returns verdict + next round info
    """
    if not req.resume.strip():
        raise HTTPException(status_code=400, detail="Resume cannot be empty.")

    # Reset everything for a fresh interview
    reset_state()
    update_state(resume=req.resume.strip())

    # Run Round 1 — Screening Agent (context: resume only)
    result = run_screening(req.resume.strip())

    # Update SESSION CONTEXT
    interview_state["verdicts"]["round1"] = "verdicts/round1.txt"

    decision = result["decision"]

    if decision == "FAIL":
        update_state(status="REJECTED")
        return {
            "round": 1,
            "decision": "FAIL",
            "verdict": result["verdict"],
            "status": "REJECTED",
            "message": "The candidate did not pass the screening round.",
        }

    # PASS or BORDERLINE — generate technical questions for Round 2
    tech_result = run_technical_questions(get_state()["resume"])
    interview_state["questions"]["round2"] = tech_result["questions"]
    update_state(round=2)

    return {
        "round": 1,
        "decision": decision,
        "verdict": result["verdict"],
        "status": "ONGOING",
        "next_round": 2,
        "question": tech_result["questions"],
    }


# ── POST /round/2/answer ────────────────────────────────────────────


@router.post("/round/2/answer")
async def round2_answer(req: AnswerRequest):
    """
    Submit answer for Round 2 (Technical).
    - Stores answer in SESSION CONTEXT
    - Runs TechnicalAgent with AGENT CONTEXT (resume + round1.txt)
    - Writes verdict to verdicts/round2.txt
    - Returns verdict + next round or rejection
    """
    state = get_state()

    if state["status"] != "ONGOING":
        raise HTTPException(status_code=400, detail=f"Interview is {state['status']}.")
    if state["round"] != 2:
        raise HTTPException(
            status_code=400, detail=f"Expected round 2, currently at round {state['round']}."
        )
    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    # Store answer in SESSION CONTEXT
    interview_state["answers"]["round2"].append(req.answer.strip())

    # Run Technical evaluation (context: resume + round1.txt + answers)
    questions = interview_state["questions"]["round2"] or ""
    result = run_technical_evaluation(
        state["resume"], questions, req.answer.strip()
    )

    # Update SESSION CONTEXT
    interview_state["verdicts"]["round2"] = "verdicts/round2.txt"

    decision = result["decision"]

    if decision == "FAIL":
        update_state(status="REJECTED")
        return {
            "round": 2,
            "decision": "FAIL",
            "verdict": result["verdict"],
            "status": "REJECTED",
            "message": "The candidate did not pass the technical round.",
        }

    # PASS — generate scenario question for Round 3
    scenario_result = run_scenario_question(state["resume"])
    interview_state["questions"]["round3"] = scenario_result["question"]
    update_state(round=3)

    return {
        "round": 2,
        "decision": decision,
        "verdict": result["verdict"],
        "status": "ONGOING",
        "next_round": 3,
        "question": scenario_result["question"],
    }


# ── POST /round/3/answer ────────────────────────────────────────────


@router.post("/round/3/answer")
async def round3_answer(req: AnswerRequest):
    """
    Submit answer for Round 3 (Scenario).
    - Stores answer in SESSION CONTEXT
    - Runs ScenarioAgent with AGENT CONTEXT (resume + round1.txt + round2.txt)
    - Writes verdict to verdicts/round3.txt
    - Returns completion status
    """
    state = get_state()

    if state["status"] != "ONGOING":
        raise HTTPException(status_code=400, detail=f"Interview is {state['status']}.")
    if state["round"] != 3:
        raise HTTPException(
            status_code=400, detail=f"Expected round 3, currently at round {state['round']}."
        )
    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    # Store answer in SESSION CONTEXT
    interview_state["answers"]["round3"].append(req.answer.strip())

    # Run Scenario evaluation
    question = interview_state["questions"]["round3"] or ""
    result = run_scenario_evaluation(
        state["resume"], question, req.answer.strip()
    )

    # Update SESSION CONTEXT
    interview_state["verdicts"]["round3"] = "verdicts/round3.txt"

    decision = result["decision"]

    if decision == "FAIL":
        update_state(status="REJECTED")
        return {
            "round": 3,
            "decision": "FAIL",
            "verdict": result["verdict"],
            "status": "REJECTED",
            "message": "The candidate did not pass the scenario round.",
        }

    # PASS or BORDERLINE — mark complete
    update_state(status="COMPLETE", round=4)

    return {
        "round": 3,
        "decision": decision,
        "verdict": result["verdict"],
        "status": "COMPLETE",
        "next": "/final-decision",
    }


# ── GET /final-decision ─────────────────────────────────────────────


@router.get("/final-decision")
async def final_decision():
    """
    Get the final hiring decision.
    - Runs HiringCommitteeAgent with AGENT CONTEXT (all verdict files ONLY)
    - The committee does NOT see the resume or raw answers
    - Returns final decision + rationale
    """
    state = get_state()

    if state["status"] == "REJECTED":
        return {
            "decision": "REJECT",
            "rationale": "Candidate was rejected in an earlier round.",
            "status": "REJECTED",
        }

    if state["status"] != "COMPLETE":
        raise HTTPException(
            status_code=400,
            detail="Interview is not complete. All rounds must be finished first.",
        )

    # Check for cached decision
    if state["final_decision"]:
        return state["final_decision"]

    # Run Hiring Committee (context: ONLY verdict files — no resume)
    result = run_hiring_committee()

    # Cache the result
    final = {
        "decision": result["decision"],
        "rationale": result["rationale"],
        "status": "COMPLETE",
    }
    interview_state["final_decision"] = final

    return final


# ── GET /status ──────────────────────────────────────────────────────


@router.get("/status")
async def get_interview_status():
    """Return current interview state (for frontend polling / debugging)."""
    state = get_state()
    return {
        "round": state["round"],
        "status": state["status"],
        "has_resume": bool(state["resume"]),
        "verdicts": {
            k: v is not None for k, v in state["verdicts"].items()
        },
    }
