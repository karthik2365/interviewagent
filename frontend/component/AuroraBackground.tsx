'use client';

import Aurora from './Aurora';

export default function AuroraBackground() {
  return (
    <Aurora
      colorStops={["#ef8625", "#e9d5b9", "#f2f2f2"]}
      blend={0.5}
      amplitude={1.0}
      speed={1}
    />
  );
}
