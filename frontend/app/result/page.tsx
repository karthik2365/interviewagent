"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFullscreen } from "../hooks/useFullscreen";
import FullscreenWarning from "../components/FullscreenWarning";

const API_BASE = "/api";

type FinalResult = {
  decision: string;
  rationale: string;
  status: string;
} | null;

const DECISION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  HIRE: {
    bg: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-300",
    label: "HIRE",
  },
  HOLD: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-300",
    label: "HOLD",
  },
  REJECT: {
    bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-300",
    label: "REJECT",
  },
  FAIL: {
    bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
    text: "text-red-800 dark:text-red-300",
    label: "REJECTED",
  },
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<FinalResult>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectedAt, setRejectedAt] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, string>>({});
  const { showWarning, dismissWarning, exitFullscreen } = useFullscreen();

  useEffect(() => {
    // Collect stored verdicts from sessionStorage
    const v: Record<string, string> = {};
    for (const r of ["1", "2", "3"]) {
      const vd = sessionStorage.getItem(`round${r}_verdict`);
      if (vd) v[`round${r}`] = vd;
    }
    setVerdicts(v);

    // Check if rejected early
    const rejAt = sessionStorage.getItem("rejected_at");
    if (rejAt) {
      setRejectedAt(rejAt);
      const rejVerdict = sessionStorage.getItem("rejection_verdict") || "";
      setResult({
        decision: "REJECT",
        rationale: rejVerdict,
        status: "REJECTED",
      });
      setLoading(false);
      return;
    }

    // Fetch final decision from hiring committee
    fetchFinalDecision();
  }, []);

  const fetchFinalDecision = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/final-decision`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to fetch final decision.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    // Clear all interview data from sessionStorage
    sessionStorage.clear();
    await exitFullscreen();
    // Force a full page reload to clear any React state
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg
          className="animate-spin h-10 w-10 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Hiring Committee is deliberating...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-5 py-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
        <button
          onClick={handleRestart}
          className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
        >
          Start New Interview
        </button>
      </div>
    );
  }

  const decision = result?.decision?.toUpperCase() || "UNKNOWN";
  const style = DECISION_STYLES[decision] || DECISION_STYLES.HOLD;

  return (
    <div className="space-y-8">
      <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />

      {/* Progress indicator — all complete */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {[
          { n: 1, label: "Screening" },
          { n: 2, label: "Technical" },
          { n: 3, label: "Scenario" },
          { n: 4, label: "Decision" },
        ].map((step, idx) => {
          const isRejected = rejectedAt && step.n > parseInt(rejectedAt, 10);
          return (
            <span key={step.n} className="flex items-center gap-1">
              {idx > 0 && <span className="mx-1">→</span>}
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isRejected
                    ? "bg-gray-200 dark:bg-gray-700"
                    : step.n === 4
                    ? "bg-blue-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {isRejected ? "—" : step.n === 4 ? "★" : "✓"}
              </span>
              <span
                className={
                  step.n === 4
                    ? "font-medium text-gray-900 dark:text-gray-100"
                    : ""
                }
              >
                {step.label}
              </span>
            </span>
          );
        })}
      </div>

      {/* Decision badge */}
      <div className={`rounded-xl border-2 p-8 text-center ${style.bg}`}>
        {rejectedAt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Interview ended at Round {rejectedAt}
          </p>
        )}
        <div className={`text-4xl font-black ${style.text}`}>
          {style.label}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {decision === "HIRE"
            ? "The hiring committee recommends hiring this candidate."
            : decision === "HOLD"
            ? "The committee suggests holding for now — review with the team."
            : rejectedAt
            ? `The candidate was rejected in round ${rejectedAt}.`
            : "The hiring committee does not recommend hiring at this time."}
        </p>
      </div>

      {/* Full rationale */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {rejectedAt ? "Round Verdict" : "Hiring Committee Rationale"}
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-5 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {result?.rationale || "No rationale available."}
        </div>
      </div>

      {/* Round verdicts accordion */}
      {Object.keys(verdicts).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Round-by-Round Verdicts
          </h3>
          <div className="space-y-4">
            {Object.entries(verdicts).map(([key, text]) => (
              <details key={key} className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                  {key.replace("round", "Round ")} — Click to expand
                </summary>
                <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {text}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Restart */}
      <div className="text-center">
        <button
          onClick={handleRestart}
          className="py-3 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
