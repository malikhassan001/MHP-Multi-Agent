export type TrackKind = "video" | "voice" | "music" | "sfx" | "caption";

export type AssetKind = "image" | "video" | "voice" | "music" | "sfx";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  duration: number;
  src?: string;
  tags: string[];
  sizeMb: number;
  addedLabel: string;
}

export interface Clip {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  label: string;
  assetId?: string;
  sceneId?: string;
  text?: string;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  volume: number;
}

export interface Scene {
  id: string;
  index: number;
  title: string;
  narration: string;
  visual: string;
  camera?: string;
  mood?: string;
  duration: number;
  start: number;
  assetId?: string;
}

export interface ParseResult {
  scenes: Scene[];
  warnings: string[];
  totalDuration: number;
  wordCount: number;
  mode: "structured" | "freeform";
}

export type AspectRatio = "16:9" | "9:16" | "1:1";
