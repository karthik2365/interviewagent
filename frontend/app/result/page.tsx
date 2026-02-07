'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useFullscreen } from '../hooks/useFullscreen'
import FullscreenWarning from '../components/FullscreenWarning'

const API_BASE = '/api'

type FinalResult = {
  decision: string;
  rationale: string;
  status: string;
} | null;

const DECISION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  HIRE: {
    bg: 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30',
    text: 'text-green-400',
    label: 'HIRE',
  },
  HOLD: {
    bg: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    text: 'text-yellow-400',
    label: 'HOLD',
  },
  REJECT: {
    bg: 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30',
    text: 'text-red-400',
    label: 'REJECT',
  },
  FAIL: {
    bg: 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30',
    text: 'text-red-400',
    label: 'REJECTED',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

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
        let detail = "Failed to fetch final decision.";
        try {
          const data = await res.json();
          detail = data.detail || detail;
        } catch {}
        if (res.status === 429) {
          detail = "AI rate limit reached. Click 'Retry' to try again.";
        }
        throw new Error(detail);
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
    sessionStorage.clear();
    await exitFullscreen();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <motion.div className="flex flex-col items-center justify-center py-20 space-y-4 relative z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.svg className="h-10 w-10 text-orange-400" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </motion.svg>
        <motion.p className="text-gray-400 text-sm font-medium" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
          Hiring Committee is deliberating...
        </motion.p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div className="space-y-6 relative z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />
        <motion.div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-sm text-red-400" variants={itemVariants}>
          {error}
        </motion.div>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={() => fetchFinalDecision()}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-medium text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry Final Decision
          </motion.button>
          <motion.button
            onClick={handleRestart}
            className="py-2 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start New Interview
          </motion.button>
        </div>
      </motion.div>
    )
  }

  const decision = result?.decision?.toUpperCase() || 'UNKNOWN'
  const style = DECISION_STYLES[decision] || DECISION_STYLES.HOLD

  return (
    <div className="space-y-8 relative z-20">
      <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />

      {/* Progress indicator — all complete */}
      <motion.div className="flex items-center gap-2 text-sm text-gray-400" variants={itemVariants}>
        {[
          { n: 1, label: 'Screening' },
          { n: 2, label: 'Technical' },
          { n: 3, label: 'Scenario' },
          { n: 4, label: 'Decision' },
        ].map((step, idx) => {
          const isRejected = rejectedAt && step.n > parseInt(rejectedAt, 10)
          return (
            <motion.span key={step.n} className="flex items-center gap-1" whileHover={{ x: 2 }}>
              {idx > 0 && <span className="mx-1 text-gray-600">→</span>}
              <motion.span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isRejected
                    ? 'bg-white/10 text-gray-400'
                    : step.n === 4
                      ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {isRejected ? '—' : step.n === 4 ? '★' : '✓'}
              </motion.span>
              <span className={step.n === 4 ? 'font-medium text-white' : 'text-gray-400'}>
                {step.label}
              </span>
            </motion.span>
          )
        })}
      </motion.div>

      {/* Decision badge */}
      <motion.div className={`rounded-2xl border-2 p-8 text-center backdrop-blur-sm ${style.bg}`} variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
        {rejectedAt && (
          <motion.p className="text-sm text-gray-400 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Interview ended at Round {rejectedAt}
          </motion.p>
        )}
        <motion.div className={`text-5xl font-black bg-gradient-to-r ${
          decision === 'HIRE'
            ? 'from-green-400 to-green-300'
            : decision === 'HOLD'
              ? 'from-yellow-400 to-yellow-300'
              : 'from-red-400 to-red-300'
        } bg-clip-text text-transparent`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          {style.label}
        </motion.div>
        <motion.p className="text-sm text-gray-400 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          {decision === 'HIRE'
            ? 'The hiring committee recommends hiring this candidate.'
            : decision === 'HOLD'
              ? 'The committee suggests holding for now — review with the team.'
              : rejectedAt
                ? `The candidate was rejected in round ${rejectedAt}.`
                : 'The hiring committee does not recommend hiring at this time.'}
        </motion.p>
      </motion.div>

      {/* Full rationale */}
      <motion.div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm p-8" variants={itemVariants}>
        <motion.h3 className="text-lg font-bold text-white mb-4">
          {rejectedAt ? 'Round Verdict' : 'Hiring Committee Rationale'}
        </motion.h3>
        <motion.div className="bg-white/5 rounded-xl px-5 py-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed border border-white/10">
          {result?.rationale || 'No rationale available.'}
        </motion.div>
      </motion.div>

      {/* Round verdicts accordion */}
      {Object.keys(verdicts).length > 0 && (
        <motion.div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm p-8" variants={itemVariants}>
          <motion.h3 className="text-lg font-bold text-white mb-4">
            Round-by-Round Verdicts
          </motion.h3>
          <motion.div className="space-y-4">
            {Object.entries(verdicts).map(([key, text]) => (
              <motion.details key={key} className="group" variants={itemVariants}>
                <summary className="cursor-pointer text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors">
                  {key.replace('round', 'Round ')} — Click to expand
                </summary>
                <motion.div className="mt-2 bg-white/5 rounded-lg px-4 py-3 text-xs text-gray-200 whitespace-pre-wrap border border-white/10">
                  {text}
                </motion.div>
              </motion.details>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Restart */}
      <motion.div className="text-center" variants={itemVariants}>
        <motion.button
          onClick={handleRestart}
          className="py-3 px-8 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-medium text-sm transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start New Interview
        </motion.button>
      </motion.div>
    </div>
  )
}