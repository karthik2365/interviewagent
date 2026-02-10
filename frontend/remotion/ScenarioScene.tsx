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

// 16–22s = frames 0–360 (within this Sequence)
export const ScenarioScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [340, 360], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Topology nodes
  const topoNodes = [
    { label: "LB", x: 250, y: 200, color: COLORS.primary },
    { label: "API-1", x: 150, y: 320, color: COLORS.primary },
    { label: "API-2", x: 350, y: 320, color: COLORS.primary },
    { label: "Cache", x: 100, y: 440, color: COLORS.secondary },
    { label: "DB-M", x: 250, y: 440, color: COLORS.secondary },
    { label: "DB-R", x: 400, y: 440, color: COLORS.secondary },
    { label: "Queue", x: 250, y: 550, color: COLORS.accent },
  ];

  const topoEdges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [4, 6],
  ];

  // Latency spike data
  const spikes = Array.from({ length: 50 }, (_, i) => {
    const spikeFrame = Math.max(0, frame - 100);
    const baseLatency = 20 + Math.sin(i * 0.5) * 10;
    const spike = i > 25 && i < 35
      ? Math.sin((i - 25) * 0.3) * 80 * Math.min(1, spikeFrame / 40)
      : 0;
    return { x: i * 7 + 20, y: 100 - (baseLatency + spike) * Math.min(1, spikeFrame / 20) };
  });

  // Decision tree
  const treeNodes = [
    { label: "Root Cause?", x: 230, y: 30, color: COLORS.white },
    { label: "DB Lock", x: 120, y: 110, color: COLORS.accent },
    { label: "Cache Miss", x: 340, y: 110, color: COLORS.secondary },
    { label: "Retry Storm", x: 60, y: 190, color: COLORS.accent },
    { label: "Scale Out", x: 180, y: 190, color: "#fbbf24" },
    { label: "Warm Cache", x: 280, y: 190, color: COLORS.primary },
    { label: "Rate Limit", x: 400, y: 190, color: COLORS.primary },
  ];

  const treeEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];

  // Borderline indicator
  const borderlinePulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
  const borderlineOpacity = interpolate(frame, [200, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn * fadeOut }}>
      <GridBackground parallaxOffset={-90} />
      <ParticleField fadeIn={10} />

      {/* Section label */}
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <SectionLabel text="Round 3 — Scenario" startFrame={5} color={COLORS.accent} />
      </div>

      {/* Production topology map */}
      <GlassPanel x={100} y={150} width={450} height={470} borderColor={COLORS.accent}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.accent,
          opacity: 0.5,
          marginBottom: 8,
        }}>
          ▸ PRODUCTION TOPOLOGY
        </div>
        <svg width="420" height="420" viewBox="0 0 500 600">
          {topoEdges.map(([from, to], i) => {
            const edgeOpacity = interpolate(frame, [30 + i * 8, 50 + i * 8], [0, 0.5], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <line
                key={i}
                x1={topoNodes[from].x}
                y1={topoNodes[from].y}
                x2={topoNodes[to].x}
                y2={topoNodes[to].y}
                stroke={COLORS.primary}
                strokeWidth={1}
                opacity={edgeOpacity}
                strokeDasharray="3,3"
              />
            );
          })}
          {topoNodes.map((node, i) => {
            const nodeScale = interpolate(frame, [20 + i * 10, 40 + i * 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const isSpike = node.label === "DB-M" && frame > 120;
            return (
              <g key={i} transform={`translate(${node.x}, ${node.y}) scale(${nodeScale})`}>
                <circle r="24" fill={`${node.color}15`} stroke={isSpike ? COLORS.accent : `${node.color}60`} strokeWidth={isSpike ? 2 : 1} />
                {isSpike && <circle r="30" fill="none" stroke={COLORS.accent} strokeWidth={1} opacity={borderlinePulse * 0.4} />}
                <text textAnchor="middle" dy="4" fill={node.color} fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </GlassPanel>

      {/* Latency spike chart */}
      <GlassPanel x={600} y={150} width={400} height={180} borderColor={COLORS.accent}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.accent,
          opacity: 0.5,
          marginBottom: 4,
        }}>
          ▸ LATENCY (ms) — P99
        </div>
        <svg width="370" height="110" viewBox="0 0 370 110">
          <polyline
            points={spikes.map(s => `${s.x},${s.y}`).join(" ")}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${COLORS.accent})` }}
          />
          {/* Threshold line */}
          <line x1="0" y1="30" x2="370" y2="30" stroke={COLORS.accent} strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
          <text x="330" y="25" fill={COLORS.accent} fontSize="8" fontFamily="'JetBrains Mono', monospace" opacity="0.5">SLA</text>
        </svg>
      </GlassPanel>

      {/* Decision tree */}
      <GlassPanel x={600} y={370} width={430} height={260} borderColor={COLORS.accent}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.accent,
          opacity: 0.5,
          marginBottom: 4,
        }}>
          ▸ CANDIDATE DECISION TREE
        </div>
        <svg width="400" height="220" viewBox="0 0 460 230">
          {treeEdges.map(([from, to], i) => {
            const lineOp = interpolate(frame, [160 + i * 12, 180 + i * 12], [0, 0.5], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <line
                key={i}
                x1={treeNodes[from].x}
                y1={treeNodes[from].y + 15}
                x2={treeNodes[to].x}
                y2={treeNodes[to].y - 10}
                stroke={COLORS.white}
                strokeWidth={1}
                opacity={lineOp}
              />
            );
          })}
          {treeNodes.map((node, i) => {
            const nOp = interpolate(frame, [150 + i * 10, 170 + i * 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <g key={i} opacity={nOp}>
                <rect x={node.x - 45} y={node.y - 12} width={90} height={24} rx={4} fill={`${node.color}15`} stroke={`${node.color}40`} strokeWidth={1} />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill={node.color} fontSize="9" fontFamily="'JetBrains Mono', monospace">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </GlassPanel>

      {/* Borderline indicator */}
      <div style={{
        position: "absolute",
        left: 200,
        bottom: 70,
        opacity: borderlineOpacity,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: COLORS.accent,
          boxShadow: `0 0 ${borderlinePulse * 15}px ${COLORS.accent}`,
          opacity: borderlinePulse,
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: COLORS.accent,
          letterSpacing: 2,
          textShadow: `0 0 8px ${COLORS.accent}60`,
        }}>
          BORDERLINE — NEEDS COMMITTEE REVIEW
        </span>
      </div>

      {/* Verdict */}
      <VerdictFile
        filename="verdicts/round3.txt"
        round="ROUND 3"
        title="SCENARIO"
        decision="BORDERLINE"
        score="6.5/10"
        reasoning="Adequate approach to incident response. Decision-making under pressure needs refinement."
        startFrame={250}
        x={1100}
        y={150}
        width={420}
      />
    </AbsoluteFill>
  );
};
