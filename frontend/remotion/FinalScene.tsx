import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import {
  COLORS,
  GridBackground,
  ParticleField,
  SectionLabel,
  GlassPanel,
  TypewriterText,
} from "./components";

// 22–28s = frames 0–360 (within this Sequence)
export const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Three verdict files converging
  const verdicts = [
    { file: "round1.txt", decision: "PASS", score: "7.5/10", color: COLORS.primary, xStart: -300, yStart: 200 },
    { file: "round2.txt", decision: "PASS", score: "8.0/10", color: COLORS.secondary, xStart: 960, yStart: -200 },
    { file: "round3.txt", decision: "BORDERLINE", score: "6.5/10", color: COLORS.accent, xStart: 2200, yStart: 200 },
  ];

  // Final decision reveal
  const decisionOpacity = interpolate(frame, [220, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const decisionScale = interpolate(frame, [220, 260], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Impact flash
  const flashOpacity = interpolate(frame, [250, 260, 280], [0, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [290, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [290, 325], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeIn }}>
      <GridBackground parallaxOffset={-120} />
      <ParticleField fadeIn={10} />

      {/* Section label */}
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <SectionLabel text="Hiring Committee" startFrame={5} color="#fbbf24" />
      </div>

      {/* Three verdict files converging */}
      {verdicts.map((v, i) => {
        const convergeX = interpolate(
          frame,
          [20, 100],
          [v.xStart, 120 + i * 540],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
        );
        const convergeY = interpolate(
          frame,
          [20, 100],
          [v.yStart, 160],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
        );
        const cardOpacity = interpolate(frame, [20, 50], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Shrink when converging to center for final decision
        const shrink = interpolate(frame, [140, 180], [1, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dimWhenFinal = interpolate(frame, [200, 240], [1, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: convergeX,
              top: convergeY,
              opacity: cardOpacity * dimWhenFinal,
              transform: `scale(${shrink})`,
            }}
          >
            <GlassPanel width={380} borderColor={v.color}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: v.color,
                opacity: 0.6,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span>📄</span> verdicts/{v.file}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: COLORS.white,
                lineHeight: 1.8,
              }}>
                <div>Decision: <span style={{ color: v.decision === "PASS" ? "#fbbf24" : COLORS.accent }}>{v.decision}</span></div>
                <div>Score: <span style={{ color: v.color }}>{v.score}</span></div>
              </div>
            </GlassPanel>
          </div>
        );
      })}

      {/* Synthesis lines converging */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1920" height="1080">
        {[0, 1, 2].map((i) => {
          const lineProgress = interpolate(frame, [120, 180], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });
          const startX = 310 + i * 540;
          const endX = 960;
          const currentX = startX + (endX - startX) * lineProgress;
          const startY = 350;
          const endY = 540;
          const currentY = startY + (endY - startY) * lineProgress;
          const lineOpacity = interpolate(frame, [120, 140, 180, 200], [0, 0.6, 0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <line
              key={i}
              x1={startX}
              y1={startY}
              x2={currentX}
              y2={currentY}
              stroke={verdicts[i].color}
              strokeWidth={1}
              opacity={lineOpacity}
              strokeDasharray="6,3"
            />
          );
        })}
      </svg>

      {/* Final decision console */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${decisionScale})`,
          opacity: decisionOpacity,
        }}
      >
        <GlassPanel
          width={600}
          borderColor="#fbbf24"
          style={{
            position: "relative",
            boxShadow: `0 0 60px #fbbf2420, 0 0 120px #fbbf2410`,
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#fbbf24",
            opacity: 0.5,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fbbf24",
              boxShadow: "0 0 6px #fbbf24",
            }} />
            FINAL DECISION CONSOLE
          </div>

          <TypewriterText
            text={`HIRING COMMITTEE — FINAL REVIEW\n\nCandidate: John Doe\nRole: Software Engineer\n\nRound 1 (Screening):  PASS      7.5/10\nRound 2 (Technical):  PASS      8.0/10\nRound 3 (Scenario):   BORDERLINE 6.5/10\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFINAL DECISION: HOLD\n\nReasoning: Strong technical foundation but\nscenario performance needs further evaluation.\nRecommend: follow-up assessment in 2 weeks.`}
            startFrame={230}
            msPerChar={30}
            fontSize={13}
            color={COLORS.white}
          />

          {/* HOLD badge */}
          <div style={{
            position: "absolute",
            top: -12,
            right: -12,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary})`,
            color: COLORS.white,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 14,
            padding: "6px 18px",
            borderRadius: 6,
            letterSpacing: 3,
            boxShadow: `0 0 20px ${COLORS.accent}40`,
            opacity: interpolate(frame, [280, 300], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            HOLD
          </div>
        </GlassPanel>
      </div>

      {/* Impact flash */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, #fbbf24, transparent 60%)`,
        opacity: flashOpacity,
        pointerEvents: "none",
      }} />

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: 6,
            textShadow: `0 0 30px ${COLORS.primary}30`,
            margin: 0,
          }}
        >
          DECISIONS FROM EVIDENCE
        </h2>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: COLORS.primary,
          marginTop: 12,
          letterSpacing: 3,
          opacity: 0.6,
        }}>
          AUDITABLE • TRANSPARENT • DETERMINISTIC
        </div>
      </div>
    </AbsoluteFill>
  );
};
