import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import {
  COLORS,
  GridBackground,
  ParticleField,
  AgentCore,
  TypewriterText,
  GlassPanel,
} from "./components";

// 0–4s = frames 0–240 @ 60fps
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Resume artifact fade-in ──
  const resumeOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resumeScale = interpolate(frame, [30, 60], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const resumeGlow = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Title ──
  const titleOpacity = interpolate(frame, [160, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [160, 195], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Subtitle ──
  const subOpacity = interpolate(frame, [200, 225], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Overall fade out ──
  const fadeOut = interpolate(frame, [220, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeOut }}>
      <GridBackground />
      <ParticleField fadeIn={20} />

      {/* Resume.txt artifact */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "28%",
          transform: `translate(-50%, -50%) scale(${resumeScale})`,
          opacity: resumeOpacity,
        }}
      >
        <GlassPanel
          width={340}
          borderColor={COLORS.primary}
          style={{
            position: "relative",
            boxShadow: `0 0 ${40 * resumeGlow}px ${COLORS.primary}30`,
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: COLORS.primary,
            opacity: 0.6,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>📄</span> resume.txt
          </div>
          <TypewriterText
            text={"John Doe — Software Engineer\nSkills: Python, TypeScript, Go\nExperience: 5 years\nFocus: Backend, Systems, Scale"}
            startFrame={45}
            msPerChar={50}
            fontSize={12}
            color={COLORS.white}
          />
        </GlassPanel>
      </div>

      {/* Four Agent Cores */}
      <AgentCore label="ATS" color={COLORS.primary} x={660} y={620} startFrame={90} />
      <AgentCore label="TECH" color={COLORS.secondary} x={840} y={620} startFrame={105} />
      <AgentCore label="SCENE" color={COLORS.accent} x={1020} y={620} startFrame={120} />
      <AgentCore label="HIRE" color="#fbbf24" x={1200} y={620} startFrame={135} />

      {/* Connection lines between agents */}
      <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        width="1920"
        height="1080"
      >
        {[
          [700, 620, 800, 620],
          [880, 620, 980, 620],
          [1060, 620, 1160, 620],
        ].map(([x1, y1, x2, y2], i) => {
          const lineOpacity = interpolate(
            frame,
            [130 + i * 10, 145 + i * 10],
            [0, 0.4],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={COLORS.primary}
              strokeWidth={1}
              opacity={lineOpacity}
              strokeDasharray="4,4"
            />
          );
        })}
      </svg>

      {/* Title lock */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: 6,
            color: COLORS.white,
            textShadow: `0 0 40px ${COLORS.primary}40`,
            margin: 0,
          }}
        >
          AGENT-FIRST INTERVIEW ENGINE
        </h1>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: subOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: COLORS.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Multi-Agent Decision Pipeline
        </span>
      </div>
    </AbsoluteFill>
  );
};
