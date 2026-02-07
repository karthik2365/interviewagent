"""
CrewAI Task Definitions — one task per interview round.

Tasks encode what each agent must produce and the format of their output.
Context is injected at runtime by crew_runner.py (AGENT CONTEXT principle).
"""

from crewai import Task, Agent


# ── Round 1: Screening ──────────────────────────────────────────────

def create_screening_task(agent: Agent, resume: str, role: str) -> Task:
    """
    Screening task — agent evaluates resume against a specific role.
    """
    return Task(
        description=(
            f"You are conducting a resume screening for the **{role}** role.\n\n"
            f"## TARGET ROLE\n{role}\n\n"
            f"## CANDIDATE RESUME\n{resume}\n\n"
            f"## YOUR TASK\n"
            f"1. Evaluate the resume specifically for the **{role}** role — assess role fit, relevant skills, and experience.\n"
            f"2. Identify strengths and weaknesses relative to the {role} position.\n"
            f"3. Decide: PASS, BORDERLINE, or FAIL.\n"
            f"4. Assign a score from 0 to 10.\n"
            f"5. Generate 2-3 technical questions you would recommend for the next round, tailored to the {role} role.\n\n"
            f"## REQUIRED OUTPUT FORMAT (follow exactly)\n"
            f"ROUND 1 — SCREENING (Role: {role})\n\n"
            f"Decision: [PASS|BORDERLINE|FAIL]\n"
            f"Score: [X] / 10\n\n"
            f"Strengths: [key strengths for {role}]\n"
            f"Weaknesses: [key weaknesses for {role}]\n\n"
            f"Reasoning: [detailed explanation of fit for {role}]\n\n"
            f"Recommended Questions for Next Round:\n"
            f"1. [question]\n"
            f"2. [question]\n"
            f"3. [question]"
        ),
        expected_output=(
            "A structured verdict with Decision (PASS/BORDERLINE/FAIL), "
            "Score (0-10), Strengths, Weaknesses, Reasoning, and "
            "Recommended Questions for the next round."
        ),
        agent=agent,
    )


# ── Round 2: Technical ──────────────────────────────────────────────

def create_technical_question_task(
    agent: Agent,
    resume: str,
    round1_verdict: str,
) -> Task:
    """
    Technical round — generate questions based on resume + screening verdict.
    """
    return Task(
        description=(
            f"You are conducting a technical interview.\n\n"
            f"## CANDIDATE RESUME\n{resume}\n\n"
            f"## SCREENING VERDICT (Round 1)\n{round1_verdict}\n\n"
            f"## YOUR TASK\n"
            f"Based on the resume and the screening verdict, generate exactly "
            f"2-3 targeted technical questions. The questions should probe the "
            f"candidate's claimed skills and address any weaknesses noted in "
            f"the screening.\n\n"
            f"## REQUIRED OUTPUT FORMAT\n"
            f"TECHNICAL INTERVIEW QUESTIONS\n\n"
            f"1. [question]\n"
            f"2. [question]\n"
            f"3. [question]"
        ),
        expected_output="2-3 targeted technical questions.",
        agent=agent,
    )


def create_technical_evaluation_task(
    agent: Agent,
    resume: str,
    round1_verdict: str,
    questions: str,
    answer: str,
) -> Task:
    """
    Technical round — evaluate candidate's answers.
    """
    return Task(
        description=(
            f"You are evaluating a candidate's technical interview answers.\n\n"
            f"## CANDIDATE RESUME\n{resume}\n\n"
            f"## SCREENING VERDICT (Round 1)\n{round1_verdict}\n\n"
            f"## TECHNICAL QUESTIONS ASKED\n{questions}\n\n"
            f"## CANDIDATE'S ANSWERS\n{answer}\n\n"
            f"## YOUR TASK\n"
            f"1. Evaluate each answer for correctness, depth, and clarity.\n"
            f"2. Identify strengths and weaknesses.\n"
            f"3. Decide: PASS or FAIL.\n"
            f"4. Assign a score from 0 to 10.\n\n"
            f"## REQUIRED OUTPUT FORMAT (follow exactly)\n"
            f"ROUND 2 — TECHNICAL\n\n"
            f"Decision: [PASS|FAIL]\n"
            f"Score: [X] / 10\n\n"
            f"Strengths: [key strengths]\n"
            f"Weaknesses: [key weaknesses]\n\n"
            f"Reasoning: [detailed evaluation of answers]"
        ),
        expected_output=(
            "A structured verdict with Decision (PASS/FAIL), "
            "Score (0-10), Strengths, Weaknesses, and Reasoning."
        ),
        agent=agent,
    )


# ── Round 3: Scenario ───────────────────────────────────────────────

