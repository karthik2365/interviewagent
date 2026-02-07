"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFullscreen } from "../../hooks/useFullscreen";
import FullscreenWarning from "../../components/FullscreenWarning";

const API_BASE = "/api";

const ROUND_META: Record<string, { title: string; subtitle: string; color: string }> = {
  "2": {
    title: "Technical Interview",
    subtitle: "Answer the technical questions below. The AI interviewer will evaluate correctness, depth, and clarity.",
    color: "purple",
  },
  "3": {
    title: "Scenario Interview",
    subtitle: "Respond to the production scenario below. Show your decision-making, trade-off analysis, and practical judgment.",
    color: "amber",
  },
};

export default function RoundPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showWarning, dismissWarning } = useFullscreen();

  const meta = ROUND_META[roundId] || {
    title: `Round ${roundId}`,
    subtitle: "Answer the question below.",
    color: "blue",
  };

  useEffect(() => {
    // Load the question from sessionStorage (set by previous round)
    const storedQuestion = sessionStorage.getItem("current_question");
    if (storedQuestion) {
      setQuestion(storedQuestion);
      // Clear so it doesn't persist to a future interview
      sessionStorage.removeItem("current_question");
    } else {
      setError("No question found. Please start the interview from the beginning.");
    }
    // Reset answer field for each round
    setAnswer("");
  }, [roundId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/round/${roundId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      if (!res.ok) {
        let detail = "Failed to submit answer.";
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch {
          if (res.status === 429) detail = "AI rate limit reached. Please wait a minute and try again.";
        }
        throw new Error(detail);
      }

      const data = await res.json();

      // Store verdict
      sessionStorage.setItem(`round${roundId}_verdict`, data.verdict || "");
      sessionStorage.setItem(`round${roundId}_decision`, data.decision || "");

      if (data.status === "REJECTED") {
        sessionStorage.setItem("rejected_at", roundId);
        sessionStorage.setItem("rejection_verdict", data.verdict || "");
        router.push("/result");
      } else if (data.status === "COMPLETE") {
        // All rounds done — go to final decision
        router.push("/result");
      } else if (data.next_round) {
        // Store next question and navigate
        sessionStorage.setItem("current_question", data.question || "");
        router.push(`/round/${data.next_round}`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const roundNum = parseInt(roundId, 10);

  return (
    <div className="space-y-8">
      <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {[
          { n: 1, label: "Screening" },
          { n: 2, label: "Technical" },
          { n: 3, label: "Scenario" },
          { n: 4, label: "Decision" },
        ].map((step, idx) => (
          <span key={step.n} className="flex items-center gap-1">
            {idx > 0 && <span className="mx-1">→</span>}
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step.n < roundNum
                  ? "bg-green-500 text-white"
                  : step.n === roundNum
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {step.n < roundNum ? "✓" : step.n}
            </span>
            <span
              className={
                step.n === roundNum
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : ""
              }
            >
              {step.label}
            </span>
          </span>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Round {roundId}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {meta.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          {meta.subtitle}
        </p>

        {/* Question display */}
        {question && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-4 mb-6">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
              Interview Question
            </div>
            <div className="text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
              {question}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="answer"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Answer
            </label>
            <textarea
              id="answer"
              rows={10}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Evaluating your response...
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
