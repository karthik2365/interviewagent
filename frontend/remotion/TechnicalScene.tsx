import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import {
  COLORS,
  GridBackground,
  ParticleField,
  SectionLabel,
  GlassPanel,
  TypewriterText,
  VerdictFile,
} from "./components";

// 10–16s = frames 0–360 (within this Sequence)
export const TechnicalScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [340, 360], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Code lines animation
  const codeLines = [
    "def process_request(payload):",
    "    validated = schema.validate(payload)",
    "    result = pipeline.execute(validated)",
    "    cache.invalidate(result.key)",
    "    return Response(result, status=200)",
    "",
    "class DistributedQueue:",
    "    def __init__(self, brokers):",
    "        self.cluster = KafkaCluster(brokers)",
    "        self.partitions = self._rebalance()",
  ];

  // Complexity graph bars
  const graphBars = [
    { label: "Time", value: 0.7, color: COLORS.primary },
    { label: "Space", value: 0.5, color: COLORS.secondary },
    { label: "Edge", value: 0.85, color: COLORS.accent },
    { label: "Scale", value: 0.6, color: COLORS.primary },
    { label: "Error", value: 0.3, color: "#fbbf24" },
  ];

  // Waveform
  const wavePoints = Array.from({ length: 60 }, (_, i) => {
    const waveFrame = Math.max(0, frame - 160);
    const x = i * 8;
    const y = 40 + Math.sin((i * 0.3) + waveFrame * 0.06) * 25 *
      Math.min(1, waveFrame / 30) *
      (1 - Math.abs(i - 30) / 40);
    return `${x},${y}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <GridBackground parallaxOffset={-60} />
      <ParticleField fadeIn={10} />

      {/* Section label */}
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <SectionLabel text="Round 2 — Technical" startFrame={5} color={COLORS.secondary} />
      </div>

      {/* Code canvas */}
      <GlassPanel x={120} y={160} width={540} borderColor={COLORS.secondary}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.secondary,
          opacity: 0.5,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ display: "flex", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
          </span>
          solution.py
        </div>
        {codeLines.map((line, i) => {
          const lineOpacity = interpolate(
            frame,
            [30 + i * 8, 40 + i * 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: COLORS.white,
                opacity: lineOpacity,
                lineHeight: 1.8,
                display: "flex",
              }}
            >
              <span style={{ color: COLORS.secondary, opacity: 0.3, width: 30, textAlign: "right", marginRight: 12, fontSize: 11 }}>
                {i + 1}
              </span>
              <span>
                {line.includes("def ") || line.includes("class ") ? (
                  <><span style={{ color: COLORS.secondary }}>{line.split(" ")[0]} </span><span style={{ color: COLORS.primary }}>{line.split(" ").slice(1).join(" ")}</span></>
                ) : line.includes("return") ? (
                  <><span style={{ color: COLORS.accent }}>{line.split(" ")[0]} </span><span>{line.split(" ").slice(1).join(" ")}</span></>
                ) : (
                  line
                )}
              </span>
            </div>
          );
        })}
      </GlassPanel>

      {/* Complexity graph */}
      <GlassPanel x={720} y={160} width={380} borderColor={COLORS.secondary}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.secondary,
          opacity: 0.5,
          marginBottom: 16,
        }}>
          ▸ COMPLEXITY ANALYSIS
        </div>
        {graphBars.map((bar, i) => {
          const barWidth = interpolate(
            frame,
            [100 + i * 15, 140 + i * 15],
            [0, bar.value * 100],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
          );
          return (
            <div key={i} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: COLORS.white,
                opacity: 0.6,
                width: 40,
                textAlign: "right",
              }}>
                {bar.label}
              </span>
              <div style={{ flex: 1, height: 6, background: `${bar.color}15`, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  background: `linear-gradient(to right, ${bar.color}80, ${bar.color})`,
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${bar.color}40`,
                }} />
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: bar.color,
                width: 35,
              }}>
                {Math.round(barWidth)}%
              </span>
            </div>
          );
        })}
      </GlassPanel>

      {/* Agent avatar question */}
      <GlassPanel x={720} y={480} width={380} borderColor={COLORS.secondary}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `${COLORS.secondary}30`,
            border: `1px solid ${COLORS.secondary}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: COLORS.secondary,
          }}>
            AI
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.secondary }}>
            TECHNICAL AGENT
          </span>
        </div>
        <TypewriterText
          text="Explain how you'd design a distributed cache invalidation strategy for this system."
          startFrame={150}
          msPerChar={45}
          fontSize={12}
          color={COLORS.white}
        />
      </GlassPanel>

      {/* Answer waveform */}
      <GlassPanel x={120} y={530} width={540} borderColor={COLORS.secondary}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.secondary,
          opacity: 0.5,
          marginBottom: 8,
        }}>
          ▸ RESPONSE ANALYSIS
        </div>
        <svg width="480" height="80" viewBox="0 0 480 80">
          <polyline
            points={wavePoints}
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth="2"
            opacity="0.8"
            style={{ filter: `drop-shadow(0 0 4px ${COLORS.secondary})` }}
          />
        </svg>
      </GlassPanel>

      {/* Verdict */}
      <VerdictFile
        filename="verdicts/round2.txt"
        round="ROUND 2"
        title="TECHNICAL"
        decision="PASS"
        score="8.0/10"
        reasoning="Strong system design knowledge. Clean code structure. Good understanding of distributed patterns."
        startFrame={240}
        x={1200}
        y={300}
        width={400}
      />
    </AbsoluteFill>
  );
};
