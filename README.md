# Multi-Round AI Interview Agent System

A multi-stage interview pipeline powered by **4 specialized CrewAI agents** that simulate a real hiring process. Each round produces a structured verdict, and a final Hiring Committee agent synthesizes all feedback to make a HIRE / HOLD / REJECT decision.

---

## Architecture

### Memory Architecture (3 Types)

| Type | Storage | Purpose | Mutability |
|------|---------|---------|------------|
| **Session Context** | In-memory (`state.py`) | Current interview progress | Mutable, session-scoped |
| **Decision Memory** | Flat files (`verdicts/*.txt`) | Agent verdicts per round | Immutable audit trail |
| **Agent Context** | Explicit passing (`crew_runner.py`) | Scoped input to each agent | Read-only, deterministic |

### Interview Flow

```
Resume Upload → Round 1 (Screening) → Round 2 (Technical) → Round 3 (Scenario) → Final Decision
                    ↓ FAIL: REJECT        ↓ FAIL: REJECT        ↓ FAIL: REJECT
```

### Context Flow (Who Sees What)

| Agent | Resume | Round 1 | Round 2 | Round 3 |
|-------|--------|---------|---------|---------|
| Screening | ✅ | — | — | — |
| Technical | ✅ | ✅ | — | — |
| Scenario | ✅ | ✅ | ✅ | — |
| Hiring Committee | ❌ | ✅ | ✅ | ✅ |

> Agents don't remember arbitrarily. They reason only over explicit evidence passed to them.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Agents**: CrewAI
- **Communication**: REST API (JSON)
- **Persistence**: Flat files + in-memory state
- **No database required**

---

## Project Structure

```
project-root/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── routes.py            # API endpoints
│   ├── state.py             # In-memory session context
│   ├── agents.py            # 4 CrewAI agent definitions
│   ├── tasks.py             # CrewAI task definitions
│   ├── crew_runner.py       # Orchestration + context passing
│   ├── verdicts/            # Decision memory (generated at runtime)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Resume upload
│   │   ├── round/[id]/page.tsx   # Interview rounds
│   │   └── result/page.tsx       # Final decision
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Setup & Run

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Gemini API key (used by CrewAI agents)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# The Gemini API key is already configured in backend/.env
# If needed, you can update it in backend/.env or export it:
# export GEMINI_API_KEY="your-key-here"

# Start the server
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Open

Navigate to **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/start` | Upload resume, run screening |
| `POST` | `/round/2/answer` | Submit technical round answer |
| `POST` | `/round/3/answer` | Submit scenario round answer |
| `GET` | `/final-decision` | Get hiring committee decision |
| `GET` | `/status` | Check interview progress |

---

## Design Decisions

### Why in-memory session state?
Fast access during active interview. Would be Redis in production, but in-memory is correct for this scope.

### Why plain text verdict files?
Immutable audit trail. Human-readable AND agent-readable. Mirrors real hiring feedback systems. Version-controllable.

### Why explicit context passing?
No hidden state. No hallucinated memory. Full explainability. Each agent sees only what it should — deterministic reasoning.

### Why does the Hiring Committee NOT see the resume?
Just like real hiring committees — they judge on peer verdicts, not raw data. This prevents bias and ensures the committee evaluates the interview process itself.

---

## Verdict File Format

```
ROUND [N] — [ROUND NAME]

Decision: [PASS|BORDERLINE|FAIL]
Score: [X] / 10

Strengths: [...]
Weaknesses: [...]

Reasoning: [Detailed explanation]
```

---

## License

MIT
