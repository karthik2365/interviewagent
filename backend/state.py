"""
SESSION CONTEXT — In-memory interview state.

This is short-lived, mutable, session-scoped state that tracks
the current interview progress. In production this would be
backed by Redis or a session store; in-memory is correct for
this scope.
"""

import os
import shutil

VERDICTS_DIR = os.path.join(os.path.dirname(__file__), "verdicts")


def _empty_state() -> dict:
    return {
        "round": 1,
        "status": "ONGOING",  # ONGOING | REJECTED | COMPLETE
        "resume": "",
        "answers": {
            "round1": [],
            "round2": [],
            "round3": [],
        },
        "verdicts": {
            "round1": None,
            "round2": None,
            "round3": None,
        },
        "questions": {
            "round1": None,
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
