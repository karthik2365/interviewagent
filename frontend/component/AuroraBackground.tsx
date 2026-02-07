'use client';

import Aurora from './Aurora';

export default function AuroraBackground() {
  return (
    <Aurora
      colorStops={["#ef8625", "#3d2510", "#0a0a0a"]}
      blend={0.6}
      amplitude={0.8}
      speed={0.8}
    />
  );
}
