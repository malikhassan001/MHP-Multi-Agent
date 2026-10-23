import type { AssetKind, TrackKind } from "./types";

export const FPS = 30;

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, seconds);
  const totalFrames = Math.floor(safe * FPS);
  const frames = totalFrames % FPS;
  const totalSeconds = Math.floor(totalFrames / FPS);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(frames)}`;
}

export function formatShort(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededWaveform(seed: string, bars: number, profile: "speech" | "music" | "sfx"): number[] {
  let state = hashString(seed) || 1;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
  const values: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / Math.max(1, bars - 1);
    let v: number;
    if (profile === "speech") {
      const syllable = Math.abs(Math.sin(i * 0.55 + rand() * 0.6));
      const pause = rand() < 0.08 ? 0.12 : 1;
      v = (0.25 + syllable * 0.75) * pause * (0.6 + rand() * 0.4);
    } else if (profile === "music") {
      const beat = i % 8 === 0 ? 1 : 0.7;
      const swell = 0.55 + 0.45 * Math.sin(t * Math.PI);
      v = (0.45 + rand() * 0.55) * beat * swell;
    } else {
      const decay = Math.exp(-t * 4);
      v = (0.3 + rand() * 0.7) * decay + 0.05;
    }
    values.push(Math.min(1, Math.max(0.04, v)));
  }
  return values;
}

export function assetFitsTrack(asset: AssetKind, track: TrackKind): boolean {
  if (track === "video") return asset === "image" || asset === "video";
  if (track === "caption") return false;
  return asset === track;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
