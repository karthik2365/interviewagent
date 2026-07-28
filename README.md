# Evalia — Multi-Agent Interview Evaluation System

Evalia is an enterprise-grade candidate evaluation pipeline powered by **5 specialized CrewAI agents** using **Google Gemini AI**. Each stage produces a structured, Pydantic-validated verdict, culminating in an independent Hiring Committee decision isolated from raw resume bias.

---

## Architecture

### Memory Architecture (3 Types)

| Type | Storage | Purpose | Mutability |
|------|---------|---------|------------|
| **Session Context** | In-memory (`state.py`) | Current interview session state | Mutable, session-scoped |
| **Decision Memory** | SQLite (`database.py`) + JSON files (`verdicts/`) | Persistent agent verdicts & evaluation logs | Immutable audit trail |
| **Agent Context** | Explicit passing (`crew_runner.py`) | Scoped context passed to each agent | Read-only, deterministic |

### Pipeline Flow

```
Resume Upload → Round 1 (Screening) → Round 2 (Technical) → Round 3 (Behavioral) → Round 4 (Recommendation) → Committee Decision
                    ↓ FAIL: REJECT        ↓ FAIL: REJECT        ↓ FAIL: REJECT
```

### Context Flow (Bias Isolation)

| Agent | Resume | Round 1 | Round 2 | Round 3 | Round 4 |
|-------|--------|---------|---------|---------|---------|
| Screening Agent | YES | — | — | — | — |
| Technical Agent | YES | YES | — | — | — |
| Behavioral Agent | YES | YES | YES | — | — |
| Recommendation Agent | NO | YES | YES | YES | — |
| Committee Evaluator | NO | YES | YES | YES | YES |

> **Bias Isolation**: The Committee Evaluator receives ONLY peer agent verdicts — raw resumes and candidate details are explicitly excluded to ensure decisions judge demonstrated interview evidence alone.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python 3.11+) + Pydantic v2
- **Agent Framework**: CrewAI
- **LLM Engine**: Google Gemini 2.5 Flash
- **Persistence**: SQLite (`database.py`) + structured JSON verdict logs (`verdicts/`)

---

## Project Structure

```
interviewagent/
├── backend/
│   ├── main.py              # FastAPI entry point & CORS configuration
│   ├── routes.py            # RESTful API endpoints for pipeline & dashboards
│   ├── database.py          # SQLite persistence & query layer
│   ├── models.py            # Pydantic schemas for structured JSON output
│   ├── agents.py            # 5 CrewAI agent definitions
│   ├── tasks.py             # Task prompts enforcing JSON output schemas
│   ├── crew_runner.py       # Multi-agent orchestrator & rate-limit retries
│   ├── state.py             # Session state & 5-stage pipeline definitions
│   ├── verdicts/            # Runtime decision memory (JSON & text)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout & SEO metadata
│   │   ├── page.tsx         # Sleek 12-section overview page
│   │   ├── interview/       # Candidate setup & resume submission
│   │   ├── round/[id]/      # Technical & behavioral interview rounds
│   │   ├── result/          # Structured evaluation report
│   │   └── dashboard/       # Recruiter dashboard & evaluation detail views
│   ├── package.json
│   ├── next.config.js       # API proxy configuration to FastAPI
│   └── tailwind.config.js
└── README.md
```

---

## Setup & Run Instructions

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- A **Google Gemini API Key** (configured in `backend/.env`)

---

### 1. Start Backend (FastAPI)

```bash
cd backend

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8000)
uvicorn main:app --reload --port 8000
```

---

### 2. Start Frontend (Next.js)

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server (runs on port 3000)
npm run dev
```

---

### 3. Open in Browser

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

> Note: The Next.js dev server automatically proxies `/api/*` requests to the FastAPI backend running at `http://127.0.0.1:8000`.

---

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/start` | Reset session, create evaluation, run Screening Agent |
| `POST` | `/round/2/answer` | Submit technical answer, run Technical Agent |
| `POST` | `/round/3/answer` | Submit behavioral answer, run Behavioral Agent |
| `GET` | `/final-decision` | Run Recommendation Agent & Committee Evaluator |
| `GET` | `/evaluations` | List all evaluations with filtering & pagination |
| `GET` | `/evaluations/{id}` | Get evaluation detail with all agent verdicts |
| `GET` | `/evaluations/{id}/report` | Get full structured evaluation report |
| `GET` | `/dashboard/stats` | Get aggregated stats (total, hired, hire rate, avg score) |
| `GET` | `/roles` | List available target engineering roles |
| `GET` | `/status` | Check current session status |

---

## License

MIT