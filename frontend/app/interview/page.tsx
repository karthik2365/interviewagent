"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useFullscreen } from "../hooks/useFullscreen";
import FullscreenWarning from "../components/FullscreenWarning";
import AuroraBackground from "@/component/AuroraBackground";

const API_BASE = "/api";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  "SDE 1": "Entry-level software development engineer focused on coding, debugging, and building reliable software.",
  "AI Engineer": "Engineer specializing in machine learning, deep learning, and AI system design.",
  "Backend Developer": "Developer focused on server-side logic, APIs, databases, and system architecture.",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function InterviewPage() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enterFullscreen, showWarning, dismissWarning } = useFullscreen();

  // Clear stale session data and fetch roles on mount
  useEffect(() => {
    sessionStorage.clear();
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

    // Clear previous interview data
    sessionStorage.clear();

    // Enter fullscreen and mark interview as active
    sessionStorage.setItem("interview_active", "true");
    await enterFullscreen();

    try {
      // Reset backend state
      await fetch(`${API_BASE}/reset`, { method: "POST" });

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
    <>
      <AuroraBackground />
      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />

          {/* Progress indicator */}
          <motion.div
            className="flex items-center gap-2 text-sm text-gray-400"
            variants={itemVariants}
          >
            {[
              { n: 1, label: "Screening", active: true },
              { n: 2, label: "Technical", active: false },
              { n: 3, label: "Scenario", active: false },
              { n: 4, label: "Decision", active: false },
            ].map((step, idx) => (
              <motion.span
                key={step.n}
                className="flex items-center gap-1"
                whileHover={{ x: 2 }}
              >
                {idx > 0 && <span className="mx-1 text-gray-600">→</span>}
                <motion.span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.active
                      ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step.n}
                </motion.span>
                <span
                  className={
                    step.active ? "font-medium text-white" : "text-gray-400"
                  }
                >
                  {step.label}
                </span>
              </motion.span>
            ))}
          </motion.div>

          {/* Info cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={itemVariants}
          >
            <motion.div
              className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4 backdrop-blur-sm"
              whileHover={{
                borderColor: "rgba(249, 115, 22, 0.3)",
                scale: 1.02,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-orange-400 font-bold text-sm mb-1">Round 1</div>
              <div className="font-semibold text-white text-sm">
                Resume Screening
              </div>
              <p className="text-xs text-gray-400 mt-1">
                AI recruiter evaluates role fit, skills, and experience.
              </p>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4 backdrop-blur-sm"
              whileHover={{
                borderColor: "rgba(249, 115, 22, 0.3)",
                scale: 1.02,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-orange-400 font-bold text-sm mb-1">
                Round 2 & 3
              </div>
              <div className="font-semibold text-white text-sm">
                Technical & Scenario
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Deep technical questions and real-world scenario assessment.
              </p>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 p-4 backdrop-blur-sm"
              whileHover={{
                borderColor: "rgba(249, 115, 22, 0.3)",
                scale: 1.02,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-green-400 font-bold text-sm mb-1">Final</div>
              <div className="font-semibold text-white text-sm">
                Hiring Committee
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Committee reviews all verdicts for a final HIRE/HOLD/REJECT
                decision.
              </p>
            </motion.div>
          </motion.div>

          {/* Main card */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm p-6"
            variants={itemVariants}
            whileHover={{
              borderColor: "rgba(249, 115, 22, 0.3)",
              boxShadow: "0 0 30px rgba(249, 115, 22, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Round 1
              </span>
            </motion.div>
            <motion.h2 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text text-transparent mb-2">
              Start Your Interview
            </motion.h2>
            <motion.p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Paste your resume below. Our AI interview panel will evaluate your
              qualifications through a multi-round process.
            </motion.p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {roles.map((r) => (
                    <motion.button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={loading}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        role === r
                          ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`font-semibold text-sm ${role === r ? "text-orange-400" : "text-white"}`}>
                        {r}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {ROLE_DESCRIPTIONS[r] || ""}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label
                  htmlFor="resume"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Resume / CV
                </label>
                <textarea
                  id="resume"
                  rows={8}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y backdrop-blur-sm transition-all"
                  placeholder={`Paste your resume here...\n\nExample:\nJohn Doe - Software Engineer | 5 years experience\nSkills: Python, TypeScript, React, PostgreSQL, AWS\n\nExperience:\n- Senior Engineer at TechCorp (2022-present)\n- Software Engineer at StartupXYZ (2019-2022)`}
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  disabled={loading}
                />
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading || !resume.trim() || !role}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <>
                    <motion.svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                    </motion.svg>
                    Running Screening Agent for {role}...
                  </>
                ) : (
                  "Submit Resume & Begin Interview"
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}