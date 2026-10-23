"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { estimateSpeechDuration, parseScript } from "@/lib/flow/parser";
import { INITIAL_TRACKS, SAMPLE_ASSETS, SAMPLE_SCRIPT } from "@/lib/flow/sample";
import type { AspectRatio, Asset, Clip, ParseResult, Scene, Track } from "@/lib/flow/types";
import { clamp, uid } from "@/lib/flow/utils";

export interface StudioState {
  projectName: string;
  assets: Asset[];
  tracks: Track[];
  clips: Clip[];
  script: string;
  appliedScenes: Scene[];
  currentTime: number;
  playing: boolean;
  loop: boolean;
  pxPerSec: number;
  snap: boolean;
  selectedClipId: string | null;
  selectedAssetId: string | null;
  aspect: AspectRatio;
  masterVolume: number;
  lastAppliedAt: number | null;
}

type TrackFlag = "muted" | "solo" | "locked";

export type StudioAction =
  | { type: "tick"; dt: number }
  | { type: "seek"; time: number }
  | { type: "togglePlay" }
  | { type: "setPlaying"; playing: boolean }
  | { type: "toggleLoop" }
  | { type: "toggleSnap" }
  | { type: "setZoom"; pxPerSec: number }
  | { type: "selectClip"; id: string | null }
  | { type: "selectAsset"; id: string | null }
  | { type: "moveClip"; id: string; start: number; trackId?: string }
  | { type: "resizeClip"; id: string; start: number; duration: number }
  | { type: "deleteClip"; id: string }
  | { type: "splitClip"; id: string; at: number }
  | { type: "addClip"; clip: Clip }
  | { type: "toggleTrack"; id: string; flag: TrackFlag }
  | { type: "setTrackVolume"; id: string; volume: number }
  | { type: "setScript"; script: string }
  | { type: "applyScenes"; result: ParseResult }
  | { type: "addAssets"; assets: Asset[] }
  | { type: "removeAsset"; id: string }
  | { type: "setAspect"; aspect: AspectRatio }
  | { type: "setMasterVolume"; volume: number }
  | { type: "renameProject"; name: string };

export const MIN_ZOOM = 12;
export const MAX_ZOOM = 220;
const MIN_CLIP = 0.3;

export function computeDuration(clips: Clip[]): number {
  return Math.max(10, ...clips.map((c) => c.start + c.duration));
}

function buildClipsFromScenes(scenes: Scene[], assets: Asset[], tracks: Track[], existing: Clip[]): Clip[] {
  const byKind = (kind: Track["kind"]) => tracks.find((t) => t.kind === kind)?.id;
  const videoId = byKind("video");
  const captionId = byKind("caption");
  const voiceId = byKind("voice");
  const musicId = byKind("music");
  const sfxId = byKind("sfx");
  const regenerated = new Set([videoId, captionId, voiceId]);
  const kept = existing.filter((c) => !regenerated.has(c.trackId));
  const clips: Clip[] = [];

  for (const scene of scenes) {
    const asset = assets.find((a) => a.id === scene.assetId);
    if (videoId) {
      clips.push({ id: uid("clip"), trackId: videoId, start: scene.start, duration: scene.duration, label: scene.title, assetId: asset?.id, sceneId: scene.id });
    }
    if (scene.narration && captionId) {
      clips.push({ id: uid("clip"), trackId: captionId, start: scene.start + 0.2, duration: Math.max(1, scene.duration - 0.4), label: scene.narration, text: scene.narration, sceneId: scene.id });
    }
    if (scene.narration && voiceId) {
      const spoken = Math.min(scene.duration - 0.3, Math.max(1, estimateSpeechDuration(scene.narration)));
      clips.push({ id: uid("clip"), trackId: voiceId, start: scene.start + 0.3, duration: spoken, label: `VO · ${scene.title}`, assetId: "a_vo_main", sceneId: scene.id });
    }
  }

  const total = scenes.reduce((acc, s) => acc + s.duration, 0);
  if (musicId && !kept.some((c) => c.trackId === musicId) && total > 0) {
    clips.push({ id: uid("clip"), trackId: musicId, start: 0, duration: total, label: "Urban_Pulse_120bpm", assetId: "a_music_pulse" });
  }
  if (sfxId && !kept.some((c) => c.trackId === sfxId)) {
    scenes.slice(1).forEach((scene) => {
      clips.push({ id: uid("clip"), trackId: sfxId, start: Math.max(0, scene.start - 0.5), duration: 1.2, label: "Whoosh", assetId: "a_sfx_whoosh" });
    });
  }

  return [...kept, ...clips];
}

function createInitialState(): StudioState {
  const result = parseScript(SAMPLE_SCRIPT, SAMPLE_ASSETS);
  return {
    projectName: "City in Flow — Brand Film",
    assets: SAMPLE_ASSETS,
    tracks: INITIAL_TRACKS,
    clips: buildClipsFromScenes(result.scenes, SAMPLE_ASSETS, INITIAL_TRACKS, []),
    script: SAMPLE_SCRIPT,
    appliedScenes: result.scenes,
    currentTime: 0,
    playing: false,
    loop: true,
    pxPerSec: 56,
    snap: true,
    selectedClipId: null,
    selectedAssetId: null,
    aspect: "16:9",
    masterVolume: 0.8,
    lastAppliedAt: null,
  };
}

