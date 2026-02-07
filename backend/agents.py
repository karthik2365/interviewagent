"""
CrewAI Agent Definitions — 4 specialized interview agents.

Each agent has a clear, isolated responsibility and receives
only the context it is explicitly given (AGENT CONTEXT principle).
"""

from crewai import Agent

# LLM model — Gemini 2.0 Flash via LiteLLM provider prefix
LLM_MODEL = "gemini/gemini-2.0-flash"


def create_screening_agent() -> Agent:
    """
    Round 1 — Screening Agent.
    Input: Resume only.
    Evaluates: Role fit, skill coverage, experience level.
    """
    return Agent(
        role="Senior Technical Recruiter",
        goal=(
            "Screen the candidate's resume for role fit, relevant skills, "
            "and experience. Determine if they should advance to the technical round."
        ),
        backstory=(
            "You are a seasoned technical recruiter with 15 years of experience "
            "screening candidates for top tech companies. You evaluate resumes "
            "objectively, looking for relevant technical skills, project experience, "
            "education background, and career progression. You are thorough but fair, "
            "giving candidates the benefit of the doubt when evidence is borderline."
        ),
        llm=LLM_MODEL,
        verbose=True,
        allow_delegation=False,
    )


def create_technical_agent() -> Agent:
    """
    Round 2 — Technical Agent.
    Input: Resume + round1.txt verdict.
    Asks: 2-3 role-specific technical questions.
    Evaluates: Correctness, depth, structure.
    """
    return Agent(
        role="Senior Technical Interviewer",
        goal=(
            "Conduct a technical interview by asking 2-3 targeted technical "
            "questions based on the candidate's resume and screening results. "
            "Evaluate the candidate's answers for correctness, depth, and clarity."
        ),
        backstory=(
            "You are a principal engineer with deep expertise across backend systems, "
            "distributed computing, algorithms, and system design. You ask questions "
            "that reveal true understanding versus surface-level knowledge. You value "
            "clear reasoning, awareness of trade-offs, and practical problem-solving "
            "over memorized textbook answers."
        ),
        llm=LLM_MODEL,
        verbose=True,
        allow_delegation=False,
    )


def create_scenario_agent() -> Agent:
    """
    Round 3 — Scenario / Behavioral Agent.
    Input: Resume + round1.txt + round2.txt.
    Asks: 1 realistic production/scenario question.
    Evaluates: Decision-making, trade-offs, practical thinking.
    """
    return Agent(
        role="Engineering Manager — Scenario Interviewer",
        goal=(
            "Present the candidate with a realistic production scenario or "
            "behavioral question. Evaluate their decision-making, ability to "
            "navigate trade-offs, communication, and practical engineering judgment."
        ),
        backstory=(
            "You are an engineering manager who has led teams through complex "
            "production incidents, system migrations, and scaling challenges. "
            "You believe the best engineers are those who can think on their feet, "
            "communicate trade-offs clearly, and make sound decisions under pressure. "
            "You design scenarios that test real-world judgment, not trivia."
        ),
        llm=LLM_MODEL,
        verbose=True,
        allow_delegation=False,
    )


def create_hiring_committee_agent() -> Agent:
    """
    Final Round — Hiring Committee Agent.
    Input: ONLY verdict files (round1.txt + round2.txt + round3.txt).
    Does NOT see the resume or raw candidate answers.
    Makes: Final HIRE / HOLD / REJECT decision.
    """
    return Agent(
        role="Hiring Committee Chair",
        goal=(
            "Review all interview round verdicts and make a final hiring "
            "decision. You must base your decision ONLY on the verdict files "
            "from previous rounds — you do not see the resume or raw answers."
        ),
        backstory=(
            "You chair the hiring committee at a top-tier tech company. "
            "Your role is to synthesize feedback from multiple interviewers "
            "and make a fair, defensible hiring decision. You weigh each "
            "round's assessment carefully, look for patterns across feedback, "
            "and consider the overall signal strength. You are calibrated, "
            "consistent, and prioritize evidence over gut feeling."
        ),
        llm=LLM_MODEL,
        verbose=True,
        allow_delegation=False,
    )
