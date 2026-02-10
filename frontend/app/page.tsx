"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Dynamic import for the composition to avoid SSR issues
const LazyAgentInterview = React.lazy(() =>
  import("@/remotion/AgentInterview").then((mod) => ({
    default: mod.AgentInterview,
  }))
);

const COMPOSITION_FPS = 60;
const COMPOSITION_DURATION = 1680;

export default function LandingPage() {
  const router = useRouter();
  const playerRef = useRef<PlayerRef>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: "🔍",
      title: "AI Resume Screening",
      description: "Intelligent ATS agent evaluates role fit, skills alignment, and experience depth in seconds.",
      color: "#f97316",
      round: "Round 1",
    },
    {
      icon: "⚙️",
      title: "Technical Deep-Dive",
      description: "Specialized technical agent probes system design, coding ability, and architectural thinking.",
      color: "#fb923c",
      round: "Round 2",
    },
    {
      icon: "🌐",
      title: "Scenario Assessment",
      description: "Real-world production scenarios test decision-making under pressure and incident response.",
      color: "#ea580c",
      round: "Round 3",
    },
    {
      icon: "⚖️",
      title: "Hiring Committee",
      description: "Multi-agent deliberation synthesizes all evidence into a transparent, auditable final decision.",
      color: "#fbbf24",
      round: "Final",
    },
  ];

  const stats = [
    { value: "4", label: "AI Agents" },
    { value: "3", label: "Interview Rounds" },
    { value: "<2m", label: "Total Time" },
    { value: "100%", label: "Auditable" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05080f",
        color: "#e0e8f0",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ─── HERO SECTION ─── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 30%, #f9731608 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #fb923c06 0%, transparent 40%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(249,115,22,0.06)",
            border: "1px solid rgba(249,115,22,0.15)",
            borderRadius: 999,
            padding: "6px 18px",
            marginBottom: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "#f97316",
            letterSpacing: 2,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#f97316",
              boxShadow: "0 0 8px #f97316",
              animation: "pulse 2s infinite",
            }}
          />
          MULTI-AGENT INTERVIEW SYSTEM
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 16,
            background: "linear-gradient(135deg, #fff 0%, #f97316 50%, #fb923c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}
        >
          Agent-First
          <br />
          Interview Engine
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            fontSize: "clamp(14px, 1.5vw, 18px)",
            color: "rgba(224,232,240,0.6)",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.7,
            margin: "0 0 40px",
          }}
        >
          Four specialized AI agents conduct a rigorous multi-round interview.
          Every decision is evidence-based, auditable, and transparent.
        </motion.p>

        {/* Remotion Player embedded */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.45 }}
          style={{
            width: "min(90vw, 960px)",
            aspectRatio: "16/9",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(249,115,22,0.12)",
            boxShadow:
              "0 0 60px rgba(249,115,22,0.06), 0 0 120px rgba(251,146,60,0.04), 0 20px 60px rgba(0,0,0,0.5)",
            position: "relative",
          }}
        >
          {mounted && (
            <React.Suspense
              fallback={
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#05080f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: "#f97316",
                  }}
                >
                  Initializing agents...
                </div>
              }
            >
              <Player
                ref={playerRef}
                component={LazyAgentInterview}
                durationInFrames={COMPOSITION_DURATION}
                fps={COMPOSITION_FPS}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{ width: "100%", height: "100%" }}
                autoPlay
                loop
                controls
                showVolumeControls={false}
              />
            </React.Suspense>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <motion.button
            onClick={() => router.push("/interview")}
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(249,115,22,0.3)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "14px 36px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: "#05080f",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              letterSpacing: 1,
              boxShadow: "0 0 30px rgba(249,115,22,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Start Interview
            <span style={{ fontSize: 18 }}>→</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, borderColor: "rgba(249,115,22,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              padding: "14px 36px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: "#f97316",
              background: "rgba(249,115,22,0.06)",
              border: "1px solid rgba(249,115,22,0.2)",
              borderRadius: 10,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            Learn More
          </motion.button>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "clamp(20px, 4vw, 60px)",
          padding: "60px 20px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexWrap: "wrap",
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{ textAlign: "center", minWidth: 120 }}
          >
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                background: "linear-gradient(135deg, #f97316, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(224,232,240,0.5)",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="features"
        style={{
          padding: "100px 20px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              margin: "0 0 12px",
              background: "linear-gradient(135deg, #fff, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(224,232,240,0.5)",
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Each agent specializes in a different dimension of candidate
            evaluation.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{
                y: -4,
                borderColor: `${f.color}40`,
                boxShadow: `0 0 40px ${f.color}10`,
              }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,20,40,0.6), rgba(5,8,15,0.8))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 28,
                cursor: "default",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: f.color,
                    border: `1px solid ${f.color}30`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    opacity: 0.7,
                  }}
                >
                  {f.round}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: "0 0 8px",
                  color: "#fff",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(224,232,240,0.5)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW THE PIPELINE WORKS ─── */}
      <section
        style={{
          padding: "80px 20px 120px",
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(8px, 2vw, 24px)",
              marginBottom: 40,
              flexWrap: "wrap",
            }}
          >
            {["Resume Upload", "→", "AI Screening", "→", "Technical", "→", "Scenario", "→", "Decision"].map(
              (step, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily:
                      step === "→"
                        ? "system-ui"
                        : "'JetBrains Mono', monospace",
                    fontSize: step === "→" ? 16 : 12,
                    color:
                      step === "→"
                        ? "rgba(249,115,22,0.3)"
                        : i === 0
                        ? "#f97316"
                        : i === 4
                        ? "#fb923c"
                        : i === 6
                        ? "#ea580c"
                        : i === 8
                        ? "#fbbf24"
                        : "rgba(224,232,240,0.6)",
                    padding: step === "→" ? 0 : "6px 14px",
                    background:
                      step === "→" ? "none" : "rgba(255,255,255,0.03)",
                    borderRadius: step === "→" ? 0 : 6,
                    border:
                      step === "→" ? "none" : "1px solid rgba(255,255,255,0.06)",
                    letterSpacing: 1,
                  }}
                >
                  {step}
                </span>
              )
            )}
          </div>

          <p
            style={{
              fontSize: 15,
              color: "rgba(224,232,240,0.5)",
              lineHeight: 1.8,
              maxWidth: 600,
              margin: "0 auto 40px",
            }}
          >
            Every verdict is written to an auditable file. The hiring committee
            reviews all evidence before rendering a final, transparent decision.
          </p>

          <motion.button
            onClick={() => router.push("/interview")}
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(249,115,22,0.3)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "16px 48px",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: "#05080f",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              letterSpacing: 1,
              boxShadow: "0 0 40px rgba(249,115,22,0.15)",
            }}
          >
            Start Your Interview →
          </motion.button>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "40px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "rgba(224,232,240,0.3)",
            letterSpacing: 3,
          }}
        >
          AGENT-FIRST INTERVIEW ENGINE
        </span>
        <span style={{ fontSize: 11, color: "rgba(224,232,240,0.2)" }}>
          Decisions from Evidence — Auditable, Transparent, Deterministic
        </span>
      </footer>

    </div>
  );
}