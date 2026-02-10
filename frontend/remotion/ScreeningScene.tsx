import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import {
  COLORS,
  GridBackground,
  ParticleField,
  SectionLabel,
  GlassPanel,
  TypewriterText,
  ScanLine,
  ScoreDial,
  VerdictFile,
} from "./components";

// 4–10s = frames 0–360 (within this Sequence)
export const ScreeningScene: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Fade in ──
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Keywords highlight ──
  const keywords = ["backend", "systems", "scale", "Python", "TypeScript"];
  const keywordReveal = keywords.map((_, i) =>
    interpolate(frame, [80 + i * 20, 95 + i * 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // ── Fade out ──
  const fadeOut = interpolate(frame, [340, 360], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Branch gate ──
  const gateOpen = interpolate(frame, [280, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <GridBackground parallaxOffset={-30} />
      <ParticleField fadeIn={10} />

      {/* Scan lines */}
      <ScanLine startFrame={20} duration={80} color={COLORS.primary} />
      <ScanLine startFrame={40} duration={70} color={`${COLORS.primary}80`} />
      <ScanLine startFrame={60} duration={60} color={`${COLORS.primary}60`} />

      {/* Section label */}
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <SectionLabel text="Round 1 — Screening" startFrame={5} color={COLORS.primary} />
      </div>

      {/* Resume with keyword highlights */}
      <GlassPanel x={120} y={160} width={500}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.primary,
          opacity: 0.5,
          marginBottom: 12,
        }}>
          ▸ ATS SCAN — resume.txt
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: COLORS.white,
          lineHeight: 2,
        }}>
          {[
            "John Doe — Software Engineer",
            "5 years experience | distributed systems",
            "",
            "Skills: Python, TypeScript, Go, PostgreSQL",
            "Focus: backend, systems, scale",
            "Experience: system design, API architecture",
            "Projects: real-time data pipelines",
          ].map((line, i) => (
            <div key={i}>
              {keywords.reduce<React.ReactNode[]>((acc, kw, ki) => {
                const parts: React.ReactNode[] = [];
                const text = typeof acc === "string" ? acc : line;
                if (i > 0 && line.toLowerCase().includes(kw.toLowerCase())) {
                  const idx = line.toLowerCase().indexOf(kw.toLowerCase());
                  return [
                    line.slice(0, idx),
                    <span
                      key={kw}
                      style={{
                        color: COLORS.primary,
                        background: `${COLORS.primary}${Math.round(keywordReveal[ki] * 25).toString(16).padStart(2, "0")}`,
                        textShadow: `0 0 ${keywordReveal[ki] * 10}px ${COLORS.primary}`,
                        padding: "1px 4px",
                        borderRadius: 3,
                        transition: "all 0.3s",
                      }}
                    >
                      {line.slice(idx, idx + kw.length)}
                    </span>,
                    line.slice(idx + kw.length),
                  ];
                }
                return acc.length === 0 ? [line] : acc;
              }, [])}
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Score dial */}
      <ScoreDial score={7.5} startFrame={140} x={750} y={200} />
      <div style={{
        position: "absolute",
        left: 750,
        top: 360,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: COLORS.primary,
        opacity: interpolate(frame, [200, 220], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        textAlign: "center",
        width: 140,
      }}>
        MATCH SCORE
      </div>

      {/* Verdict file */}
      <VerdictFile
        filename="verdicts/round1.txt"
        round="ROUND 1"
        title="SCREENING"
        decision="PASS"
        score="7.5/10"
        reasoning="Strong backend profile. Relevant systems experience. Keywords match role requirements."
        startFrame={200}
        x={1050}
        y={160}
        width={420}
      />

      {/* Branch gate visual */}
      <div style={{
        position: "absolute",
        left: "50%",
        bottom: 60,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity: interpolate(frame, [270, 300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          width: 200,
          height: 2,
          background: `linear-gradient(to right, transparent, ${COLORS.primary})`,
        }} />
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: COLORS.primary,
          textShadow: `0 0 10px ${COLORS.primary}`,
          border: `1px solid ${COLORS.primary}40`,
          padding: "6px 20px",
          borderRadius: 4,
          background: `${COLORS.primary}10`,
          transform: `scaleX(${gateOpen})`,
        }}>
          ▸ GATE OPEN → ROUND 2
        </div>
        <div style={{
          width: 200,
          height: 2,
          background: `linear-gradient(to left, transparent, ${COLORS.primary})`,
        }} />
      </div>
    </AbsoluteFill>
  );
};
