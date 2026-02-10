import React from "react";
import { Sequence, AbsoluteFill } from "remotion";
import { Intro } from "./Intro";
import { ScreeningScene } from "./ScreeningScene";
import { TechnicalScene } from "./TechnicalScene";
import { ScenarioScene } from "./ScenarioScene";
import { FinalScene } from "./FinalScene";
import { COLORS } from "./components";

// 28 seconds @ 60fps = 1680 frames
// Intro: 0–240 (0–4s)
// Screening: 240–600 (4–10s)
// Technical: 600–960 (10–16s)
// Scenario: 960–1320 (16–22s)
// Final: 1320–1680 (22–28s)

export const COMPOSITION_FPS = 60;
export const COMPOSITION_DURATION = 1680; // 28s
export const COMPOSITION_WIDTH = 1920;
export const COMPOSITION_HEIGHT = 1080;

export const AgentInterview: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={240} name="Intro">
        <Intro />
      </Sequence>
      <Sequence from={240} durationInFrames={360} name="Screening">
        <ScreeningScene />
      </Sequence>
      <Sequence from={600} durationInFrames={360} name="Technical">
        <TechnicalScene />
      </Sequence>
      <Sequence from={960} durationInFrames={360} name="Scenario">
        <ScenarioScene />
      </Sequence>
      <Sequence from={1320} durationInFrames={360} name="Final">
        <FinalScene />
      </Sequence>
    </AbsoluteFill>
  );
};
