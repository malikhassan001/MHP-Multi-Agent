"use client";

import React, { memo, useMemo } from "react";
import { seededWaveform } from "@/lib/flow/utils";

interface WaveformProps {
  seed: string;
  bars: number;
  profile: "speech" | "music" | "sfx";
  color: string;
  className?: string;
}

export const Waveform = memo(function Waveform({ seed, bars, profile, color, className }: WaveformProps) {
  const count = Math.max(8, Math.min(600, Math.round(bars)));
  const values = useMemo(() => seededWaveform(seed, count, profile), [seed, count, profile]);

  return (
    <svg
      viewBox={`0 0 ${count} 100`}
      preserveAspectRatio="none"
      className={className ?? "absolute inset-0 h-full w-full"}
      aria-hidden="true"
    >
      {values.map((v, i) => (
        <rect key={i} x={i + 0.15} width={0.7} y={50 - v * 44} height={v * 88} rx={0.3} fill={color} opacity={0.85} />
      ))}
    </svg>
  );
});
