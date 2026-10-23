"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronFirst,
  ChevronLast,
  Grid3x3,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AspectRatio } from "@/lib/flow/types";
import { formatTimecode, seededWaveform } from "@/lib/flow/utils";
import { getActiveClip, useStudio } from "./studio-store";

const RATIOS: Record<AspectRatio, number> = { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1 };

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

function cameraTransform(camera: string | undefined, progress: number): string {
  const c = (camera ?? "").toLowerCase();
  if (c.includes("push")) return `scale(${1.02 + progress * 0.12})`;
  if (c.includes("track")) return `scale(1.12) translateX(${(0.5 - progress) * 6}%)`;
  if (c.includes("drift") || c.includes("wide")) return `scale(${1.1 - progress * 0.06}) translateY(${(progress - 0.5) * 3}%)`;
  if (c.includes("macro")) return `scale(${1.15 + progress * 0.08})`;
  if (c.includes("locked") || c.includes("static")) return "scale(1.02)";
  return `scale(${1.04 + progress * 0.05})`;
}

function LevelMeter({ level, label }: { level: number; label: string }) {
  const segments = 14;
  const lit = Math.round(level * segments);
  return (
    <div className="flex flex-col-reverse gap-px" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`h-1 w-1.5 rounded-[1px] ${
            i < lit ? (i >= segments - 2 ? "bg-red-500" : i >= segments - 5 ? "bg-amber-400" : "bg-emerald-400") : "bg-[#1B253B]"
          }`}
        />
      ))}
    </div>
  );
}