def create_scenario_question_task(
    agent: Agent,
    resume: str,
    round1_verdict: str,
    round2_verdict: str,
) -> Task:
    """
    Scenario round — generate a realistic production scenario question.
    """
    return Task(
        description=(
            f"You are designing a scenario-based interview question.\n\n"
            f"## CANDIDATE RESUME\n{resume}\n\n"
            f"## SCREENING VERDICT (Round 1)\n{round1_verdict}\n\n"
            f"## TECHNICAL VERDICT (Round 2)\n{round2_verdict}\n\n"
            f"## YOUR TASK\n"
            f"Based on the candidate's background and previous round performance, "
            f"create ONE realistic production scenario or behavioral question that "
            f"tests decision-making, trade-off analysis, and practical judgment.\n\n"
            f"The scenario should be specific to their skill set and level.\n\n"
            f"## REQUIRED OUTPUT FORMAT\n"
            f"SCENARIO QUESTION\n\n"
            f"[Your detailed scenario/question here]"
        ),
        expected_output="One realistic production scenario or behavioral question.",
        agent=agent,
    )


def create_scenario_evaluation_task(
    agent: Agent,
    resume: str,
    round1_verdict: str,
    round2_verdict: str,
    question: str,
    answer: str,
) -> Task:
    """
    Scenario round — evaluate candidate's response.
    """
    return Task(
        description=(
            f"You are evaluating a candidate's scenario interview response.\n\n"
            f"## CANDIDATE RESUME\n{resume}\n\n"
            f"## SCREENING VERDICT (Round 1)\n{round1_verdict}\n\n"
            f"## TECHNICAL VERDICT (Round 2)\n{round2_verdict}\n\n"
            f"## SCENARIO QUESTION ASKED\n{question}\n\n"
            f"## CANDIDATE'S RESPONSE\n{answer}\n\n"
            f"## YOUR TASK\n"
            f"1. Evaluate the response for decision-making quality, trade-off "
            f"awareness, communication clarity, and practical judgment.\n"
            f"2. Identify strengths and weaknesses.\n"
            f"3. Decide: PASS, BORDERLINE, or FAIL.\n"
            f"4. Assign a score from 0 to 10.\n\n"
            f"## REQUIRED OUTPUT FORMAT (follow exactly)\n"
            f"ROUND 3 — SCENARIO\n\n"
            f"Decision: [PASS|BORDERLINE|FAIL]\n"
            f"Score: [X] / 10\n\n"
            f"Strengths: [key strengths]\n"
            f"Weaknesses: [key weaknesses]\n\n"
            f"Reasoning: [detailed evaluation]"
        ),
        expected_output=(
            "A structured verdict with Decision (PASS/BORDERLINE/FAIL), "
            "Score (0-10), Strengths, Weaknesses, and Reasoning."
        ),
        agent=agent,
    )


# ── Final: Hiring Committee ─────────────────────────────────────────

def create_hiring_decision_task(
    agent: Agent,
    round1_verdict: str,
    round2_verdict: str,
    round3_verdict: str,
) -> Task:
    """
    Hiring Committee — makes final decision based ONLY on verdicts.
    Does NOT receive the resume or raw answers.
    """
    return Task(
        description=(
            f"You are the hiring committee chair making the final hiring decision.\n\n"
            f"## IMPORTANT\n"
            f"You must base your decision ONLY on the interview verdicts below. "
            f"You do NOT have access to the candidate's resume or raw answers.\n\n"
            f"## ROUND 1 — SCREENING VERDICT\n{round1_verdict}\n\n"
            f"## ROUND 2 — TECHNICAL VERDICT\n{round2_verdict}\n\n"
            f"## ROUND 3 — SCENARIO VERDICT\n{round3_verdict}\n\n"
            f"## YOUR TASK\n"
            f"1. Synthesize all three round verdicts.\n"
            f"2. Identify patterns across feedback.\n"
            f"3. Make a final decision: HIRE, HOLD, or REJECT.\n"
            f"4. Provide detailed rationale.\n\n"
            f"## REQUIRED OUTPUT FORMAT (follow exactly)\n"
            f"FINAL HIRING DECISION\n\n"
            f"Decision: [HIRE|HOLD|REJECT]\n\n"
            f"Summary:\n"
            f"- Round 1 (Screening): [PASS/BORDERLINE/FAIL] — [brief note]\n"
            f"- Round 2 (Technical): [PASS/FAIL] — [brief note]\n"
            f"- Round 3 (Scenario): [PASS/BORDERLINE/FAIL] — [brief note]\n\n"
            f"Overall Assessment: [detailed rationale for final decision]\n\n"
            f"Recommendation: [final recommendation with any conditions or notes]"
        ),
        expected_output=(
            "A final hiring decision (HIRE/HOLD/REJECT) with summary of all "
            "rounds, overall assessment, and recommendation."
        ),
        agent=agent,
    )
