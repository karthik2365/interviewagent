"""
Crew Runner — Orchestrates agent execution with explicit context passing.

This is the heart of the AGENT CONTEXT architecture. Each agent receives
only the context it is explicitly given. No hidden state, no shared memory.
"""

import os
import re
import time
import logging
from crewai import Crew

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 60  # seconds to wait on rate-limit


def _run_crew_with_retry(crew: Crew) -> str:
    """Run a CrewAI Crew with retry logic for rate-limit errors."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = crew.kickoff()
            return str(result)
        except Exception as e:
            err = str(e)
            if "429" in err or "quota" in err.lower() or "rate" in err.lower():
                if attempt < MAX_RETRIES:
                    wait = RETRY_DELAY * attempt
                    logger.warning(
                        f"Rate limited (attempt {attempt}/{MAX_RETRIES}). "
                        f"Retrying in {wait}s..."
                    )
                    time.sleep(wait)
                    continue
            raise

from agents import (
    create_screening_agent,
    create_technical_agent,
    create_scenario_agent,
    create_hiring_committee_agent,
)
from tasks import (
    create_screening_task,
    create_technical_question_task,
    create_technical_evaluation_task,
    create_scenario_question_task,
    create_scenario_evaluation_task,
    create_hiring_decision_task,
)
from state import VERDICTS_DIR

# ── Helpers ──────────────────────────────────────────────────────────


def _read_verdict(filename: str) -> str:
    """Read a verdict file from DECISION MEMORY."""
    path = os.path.join(VERDICTS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Verdict file not found: {path}")
    with open(path, "r") as f:
        return f.read()


def _write_verdict(filename: str, content: str) -> str:
    """Write a verdict file to DECISION MEMORY and return the path."""
    path = os.path.join(VERDICTS_DIR, filename)
    os.makedirs(VERDICTS_DIR, exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    return path


def _parse_decision(verdict_text: str) -> str:
    """
    Extract the decision (PASS/FAIL/BORDERLINE/HIRE/HOLD/REJECT)
    from a verdict string.
    """
    match = re.search(
        r"Decision:\s*(PASS|FAIL|BORDERLINE|HIRE|HOLD|REJECT)",
        verdict_text,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).upper()
    # Fallback — look for keywords anywhere
    upper = verdict_text.upper()
    for keyword in ["FAIL", "REJECT", "BORDERLINE", "HOLD", "PASS", "HIRE"]:
        if keyword in upper:
            return keyword
    return "BORDERLINE"


# ── Round 1: Screening ──────────────────────────────────────────────


def run_screening(resume: str, role: str) -> dict:
    """
    Run the Screening Agent.
    AGENT CONTEXT: Resume + target role.
    Writes: verdicts/round1.txt
    """
    agent = create_screening_agent()
    task = create_screening_task(agent, resume, role)

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    verdict_text = _run_crew_with_retry(crew)

    # Write to DECISION MEMORY
    _write_verdict("round1.txt", verdict_text)

    decision = _parse_decision(verdict_text)

    return {
        "round": 1,
        "decision": decision,
        "verdict": verdict_text,
    }


# ── Round 2: Technical (Question Generation) ────────────────────────


def run_technical_questions(resume: str) -> dict:
    """
    Generate technical questions.
    AGENT CONTEXT: Resume + round1.txt verdict.
    """
    round1_verdict = _read_verdict("round1.txt")
    agent = create_technical_agent()
    task = create_technical_question_task(agent, resume, round1_verdict)

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    questions = _run_crew_with_retry(crew)

    return {
        "round": 2,
        "questions": questions,
    }


def run_technical_evaluation(resume: str, questions: str, answer: str) -> dict:
    """
    Evaluate technical answers.
    AGENT CONTEXT: Resume + round1.txt + candidate answers.
    Writes: verdicts/round2.txt
    """
    round1_verdict = _read_verdict("round1.txt")
    agent = create_technical_agent()
    task = create_technical_evaluation_task(
        agent, resume, round1_verdict, questions, answer
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    verdict_text = _run_crew_with_retry(crew)

    _write_verdict("round2.txt", verdict_text)

    decision = _parse_decision(verdict_text)

    return {
        "round": 2,
        "decision": decision,
        "verdict": verdict_text,
    }


# ── Round 3: Scenario (Question Generation) ─────────────────────────


def run_scenario_question(resume: str) -> dict:
    """
    Generate scenario question.
    AGENT CONTEXT: Resume + round1.txt + round2.txt.
    """
    round1_verdict = _read_verdict("round1.txt")
    round2_verdict = _read_verdict("round2.txt")
    agent = create_scenario_agent()
    task = create_scenario_question_task(
        agent, resume, round1_verdict, round2_verdict
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    question = _run_crew_with_retry(crew)

    return {
        "round": 3,
        "question": question,
    }


def run_scenario_evaluation(resume: str, question: str, answer: str) -> dict:
    """
    Evaluate scenario answer.
    AGENT CONTEXT: Resume + round1.txt + round2.txt + candidate answer.
    Writes: verdicts/round3.txt
    """
    round1_verdict = _read_verdict("round1.txt")
    round2_verdict = _read_verdict("round2.txt")
    agent = create_scenario_agent()
    task = create_scenario_evaluation_task(
        agent, resume, round1_verdict, round2_verdict, question, answer
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    verdict_text = _run_crew_with_retry(crew)

    _write_verdict("round3.txt", verdict_text)

    decision = _parse_decision(verdict_text)

    return {
        "round": 3,
        "decision": decision,
        "verdict": verdict_text,
    }


# ── Final: Hiring Committee ─────────────────────────────────────────


def run_hiring_committee() -> dict:
    """
    Run the Hiring Committee Agent.
    AGENT CONTEXT: ONLY verdict files (no resume, no raw answers).
    This is a critical design choice — the committee judges on peer verdicts.
    """
    round1_verdict = _read_verdict("round1.txt")
    round2_verdict = _read_verdict("round2.txt")
    round3_verdict = _read_verdict("round3.txt")

    agent = create_hiring_committee_agent()
    task = create_hiring_decision_task(
        agent, round1_verdict, round2_verdict, round3_verdict
    )

    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    decision_text = _run_crew_with_retry(crew)

    decision = _parse_decision(decision_text)

    return {
        "decision": decision,
        "rationale": decision_text,
    }
