import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";

// ─── Color Palette ───
export const COLORS = {
  primary: "#f97316",     // orange main
  secondary: "#fb923c",   // orange light
  accent: "#ef4444",      // red for risk/warnings
  bg: "#05080f",          // void
  dimCyan: "#ea580c",     // deep orange
  dimPurple: "#d97706",   // amber
  white: "#e0e8f0",
  grid: "#0a1020",
  gridLine: "#1a1208",
};

// ─── Typewriter Text ───
export const TypewriterText: React.FC<{
  text: string;
  startFrame: number;
  msPerChar?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}> = ({ text, startFrame, msPerChar = 70, color = COLORS.primary, fontSize = 16, fontFamily = "'JetBrains Mono', monospace" }) => {
  const frame = useCurrentFrame();
  const framesPerChar = Math.max(1, Math.round((msPerChar / 1000) * 60));
  const elapsed = Math.max(0, frame - startFrame);
  const charsShown = Math.min(text.length, Math.floor(elapsed / framesPerChar));
  const showCursor = elapsed % 30 < 20;

  return (
    <div style={{ fontFamily, fontSize, color, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
      {text.slice(0, charsShown)}
      {charsShown < text.length && showCursor && (
        <span style={{ opacity: 0.9, background: color, color: COLORS.bg, padding: "0 2px" }}>▊</span>
      )}
    </div>
  );
};

// ─── Grid Background ───
export const GridBackground: React.FC<{ parallaxOffset?: number }> = ({ parallaxOffset = 0 }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 1680], [0, -60], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: COLORS.bg,
        overflow: "hidden",
      }}
    >
      {/* Grid lines */}
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.15, transform: `translateY(${drift + parallaxOffset}px)` }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="1920" y2={i * 40} stroke={COLORS.gridLine} strokeWidth="1" />
        ))}
        {Array.from({ length: 50 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="1080" stroke={COLORS.gridLine} strokeWidth="1" />
        ))}
      </svg>
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.secondary}15 0%, transparent 70%)`,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }} />
    </div>
  );
};

// ─── Glassmorphism Panel ───
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number | string;
  opacity?: number;
  borderColor?: string;
  style?: React.CSSProperties;
}> = ({ children, x = 0, y = 0, width = 400, height = "auto", opacity = 1, borderColor = COLORS.primary, style = {} }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      background: `linear-gradient(135deg, rgba(10,20,40,0.85), rgba(5,8,15,0.95))`,
      border: `1px solid ${borderColor}40`,
      borderRadius: 12,
      padding: 24,
      backdropFilter: "blur(20px)",
      boxShadow: `0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Particle Field ───
const PARTICLE_COUNT = 60;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: (i * 37 + 100) % 1920,
  y: (i * 53 + 200) % 1080,
  speed: 0.3 + (i % 5) * 0.15,
  size: 1 + (i % 3),
  hue: i % 3 === 0 ? 25 : i % 3 === 1 ? 35 : 15,
}));