export function PreviewPlayer() {
  const { state, dispatch, duration } = useStudio();
  const { clips, tracks, currentTime, playing, loop, aspect, masterVolume, appliedScenes, assets } = state;
  const [stageRef, stage] = useElementSize<HTMLDivElement>();
  const [showGuides, setShowGuides] = useState(false);

  const videoClip = getActiveClip(clips, tracks, "video", currentTime);
  const captionClip = getActiveClip(clips, tracks, "caption", currentTime);
  const asset = assets.find((a) => a.id === videoClip?.assetId);
  const scene = appliedScenes.find((s) => s.id === videoClip?.sceneId);
  const progress = videoClip ? (currentTime - videoClip.start) / videoClip.duration : 0;
  const local = videoClip ? currentTime - videoClip.start : 0;
  const fade = videoClip && playing ? Math.max(0.15, Math.min(1, local / 0.35, (videoClip.duration - local) / 0.35)) : 1;

  const ratio = RATIOS[aspect];
  const frame = useMemo(() => {
    const maxW = Math.max(0, stage.width - 32);
    const maxH = Math.max(0, stage.height - 32);
    return maxW / maxH > ratio ? { width: maxH * ratio, height: maxH } : { width: maxW, height: maxW / ratio };
  }, [stage, ratio]);

  const anySolo = tracks.some((t) => t.solo);
  const audioLevel = useMemo(() => {
    let level = 0;
    for (const track of tracks) {
      if (track.kind === "video" || track.kind === "caption" || track.muted || (anySolo && !track.solo)) continue;
      const clip = clips.find((c) => c.trackId === track.id && currentTime >= c.start && currentTime < c.start + c.duration);
      if (!clip) continue;
      const bars = Math.max(8, Math.round(clip.duration * 10));
      const values = seededWaveform(clip.id, bars, track.kind === "voice" ? "speech" : track.kind === "music" ? "music" : "sfx");
      const idx = Math.min(bars - 1, Math.floor(((currentTime - clip.start) / clip.duration) * bars));
      level += values[idx] * track.volume * 0.6;
    }
    return Math.min(1, level * masterVolume);
  }, [tracks, clips, currentTime, anySolo, masterVolume]);

  const sceneStarts = appliedScenes.map((s) => s.start);
  const jumpScene = (dir: -1 | 1) => {
    if (dir === 1) {
      const next = sceneStarts.find((t) => t > currentTime + 0.01);
      dispatch({ type: "seek", time: next ?? duration });
    } else {
      const prev = [...sceneStarts].reverse().find((t) => t < currentTime - 0.25);
      dispatch({ type: "seek", time: prev ?? 0 });
    }
  };

  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const scrubTo = (clientX: number) => {
    const rect = scrubRef.current?.getBoundingClientRect();
    if (!rect) return;
    dispatch({ type: "seek", time: ((clientX - rect.left) / rect.width) * duration });
  };

  const iconButton = "flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-[#141E34] hover:text-white";

  return (
    <section aria-label="Video preview" className="flex min-w-0 flex-1 flex-col bg-[#05080F]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#1B253B] bg-[#0A0E1A] px-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${playing ? "animate-pulse bg-red-500" : "bg-slate-600"}`} aria-hidden="true" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Program Monitor</h2>
          {scene && <span className="ml-2 truncate text-[11px] text-slate-500">{`Scene ${scene.index} · ${scene.title}`}</span>}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-md border border-[#1B253B] p-0.5" role="radiogroup" aria-label="Aspect ratio">
            {(Object.keys(RATIOS) as AspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={aspect === r}
                onClick={() => dispatch({ type: "setAspect", aspect: r })}
                className={`rounded px-2 py-0.5 font-mono text-[10px] transition ${
                  aspect === r ? "bg-[#0066FF] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={showGuides}
            aria-label="Toggle safe area guides"
            title="Safe area guides"
            onClick={() => setShowGuides((v) => !v)}
            className={`${iconButton} h-7 w-7 ${showGuides ? "bg-[#00D2FF]/10 text-[#00D2FF]" : ""}`}
          >
            <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div
          className="relative overflow-hidden bg-black shadow-[0_0_0_1px_#1B253B,0_20px_60px_-20px_rgba(0,102,255,0.35)]"
          style={{ width: frame.width, height: frame.height }}
        >
          {asset?.src ? (
            <img
              key={videoClip?.id}
              src={asset.src}
              alt={scene?.visual ?? asset.name}
              className="absolute inset-0 h-full w-full object-cover will-change-transform"
              style={{ transform: cameraTransform(scene?.camera, progress), opacity: fade }}
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <span className="font-mono text-[11px] text-slate-600">{videoClip ? "No media linked" : "No clip at playhead"}</span>
              <span className="text-[10px] text-slate-700">{formatTimecode(currentTime)}</span>
            </div>
          )}

          {scene && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#00D2FF] backdrop-blur">{`S${scene.index}`}</span>
              {scene.mood && <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-slate-200 backdrop-blur">{scene.mood}</span>}
              {scene.camera && <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-slate-300 backdrop-blur">{scene.camera}</span>}
            </div>
          )}

          {captionClip?.text && (
            <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-[8%]">
              <p
                className="rounded bg-black/65 px-3 py-1.5 text-center font-medium leading-snug text-white"
                style={{ fontSize: Math.max(11, frame.height * 0.042) }}
              >
                {captionClip.text}
              </p>
            </div>
          )}

          {showGuides && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-[5%] border border-dashed border-white/30" />
              <div className="absolute inset-[10%] border border-dashed border-[#00D2FF]/40" />
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/10" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/10" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/10" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/10" />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-3 flex items-end gap-0.5 rounded-md border border-[#1B253B] bg-[#0A0E1A]/90 p-1.5">
          <LevelMeter level={audioLevel} label="Left channel level" />
          <LevelMeter level={audioLevel * 0.92} label="Right channel level" />
        </div>
      </div>

      <div className="shrink-0 border-t border-[#1B253B] bg-[#0A0E1A] px-3 pb-2 pt-2">
        <div
          ref={scrubRef}
          role="slider"
          tabIndex={0}
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={formatTimecode(currentTime)}
          className="group relative h-4 cursor-pointer"
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubTo(e.clientX);
          }}
          onPointerMove={(e) => scrubbing.current && scrubTo(e.clientX)}
          onPointerUp={() => (scrubbing.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") dispatch({ type: "seek", time: currentTime + 1 });
            if (e.key === "ArrowLeft") dispatch({ type: "seek", time: currentTime - 1 });
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#1B253B]" />
          <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00D2FF]" style={{ width: `${(currentTime / duration) * 100}%` }} />
          {sceneStarts.slice(1).map((t) => (
            <div key={t} className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-slate-400/60" style={{ left: `${(t / duration) * 100}%` }} aria-hidden="true" />
          ))}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#00D2FF] bg-white shadow"
            style={{ left: `${(currentTime / duration) * 100}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-1 flex items-center">
          <div className="w-44 font-mono text-[11px] tabular-nums">
            <span className="text-white">{formatTimecode(currentTime)}</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1">
            <button type="button" className={iconButton} aria-label="Go to start" onClick={() => dispatch({ type: "seek", time: 0 })}>
              <ChevronFirst className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className={iconButton} aria-label="Previous scene" onClick={() => jumpScene(-1)}>
              <SkipBack className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => dispatch({ type: "togglePlay" })}
              className="mx-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_0_20px_-4px_rgba(0,102,255,0.8)] transition hover:bg-[#0080FF]"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />}
            </button>
            <button type="button" className={iconButton} aria-label="Next scene" onClick={() => jumpScene(1)}>
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className={iconButton} aria-label="Go to end" onClick={() => dispatch({ type: "seek", time: duration })}>
              <ChevronLast className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={loop}
              aria-label="Loop playback"
              onClick={() => dispatch({ type: "toggleLoop" })}
              className={`${iconButton} ml-1 ${loop ? "text-[#00D2FF]" : "text-slate-500"}`}
            >
              <Repeat className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex w-44 items-center justify-end gap-2">
            <button
              type="button"
              className={`${iconButton} h-7 w-7`}
              aria-label={masterVolume === 0 ? "Unmute master" : "Mute master"}
              onClick={() => dispatch({ type: "setMasterVolume", volume: masterVolume === 0 ? 0.8 : 0 })}
            >
              {masterVolume === 0 ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
            <label className="flex items-center">
              <span className="sr-only">Master volume</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(masterVolume * 100)}
                onChange={(e) => dispatch({ type: "setMasterVolume", volume: Number(e.target.value) / 100 })}
                className="h-1 w-20 cursor-pointer accent-[#00D2FF]"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
