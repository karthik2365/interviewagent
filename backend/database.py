"""
Database Module — SQLite persistence for evaluations and verdicts.

Provides a lightweight, zero-dependency persistence layer for storing
candidate evaluations, agent verdicts, and final decisions.
"""

import sqlite3
import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "evalia.db")


def get_connection() -> sqlite3.Connection:
    """Get a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Initialize database schema. Safe to call multiple times."""
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS evaluations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT DEFAULT '',
                resume_text TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
                current_round INTEGER NOT NULL DEFAULT 1,
                overall_score REAL,
                final_decision TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS agent_verdicts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evaluation_id INTEGER NOT NULL,
                agent_type TEXT NOT NULL,
                round_number INTEGER NOT NULL,
                verdict_json TEXT NOT NULL,
                verdict_text TEXT NOT NULL DEFAULT '',
                score REAL,
                decision TEXT,
                confidence REAL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS interview_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evaluation_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                questions_text TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS interview_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evaluation_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                answer_text TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_verdicts_eval ON agent_verdicts(evaluation_id);
            CREATE INDEX IF NOT EXISTS idx_questions_eval ON interview_questions(evaluation_id);
            CREATE INDEX IF NOT EXISTS idx_answers_eval ON interview_answers(evaluation_id);
            CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
        """)
        conn.commit()
        logger.info("Database initialized successfully.")
    finally:
        conn.close()


# ── Evaluation CRUD ────────────────────────────────────────────────


def create_evaluation(resume_text: str, role: str, candidate_name: str = "") -> int:
    """Create a new evaluation and return its ID."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO evaluations (candidate_name, resume_text, role) VALUES (?, ?, ?)",
            (candidate_name, resume_text, role),
        )
        conn.commit()
        eval_id = cursor.lastrowid
        logger.info(f"Created evaluation {eval_id} for role '{role}'")
        return eval_id
    finally:
        conn.close()


def get_evaluation(eval_id: int) -> Optional[dict]:
    """Get a single evaluation by ID."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM evaluations WHERE id = ?", (eval_id,)
        ).fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()


def list_evaluations(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """List evaluations with optional status filter."""
    conn = get_connection()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM evaluations WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (status, limit, offset),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM evaluations ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def count_evaluations(status: Optional[str] = None) -> int:
    """Count total evaluations."""
    conn = get_connection()
    try:
        if status:
            row = conn.execute(
                "SELECT COUNT(*) as c FROM evaluations WHERE status = ?", (status,)
            ).fetchone()
        else:
            row = conn.execute("SELECT COUNT(*) as c FROM evaluations").fetchone()
        return row["c"]
    finally:
        conn.close()


def update_evaluation(eval_id: int, **kwargs) -> None:
    """Update evaluation fields."""
    allowed = {"status", "current_round", "overall_score", "final_decision", "candidate_name"}
    fields = {k: v for k, v in kwargs.items() if k in allowed}
    if not fields:
        return
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [eval_id]
    conn = get_connection()
    try:
        conn.execute(f"UPDATE evaluations SET {set_clause} WHERE id = ?", values)
        conn.commit()
    finally:
        conn.close()


# ── Agent Verdicts ─────────────────────────────────────────────────


def save_verdict(
    evaluation_id: int,
    agent_type: str,
    round_number: int,
    verdict_json: dict,
    verdict_text: str = "",
    score: Optional[float] = None,
    decision: Optional[str] = None,
    confidence: Optional[float] = None,
) -> int:
    """Save an agent verdict."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """INSERT INTO agent_verdicts
               (evaluation_id, agent_type, round_number, verdict_json, verdict_text, score, decision, confidence)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                evaluation_id,
                agent_type,
                round_number,
                json.dumps(verdict_json),
                verdict_text,
                score,
                decision,
                confidence,
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_verdicts(evaluation_id: int) -> list[dict]:
    """Get all verdicts for an evaluation, ordered by round."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM agent_verdicts WHERE evaluation_id = ? ORDER BY round_number",
            (evaluation_id,),
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["verdict_json"] = json.loads(d["verdict_json"])
            result.append(d)
        return result
    finally:
        conn.close()


def get_verdict_by_round(evaluation_id: int, round_number: int) -> Optional[dict]:
    """Get verdict for a specific round."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM agent_verdicts WHERE evaluation_id = ? AND round_number = ?",
            (evaluation_id, round_number),
        ).fetchone()
        if row:
            d = dict(row)
            d["verdict_json"] = json.loads(d["verdict_json"])
            return d
        return None
    finally:
        conn.close()


# ── Questions & Answers ────────────────────────────────────────────


def save_questions(evaluation_id: int, round_number: int, questions_text: str) -> int:
    """Save interview questions for a round."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO interview_questions (evaluation_id, round_number, questions_text) VALUES (?, ?, ?)",
            (evaluation_id, round_number, questions_text),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_questions(evaluation_id: int, round_number: int) -> Optional[str]:
    """Get questions for a specific round."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT questions_text FROM interview_questions WHERE evaluation_id = ? AND round_number = ?",
            (evaluation_id, round_number),
        ).fetchone()
        return row["questions_text"] if row else None
    finally:
        conn.close()


def save_answer(evaluation_id: int, round_number: int, answer_text: str) -> int:
    """Save candidate answer for a round."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO interview_answers (evaluation_id, round_number, answer_text) VALUES (?, ?, ?)",
            (evaluation_id, round_number, answer_text),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_answer(evaluation_id: int, round_number: int) -> Optional[str]:
    """Get answer for a specific round."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT answer_text FROM interview_answers WHERE evaluation_id = ? AND round_number = ?",
            (evaluation_id, round_number),
        ).fetchone()
        return row["answer_text"] if row else None
    finally:
        conn.close()


# ── Dashboard Stats ────────────────────────────────────────────────


def get_dashboard_stats() -> dict:
    """Get aggregated statistics for the dashboard."""
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) as c FROM evaluations").fetchone()["c"]
        completed = conn.execute(
            "SELECT COUNT(*) as c FROM evaluations WHERE status = 'COMPLETE'"
        ).fetchone()["c"]
        in_progress = conn.execute(
            "SELECT COUNT(*) as c FROM evaluations WHERE status = 'IN_PROGRESS'"
        ).fetchone()["c"]
        rejected = conn.execute(
            "SELECT COUNT(*) as c FROM evaluations WHERE status = 'REJECTED'"
        ).fetchone()["c"]
        hired = conn.execute(
            "SELECT COUNT(*) as c FROM evaluations WHERE final_decision = 'HIRE'"
        ).fetchone()["c"]
        avg_score = conn.execute(
            "SELECT AVG(overall_score) as avg FROM evaluations WHERE overall_score IS NOT NULL"
        ).fetchone()["avg"]

        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "rejected": rejected,
            "hired": hired,
            "hire_rate": round(hired / completed * 100, 1) if completed > 0 else 0,
            "avg_score": round(avg_score, 1) if avg_score else 0,
        }
    finally:
        conn.close()
