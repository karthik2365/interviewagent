"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "/api";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  "SDE 1": "Entry-level software development engineer focused on coding, debugging, and building reliable software.",
  "AI Engineer": "Engineer specializing in machine learning, deep learning, and AI system design.",
  "Backend Developer": "Developer focused on server-side logic, APIs, databases, and system architecture.",
};

export default function HomePage() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/roles`)
      .then((res) => res.json())
      .then((data) => setRoles(data.roles || []))
      .catch(() => setRoles(["SDE 1", "AI Engineer", "Backend Developer"]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume.trim() || !role) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resume.trim(), role }),
      });

      if (!res.ok) {
        let detail = "Failed to start interview.";
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch {
          if (res.status === 429) detail = "AI rate limit reached. Please wait a minute and try again.";
        }
        throw new Error(detail);
      }

      const data = await res.json();

      // Store screening result and next question for round 2
      sessionStorage.setItem("round1_verdict", data.verdict || "");
      sessionStorage.setItem("round1_decision", data.decision || "");
      sessionStorage.setItem("interview_role", role);

      if (data.status === "REJECTED") {
        // Screened out — go to result
        sessionStorage.setItem("rejected_at", "1");
        sessionStorage.setItem("rejection_verdict", data.verdict || "");
        router.push("/result");
      } else {
        // Pass — store round 2 question and go
        sessionStorage.setItem("current_question", data.question || "");
        router.push("/round/2");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          1
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Role & Resume
        </span>
        <span className="mx-1">→</span>
        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
          2
        </span>
        <span>Technical</span>
        <span className="mx-1">→</span>
        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
          3
        </span>
        <span>Scenario</span>
        <span className="mx-1">→</span>
        <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
          4
        </span>
        <span>Decision</span>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Start Your Interview
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the role you're interviewing for and paste your resume below.
          Our AI interview panel will evaluate your qualifications through a
          multi-round process: screening, technical assessment, scenario
          evaluation, and a final hiring committee decision.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    role === r
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className={`font-semibold text-sm ${role === r ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}>
                    {r}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ROLE_DESCRIPTIONS[r] || ""}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="resume"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Resume / CV
            </label>
            <textarea
              id="resume"
              rows={14}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder={`Paste your resume here...\n\nExample:\nJohn Doe\nSoftware Engineer | 5 years experience\n\nSkills: Python, TypeScript, React, PostgreSQL, AWS\n\nExperience:\n- Senior Engineer at TechCorp (2022-present)\n  Built distributed data pipelines processing 10M events/day\n- Software Engineer at StartupXYZ (2019-2022)\n  Full-stack development with React and Django\n\nEducation:\n- B.S. Computer Science, State University (2019)`}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
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
            disabled={loading || !resume.trim() || !role}
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
                Running Screening Agent for {role}...
              </>
            ) : (
              "Submit Resume & Begin Interview"
            )}
          </button>
        </form>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <div className="text-blue-600 font-bold text-sm mb-1">Round 1</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Role-Based Screening
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI recruiter evaluates your resume against the selected role.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <div className="text-purple-600 font-bold text-sm mb-1">
            Round 2 & 3
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Technical & Scenario
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Deep technical questions and real-world scenario assessment.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <div className="text-green-600 font-bold text-sm mb-1">Final</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Hiring Committee
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Committee reviews all verdicts for a final HIRE/HOLD/REJECT
            decision.
          </p>
        </div>
      </div>
    </div>
  );
}
