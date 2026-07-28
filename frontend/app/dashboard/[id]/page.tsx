"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";

const API_BASE = "/api";

const DECISION_CLASSES: Record<string, string> = {
  HIRE: "status-tag-success",
  HOLD: "status-tag-warning",
  REJECT: "status-tag-error",
  PASS: "status-tag-success",
  FAIL: "status-tag-error",
  BORDERLINE: "status-tag-warning",
};

const PIPELINE_LABELS: Record<string, string> = {
  screening: "Resume Screening",
  technical: "Technical Interview",
  behavioral: "Behavioral Interview",
  recommendation: "Hiring Recommendation",
  committee: "Committee Decision",
};

type Report = {
  evaluation_id: number;
  candidate_name: string;
  role: string;
  status: string;
  overall_score: number | null;
  final_decision: string | null;
  pipeline: Array<{
    stage: number;
    name: string;
    agent: string;
    status: string;
    score: number | null;
    decision: string | null;
    verdict: any;
  }>;
  verdicts: Array<{
    agent_type: string;
    round_number: number;
    verdict_json: any;
    verdict_text: string;
    score: number | null;
    decision: string | null;
    confidence: number | null;
  }>;
  created_at: string;
  updated_at: string;
};

export default function EvaluationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const evalId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReport();
  }, [evalId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/evaluations/${evalId}/report`);
      if (!res.ok) throw new Error("Failed to load evaluation report.");
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text-muted)" }}>
          LOADING REPORT...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, fontSize: 13, color: "var(--color-error)", marginBottom: 24 }}>
            {error || "Evaluation not found."}
          </div>
          <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const decision = report.final_decision?.toUpperCase() || report.status;
  const decisionClass = DECISION_CLASSES[decision] || "status-tag-muted";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Navbar />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "90px 24px 60px" }}>
        {/* Back navigation */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none", border: "none", color: "var(--color-text-muted)", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "var(--font-mono)",
            }}
          >
            ← BACK TO DASHBOARD
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-primary)", letterSpacing: "0.05em", marginBottom: 4 }}>
              EVALUATION REPORT #{report.evaluation_id}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-heading)" }}>
              {report.candidate_name || `Candidate Evaluation`}
            </h1>
            <div style={{ fontSize: 13, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
              {report.role} • Created {new Date(report.created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {report.overall_score !== null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--color-text-heading)" }}>
                {report.overall_score.toFixed(1)}/10
              </span>
            )}
            {report.final_decision && (
              <span className={`status-tag ${decisionClass}`} style={{ fontSize: 14 }}>
                {report.final_decision}
              </span>
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="card-surface" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-subtle)", marginBottom: 14 }}>
            PIPELINE STAGE PROGRESS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {report.pipeline.map((stage) => {
              const stageDecision = stage.decision?.toUpperCase();
              const sClass = DECISION_CLASSES[stageDecision || ""] || "status-tag-muted";
              return (
                <div key={stage.stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-primary)", marginRight: 8 }}>
                      STAGE {stage.stage}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-text-heading)" }}>{stage.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {stage.score !== null && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-heading)" }}>
                        {stage.score.toFixed(1)}/10
                      </span>
                    )}
                    {stage.decision && <span className={`status-tag ${sClass}`}>{stage.decision}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verdicts */}
        {report.verdicts.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-subtle)", marginBottom: 12 }}>
              DETAILED VERDICTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {report.verdicts.map((v) => {
                const isExpanded = expandedRounds.has(v.round_number);
                const vDecision = v.decision?.toUpperCase();
                const vClass = DECISION_CLASSES[vDecision || ""] || "status-tag-muted";
                const verdict = v.verdict_json || {};

                return (
                  <div key={v.round_number} className="card-surface" style={{ overflow: "hidden" }}>
                    <div
                      style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onClick={() => toggleRound(v.round_number)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-primary)" }}>
                          STAGE {v.round_number}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-heading)" }}>
                          {PIPELINE_LABELS[v.agent_type] || v.agent_type}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {v.score !== null && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>
                            {v.score.toFixed(1)}/10
                          </span>
                        )}
                        {vDecision && <span className={`status-tag ${vClass}`}>{vDecision}</span>}
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-subtle)", marginLeft: 6 }}>
                          {isExpanded ? "[ - ]" : "[ + ]"}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: "1px solid var(--color-border)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                        {(verdict.strengths || verdict.weaknesses) && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {verdict.strengths && verdict.strengths.length > 0 && (
                              <div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-success)", marginBottom: 6 }}>STRENGTHS</div>
                                {verdict.strengths.map((s: string, i: number) => (
                                  <div key={i} style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 4 }}>• {s}</div>
                                ))}
                              </div>
                            )}
                            {verdict.weaknesses && verdict.weaknesses.length > 0 && (
                              <div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-error)", marginBottom: 6 }}>WEAKNESSES</div>
                                {verdict.weaknesses.map((w: string, i: number) => (
                                  <div key={i} style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 4 }}>• {w}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {(verdict.reasoning || verdict.detailed_recommendation || verdict.overall_assessment || verdict.executive_summary) && (
                          <div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-subtle)", marginBottom: 6 }}>RATIONALE</div>
                            <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                              {verdict.reasoning || verdict.detailed_recommendation || verdict.overall_assessment || verdict.executive_summary}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
