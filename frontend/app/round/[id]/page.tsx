"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useFullscreen } from "../../hooks/useFullscreen";
import { useGazeTracking } from "../../hooks/useGazeTracking";
import FullscreenWarning from "../../components/FullscreenWarning";
import GazeWarning from "../../components/GazeWarning";
import WebcamPreview from "../../components/WebcamPreview";
import { WebcamPixelGrid } from "../../components/ui/webcam-pixel-grid";

const API_BASE = "/api";

const ROUND_META: Record<string, { title: string; subtitle: string; color: string }> = {
  '2': {
    title: 'Technical Interview',
    subtitle: 'Answer the technical questions below. The AI interviewer will evaluate correctness, depth, and clarity.',
    color: 'purple',
  },
  '3': {
    title: 'Scenario Interview',
    subtitle: 'Respond to the production scenario below. Show your decision-making, trade-off analysis, and practical judgment.',
    color: 'amber',
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

export default function RoundPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showWarning, dismissWarning } = useFullscreen();
  const {
    showWarning: showGazeWarning,
    dismissWarning: dismissGazeWarning,
    isLookingAway,
    webcamStream,
    isWebcamReady,
    webcamError,
    violationCount,
    initWebcam,
  } = useGazeTracking();

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
    } else {
      setError("No question found. Please start the interview from the beginning.");
    }
  }, [roundId]);

  // Initialize webcam for proctoring
  useEffect(() => {
    initWebcam();
  }, [initWebcam]);

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

  const roundNum = parseInt(roundId, 10)

  return (
    <motion.div className="relative space-y-8 min-h-screen" variants={containerVariants} initial="hidden" animate="visible">
      {/* Unique background for Technical (2) & Scenario (3) Rounds */}
      {(roundId === "2" || roundId === "3") && (
        <div className="fixed inset-0 z-0">
          <WebcamPixelGrid
            stream={webcamStream}
            gridCols={80}
            gridRows={60}
            className="opacity-20 pointer-events-none"
            gapRatio={0.05}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none" />
        </div>
      )}

      <FullscreenWarning show={showWarning} onDismiss={dismissWarning} />
      <GazeWarning show={showGazeWarning} onDismiss={dismissGazeWarning} violationCount={violationCount} />
      <WebcamPreview stream={webcamStream} isLookingAway={isLookingAway} isReady={isWebcamReady} error={webcamError} />

      {/* Progress indicator */}
      <motion.div className="flex items-center gap-2 text-sm text-gray-400" variants={itemVariants}>
        {[
          { n: 1, label: 'Screening' },
          { n: 2, label: 'Technical' },
          { n: 3, label: 'Scenario' },
          { n: 4, label: 'Decision' },
        ].map((step, idx) => (
          <motion.span key={step.n} className="flex items-center gap-1" whileHover={{ x: 2 }}>
            {idx > 0 && <span className="mx-1 text-gray-600">→</span>}
            <motion.span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step.n < roundNum
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                  : step.n === roundNum
                    ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                    : 'bg-white/10 text-gray-400'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              {step.n < roundNum ? '✓' : step.n}
            </motion.span>
            <span className={step.n === roundNum ? 'font-medium text-white' : 'text-gray-400'}>
              {step.label}
            </span>
          </motion.span>
        ))}
      </motion.div>

      {/* Main card */}
      <motion.div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl shadow-xl border border-white/10 backdrop-blur-sm p-8" variants={itemVariants} whileHover={{ borderColor: 'rgba(249, 115, 22, 0.3)', boxShadow: '0 0 30px rgba(249, 115, 22, 0.1)' }} transition={{ duration: 0.3 }}>
        <motion.div className="flex items-center gap-3 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Round {roundId}
          </span>
        </motion.div>
        <motion.h2 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text text-transparent mb-2">
          {meta.title}
        </motion.h2>
        <motion.p className="text-gray-400 mb-6 text-sm leading-relaxed">
          {meta.subtitle}
        </motion.p>

        {/* Question display */}
        {question && (
          <motion.div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl px-5 py-4 mb-6 backdrop-blur-sm" variants={itemVariants}>
            <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
              Interview Question
            </div>
            <div className="text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
              {question}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <label htmlFor="answer" className="block text-sm font-medium text-white mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              rows={10}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y backdrop-blur-sm transition-all"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={loading}
            />
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading || !answer.trim()}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <motion.svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                Evaluating your response...
              </>
            ) : (
              'Submit Answer'
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}