export const ParticleField: React.FC<{ fadeIn?: number }> = ({ fadeIn = 30 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {particles.map((p, i) => {
        const px = (p.x + frame * p.speed * 0.8) % 1960 - 20;
        const py = p.y + Math.sin((frame + i * 30) * 0.02) * 15;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `hsl(${p.hue}, 100%, 70%)`,
              boxShadow: `0 0 ${p.size * 4}px hsl(${p.hue}, 100%, 60%)`,
              opacity: 0.6 + Math.sin((frame + i * 20) * 0.04) * 0.3,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Scan Line ───
export const ScanLine: React.FC<{
  startFrame: number;
  duration?: number;
  color?: string;
  direction?: "horizontal" | "vertical";
}> = ({ startFrame, duration = 60, color = COLORS.primary, direction = "horizontal" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  if (progress <= 0 || progress >= 1) return null;

  const isH = direction === "horizontal";
  return (
    <div
      style={{
        position: "absolute",
        left: isH ? 0 : `${progress * 100}%`,
        top: isH ? `${progress * 100}%` : 0,
        width: isH ? "100%" : 2,
        height: isH ? 2 : "100%",
        background: `linear-gradient(${isH ? "to right" : "to bottom"}, transparent, ${color}, transparent)`,
        boxShadow: `0 0 20px ${color}`,
        opacity: 0.8,
      }}
    />
  );
};

// ─── Score Dial ───
export const ScoreDial: React.FC<{
  score: number;
  maxScore?: number;
  startFrame: number;
  x?: number;
  y?: number;
}> = ({ score, maxScore = 10, startFrame, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const animScore = interpolate(frame, [startFrame, startFrame + 60], [0, score], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const angle = (animScore / maxScore) * 270 - 135;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (animScore / maxScore) * circumference * 0.75;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="45" fill="none" stroke={`${COLORS.primary}20`} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference * 0.25} transform="rotate(135 70 70)" strokeLinecap="round" />
        <circle cx="70" cy="70" r="45" fill="none" stroke={COLORS.primary} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(135 70 70)" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${COLORS.primary})` }} />
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: COLORS.primary, textShadow: `0 0 10px ${COLORS.primary}` }}>
          {animScore.toFixed(1)}
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: COLORS.white, opacity: 0.6, letterSpacing: 2, textTransform: "uppercase" }}>
          / {maxScore}
        </span>
      </div>
    </div>
  );
};

// ─── Verdict File ───
export const VerdictFile: React.FC<{
  filename: string;
  round: string;
  title: string;
  decision: string;
  score: string;
  reasoning: string;
  startFrame: number;
  x?: number;
  y?: number;
  width?: number;
}> = ({ filename, round, title, decision, score, reasoning, startFrame, x = 0, y = 0, width = 400 }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideUp = interpolate(frame, [startFrame, startFrame + 25], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const content = `${round} — ${title}\nDecision: ${decision}\nScore: ${score}\nReasoning: ${reasoning}`;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + slideUp,
        width,
        opacity: fadeIn,
      }}
    >
      {/* File tab */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${COLORS.primary}15`,
        border: `1px solid ${COLORS.primary}40`,
        borderBottom: "none",
        borderRadius: "6px 6px 0 0",
        padding: "4px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: COLORS.primary,
      }}>
        <span style={{ opacity: 0.5 }}>📄</span>
        {filename}
      </div>
      {/* File body */}
      <div style={{
        background: `linear-gradient(135deg, rgba(249,115,22,0.03), rgba(5,8,15,0.95))`,
        border: `1px solid ${COLORS.primary}30`,
        borderRadius: "0 8px 8px 8px",
        padding: 16,
      }}>
        <TypewriterText text={content} startFrame={startFrame + 10} msPerChar={40} fontSize={13} color={COLORS.white} />
      </div>
    </div>
  );
};

// ─── Agent Core ───
export const AgentCore: React.FC<{
  label: string;
  color: string;
  x: number;
  y: number;
  startFrame: number;
}> = ({ label, color, x, y, startFrame }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [startFrame, startFrame + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const glow = interpolate(frame, [startFrame + 30, startFrame + 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = Math.sin((frame - startFrame) * 0.05) * 0.15 + 0.85;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 40,
        top: y - 40,
        width: 80,
        height: 80,
        transform: `scale(${scale})`,
      }}
    >
      {/* Outer ring */}
      <div style={{
        position: "absolute",
        inset: -8,
        borderRadius: "50%",
        border: `1px solid ${color}40`,
        opacity: glow * pulse,
        boxShadow: `0 0 20px ${color}30`,
      }} />
      {/* Core */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}40, ${color}10)`,
        border: `2px solid ${color}80`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 30px ${color}20, inset 0 0 20px ${color}10`,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: 1,
          textShadow: `0 0 8px ${color}`,
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ─── Section Label ───
export const SectionLabel: React.FC<{
  text: string;
  startFrame: number;
  color?: string;
}> = ({ text, startFrame, color = COLORS.primary }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const xShift = interpolate(frame, [startFrame, startFrame + 20], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lineWidth = interpolate(frame, [startFrame + 5, startFrame + 35], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ opacity, transform: `translateX(${xShift}px)` }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        color,
        textTransform: "uppercase",
        letterSpacing: 4,
        marginBottom: 8,
        textShadow: `0 0 10px ${color}60`,
      }}>
        {text}
      </div>
      <div style={{
        width: lineWidth,
        height: 1,
        background: `linear-gradient(to right, ${color}, transparent)`,
      }} />
    </div>
  );
};
