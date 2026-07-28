"""
SESSION CONTEXT — In-memory interview state.

This is short-lived, mutable, session-scoped state that tracks
the current interview progress. In production this would be
backed by Redis or a session store; in-memory is correct for
this scope.

The pipeline now has 5 stages:
  Round 1: Resume Screening
  Round 2: Technical Interview
  Round 3: Behavioral Interview
  Round 4: Hiring Recommendation (auto — no candidate input)
  Final:   Committee Decision (auto — no candidate input)
"""

import os
import shutil

VERDICTS_DIR = os.path.join(os.path.dirname(__file__), "verdicts")


# Available interview roles
AVAILABLE_ROLES = [
    "SDE 1",
    "SDE 2",
    "Senior Software Engineer",
    "AI Engineer",
    "ML Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Full-Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
]


# Pipeline stage definitions
PIPELINE_STAGES = [
    {"stage": 1, "name": "Resume Screening", "agent": "Screening Agent", "requires_input": False},
    {"stage": 2, "name": "Technical Interview", "agent": "Technical Agent", "requires_input": True},
    {"stage": 3, "name": "Behavioral Interview", "agent": "Behavioral Agent", "requires_input": True},
    {"stage": 4, "name": "Hiring Recommendation", "agent": "Recommendation Agent", "requires_input": False},
    {"stage": 5, "name": "Committee Decision", "agent": "Committee Evaluator", "requires_input": False},
]


def _empty_state() -> dict:
    return {
        "evaluation_id": None,
        "round": 1,
        "status": "ONGOING",  # ONGOING | REJECTED | COMPLETE
        "resume": "",
        "role": "",
        "candidate_name": "",
        "answers": {
            "round2": [],
            "round3": [],
        },
        "verdicts": {
            "round1": None,
            "round2": None,
            "round3": None,
            "round4": None,  # Hiring Recommendation
        },
        "questions": {
            "round2": None,
            "round3": None,
        },
        "final_decision": None,
    }


# Global in-memory state for the current interview session
interview_state: dict = _empty_state()


def reset_state() -> None:
    """Reset session context and clear verdict files for a new interview."""
    global interview_state
    interview_state = _empty_state()

    # Clear and recreate verdicts directory (DECISION MEMORY)
    if os.path.exists(VERDICTS_DIR):
        shutil.rmtree(VERDICTS_DIR)
    os.makedirs(VERDICTS_DIR, exist_ok=True)


def get_state() -> dict:
    """Return the current interview state."""
    return interview_state


def update_state(**kwargs) -> None:
    """Update specific keys in the interview state."""
    for key, value in kwargs.items():
        if key in interview_state:
            interview_state[key] = value


# Ensure verdicts directory exists on import
os.makedirs(VERDICTS_DIR, exist_ok=True)
