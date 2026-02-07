"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API_BASE = "/api";

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
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HomePage() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resume.trim() }),
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

      sessionStorage.setItem("round1_verdict", data.verdict || "");
      sessionStorage.setItem("round1_decision", data.decision || "");

      if (data.status === "REJECTED") {
        sessionStorage.setItem("rejected_at", "1");
        sessionStorage.setItem("rejection_verdict", data.verdict || "");
        router.push("/result");
      } else {
        sessionStorage.setItem("current_question", data.question || "");
        router.push("/round/2");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: "Screening", active: true },
    { n: 2, label: "Technical", active: false },
    { n: 3, label: "Scenario", active: false },
    { n: 4, label: "Decision", active: false },
  ];

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div className="text-center space-y-4" variants={itemVariants}>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-white">AI Interview</span>{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Agent
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Experience a multi-round interview process powered by specialized AI agents
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        className="flex justify-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3">
          {steps.map((step, idx) => (
            <div key={step.n} className="flex items-center gap-3">
              {idx > 0 && (
                <div className="w-8 h-px bg-gradient-to-r from-gray-700 to-gray-600" />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    step.active
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                      : "bg-white/5 text-gray-500 border border-white/10"
                  }`}
                >
                  {step.n}
                </div>
                <span
                  className={`text-base font-medium hidden sm:inline ${
                    step.active ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Form Card */}
      <motion.div
        className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-sm p-8"
        variants={itemVariants}
      >
        <div className="space-y-6">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-orange-400">
              Round 1 — Resume Screening
            </span>
            <h2 className="text-3xl font-bold text-white mt-2">
              Submit Your Resume
            </h2>
            <p className="text-lg text-gray-400 mt-2">
              Our AI recruiter will evaluate your qualifications and skills
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="resume"
                className="block text-base font-medium text-white mb-3"
              >
                Paste your resume or CV
              </label>
              <textarea
                id="resume"
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none transition-all"
                placeholder="John Doe — Software Engineer | 5 years experience
Skills: Python, TypeScript, React, PostgreSQL, AWS..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-base text-red-400"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !resume.trim()}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-orange-500/20 disabled:shadow-none"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Analyzing Resume...
                </>
              ) : (
                "Begin Interview →"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div className="space-y-6" variants={itemVariants}>
        <h3 className="text-2xl font-bold text-white text-center">
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Resume Screening",
              desc: "AI evaluates your experience, skills, and role fit",
              color: "orange",
            },
            {
              step: "02",
              title: "Technical & Scenario",
              desc: "Answer questions to demonstrate your expertise",
              color: "orange",
            },
            {
              step: "03",
              title: "Final Decision",
              desc: "Hiring committee delivers HIRE, HOLD, or REJECT",
              color: "green",
            },
          ].map((item) => (
            <motion.div
              key={item.step}
              className="relative bg-gradient-to-br from-white/[0.05] to-transparent rounded-xl border border-white/5 p-6"
              whileHover={{ borderColor: "rgba(255,255,255,0.15)", y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <span className={`text-5xl font-bold ${item.color === "green" ? "text-green-500/20" : "text-orange-500/20"}`}>
                {item.step}
              </span>
              <h4 className="text-xl font-semibold text-white mt-2">{item.title}</h4>
              <p className="text-base text-gray-500 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}