function isLocked(state: StudioState, clipId: string): boolean {
  const clip = state.clips.find((c) => c.id === clipId);
  return !!clip && !!state.tracks.find((t) => t.id === clip.trackId)?.locked;
}

function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "tick": {
      const duration = computeDuration(state.clips);
      const next = state.currentTime + action.dt;
      if (next >= duration) {
        return state.loop ? { ...state, currentTime: 0 } : { ...state, currentTime: duration, playing: false };
      }
      return { ...state, currentTime: next };
    }
    case "seek":
      return { ...state, currentTime: clamp(action.time, 0, computeDuration(state.clips)) };
    case "togglePlay": {
      const duration = computeDuration(state.clips);
      const restart = !state.playing && state.currentTime >= duration - 0.01;
      return { ...state, playing: !state.playing, currentTime: restart ? 0 : state.currentTime };
    }
    case "setPlaying":
      return { ...state, playing: action.playing };
    case "toggleLoop":
      return { ...state, loop: !state.loop };
    case "toggleSnap":
      return { ...state, snap: !state.snap };
    case "setZoom":
      return { ...state, pxPerSec: clamp(action.pxPerSec, MIN_ZOOM, MAX_ZOOM) };
    case "selectClip":
      return { ...state, selectedClipId: action.id };
    case "selectAsset":
      return { ...state, selectedAssetId: action.id };
    case "moveClip":
      if (isLocked(state, action.id)) return state;
      return {
        ...state,
        clips: state.clips.map((c) =>
          c.id === action.id ? { ...c, start: Math.max(0, action.start), trackId: action.trackId ?? c.trackId } : c,
        ),
      };
    case "resizeClip":
      if (isLocked(state, action.id)) return state;
      return {
        ...state,
        clips: state.clips.map((c) =>
          c.id === action.id ? { ...c, start: Math.max(0, action.start), duration: Math.max(MIN_CLIP, action.duration) } : c,
        ),
      };
    case "deleteClip":
      if (isLocked(state, action.id)) return state;
      return {
        ...state,
        clips: state.clips.filter((c) => c.id !== action.id),
        selectedClipId: state.selectedClipId === action.id ? null : state.selectedClipId,
      };
    case "splitClip": {
      const clip = state.clips.find((c) => c.id === action.id);
      if (!clip || isLocked(state, action.id)) return state;
      const offset = action.at - clip.start;
      if (offset < MIN_CLIP || clip.duration - offset < MIN_CLIP) return state;
      const right: Clip = { ...clip, id: uid("clip"), start: action.at, duration: clip.duration - offset };
      return {
        ...state,
        clips: [...state.clips.map((c) => (c.id === clip.id ? { ...c, duration: offset } : c)), right],
        selectedClipId: right.id,
      };
    }
    case "addClip":
      if (state.tracks.find((t) => t.id === action.clip.trackId)?.locked) return state;
      return { ...state, clips: [...state.clips, action.clip], selectedClipId: action.clip.id };
    case "toggleTrack":
      return {
        ...state,
        tracks: state.tracks.map((t) => (t.id === action.id ? { ...t, [action.flag]: !t[action.flag] } : t)),
      };
    case "setTrackVolume":
      return {
        ...state,
        tracks: state.tracks.map((t) => (t.id === action.id ? { ...t, volume: clamp(action.volume, 0, 1) } : t)),
      };
    case "setScript":
      return { ...state, script: action.script };
    case "applyScenes":
      return {
        ...state,
        appliedScenes: action.result.scenes,
        clips: buildClipsFromScenes(action.result.scenes, state.assets, state.tracks, state.clips),
        currentTime: 0,
        selectedClipId: null,
        lastAppliedAt: Date.now(),
      };
    case "addAssets":
      return { ...state, assets: [...action.assets, ...state.assets] };
    case "removeAsset":
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.id),
        selectedAssetId: state.selectedAssetId === action.id ? null : state.selectedAssetId,
      };
    case "setAspect":
      return { ...state, aspect: action.aspect };
    case "setMasterVolume":
      return { ...state, masterVolume: clamp(action.volume, 0, 1) };
    case "renameProject":
      return { ...state, projectName: action.name };
    default:
      return state;
  }
}

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  duration: number;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const duration = useMemo(() => computeDuration(state.clips), [state.clips]);

  useEffect(() => {
    if (!state.playing) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      dispatch({ type: "tick", dt: Math.min(0.1, (now - last) / 1000) });
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.playing]);

  const value = useMemo(() => ({ state, dispatch, duration }), [state, duration]);
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}

export function getActiveClip(clips: Clip[], tracks: Track[], kind: Track["kind"], time: number): Clip | undefined {
  const trackIds = tracks.filter((t) => t.kind === kind && !t.muted).map((t) => t.id);
  return clips.find((c) => trackIds.includes(c.trackId) && time >= c.start && time < c.start + c.duration);
}
