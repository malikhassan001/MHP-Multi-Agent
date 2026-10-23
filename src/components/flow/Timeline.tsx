"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Headphones,
  Lock,
  Magnet,
  Maximize2,
  Scissors,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Track } from "@/lib/flow/types";
import { assetFitsTrack, formatShort, formatTimecode, uid } from "@/lib/flow/utils";
import { MAX_ZOOM, MIN_ZOOM, useStudio } from "./studio-store";
import { TimelineClip } from "./TimelineClip";
import { TRACK_STYLES } from "./track-style";

const HEADER_W = 208;
const RULER_H = 28;
const TAIL_SECONDS = 8;
const MAJOR_STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60];

function TrackHeader({ track, clipCount, dimmed }: { track: Track; clipCount: number; dimmed: boolean }) {
  const { dispatch } = useStudio();
  const style = TRACK_STYLES[track.kind];
  const Icon = style.icon;
  const isAudio = track.kind === "voice" || track.kind === "music" || track.kind === "sfx";

  const flagButton = (flag: "muted" | "solo" | "locked", label: string, content: React.ReactNode, activeClass: string) => (
    <button
      type="button"
      onClick={() => dispatch({ type: "toggleTrack", id: track.id, flag })}
      aria-pressed={track[flag]}
      aria-label={`${label} ${track.name}`}
      title={label}
      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold transition ${
        track[flag] ? activeClass : "bg-[#121A2D] text-slate-500 hover:text-slate-200"
      }`}
    >
      {content}
    </button>
  );

  return (
    <div
      className={`sticky left-0 z-20 flex shrink-0 items-center gap-2 border-b border-r border-[#1B253B] bg-[#0B101C] px-2.5 ${
        dimmed ? "opacity-60" : ""
      }`}
      style={{ width: HEADER_W, height: style.rowHeight }}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${style.text}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold text-slate-200">{track.name}</div>
        {isAudio && style.rowHeight >= 44 ? (
          <label className="mt-1 flex items-center gap-1">
            <span className="sr-only">{`${track.name} volume`}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(track.volume * 100)}
              onChange={(e) => dispatch({ type: "setTrackVolume", id: track.id, volume: Number(e.target.value) / 100 })}
              className="h-1 w-full cursor-pointer accent-[#00D2FF]"
            />
            <span className="w-6 text-right font-mono text-[9px] text-slate-500">{Math.round(track.volume * 100)}</span>
          </label>
        ) : (
          <div className="text-[10px] text-slate-500">{`${clipCount} clip${clipCount === 1 ? "" : "s"}`}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {flagButton(
          "muted",
          track.kind === "video" || track.kind === "caption" ? "Hide" : "Mute",
          track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />,
          "bg-red-500/20 text-red-400",
        )}
        {isAudio && flagButton("solo", "Solo", <Headphones className="h-3 w-3" />, "bg-amber-400/20 text-amber-300")}
        {flagButton(
          "locked",
          "Lock",
          track.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />,
          "bg-slate-300/20 text-slate-200",
        )}
      </div>
    </div>
  );
}

function Ruler({ width, pxPerSec, onScrub }: { width: number; pxPerSec: number; onScrub: (clientX: number, el: HTMLElement) => void }) {
  const { state } = useStudio();
  const major = MAJOR_STEPS.find((s) => s * pxPerSec >= 72) ?? 60;
  const minor = major / 5;
  const seconds = width / pxPerSec;
  const majors = Math.ceil(seconds / major) + 1;
  const scrubbing = useRef(false);

  return (
    <div
      className="relative cursor-text border-b border-[#1B253B] bg-[#0A0E1A]"
      style={{ width, height: RULER_H }}
      onPointerDown={(e) => {
        scrubbing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrub(e.clientX, e.currentTarget);
      }}
      onPointerMove={(e) => scrubbing.current && onScrub(e.clientX, e.currentTarget)}
      onPointerUp={() => (scrubbing.current = false)}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right, #1E2A44 1px, transparent 1px)",
          backgroundSize: `${minor * pxPerSec}px 6px`,
          backgroundPosition: "0 100%",
          backgroundRepeat: "repeat-x",
        }}
      />
      {Array.from({ length: majors }, (_, i) => (
        <div key={i} className="absolute bottom-0 top-0 border-l border-[#33415E]" style={{ left: i * major * pxPerSec }}>
          <span className="ml-1 font-mono text-[9px] text-slate-500">{formatShort(i * major)}</span>
        </div>
      ))}
      {state.appliedScenes.map((scene) => (
        <div
          key={scene.id}
          className="absolute top-0 flex h-3 items-center rounded-br bg-[#00D2FF]/15 px-1 font-mono text-[8px] font-bold text-[#00D2FF]"
          style={{ left: scene.start * pxPerSec }}
        >
          {`S${scene.index}`}
        </div>
      ))}
      <div
        className="pointer-events-none absolute bottom-0 -ml-[6px] h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[#00D2FF]"
        style={{ left: state.currentTime * pxPerSec }}
      />
    </div>
  );
}

export function Timeline({ height }: { height: number }) {
  const { state, dispatch, duration } = useStudio();
  const { tracks, clips, pxPerSec, currentTime, selectedClipId, snap, playing } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lanesWidth = (duration + TAIL_SECONDS) * pxPerSec;
  const anySolo = tracks.some((t) => t.solo);

  const latest = useRef({ clips, currentTime, snap, pxPerSec });
  latest.current = { clips, currentTime, snap, pxPerSec };

  const snapTime = useCallback((time: number, excludeId: string) => {
    const { clips: all, currentTime: playhead, snap: snapOn, pxPerSec: pps } = latest.current;
    if (!snapOn) return time;
    const threshold = 8 / pps;
    let best = time;
    let bestDist = threshold;
    const candidates = [0, playhead];
    for (const c of all) {
      if (c.id === excludeId) continue;
      candidates.push(c.start, c.start + c.duration);
    }
    for (const candidate of candidates) {
      const dist = Math.abs(candidate - time);
      if (dist < bestDist) {
        best = candidate;
        bestDist = dist;
      }
    }
    return best;
  }, []);

  const clipsByTrack = useMemo(() => {
    const map = new Map<string, typeof clips>();
    for (const t of tracks) map.set(t.id, []);
    for (const c of clips) map.get(c.trackId)?.push(c);
    return map;
  }, [tracks, clips]);

  const assetSrc = useMemo(() => new Map(state.assets.map((a) => [a.id, a.src])), [state.assets]);

  const seekFromClientX = useCallback(
    (clientX: number, el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      dispatch({ type: "seek", time: (clientX - rect.left) / pxPerSec });
    },
    [dispatch, pxPerSec],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !playing) return;
    const x = currentTime * pxPerSec;
    const visibleStart = el.scrollLeft;
    const visibleEnd = el.scrollLeft + el.clientWidth - HEADER_W;
    if (x > visibleEnd - 40 || x < visibleStart) el.scrollLeft = Math.max(0, x - 80);
  }, [currentTime, pxPerSec, playing]);

  const fitToView = () => {
    const el = scrollRef.current;
    if (!el) return;
    dispatch({ type: "setZoom", pxPerSec: (el.clientWidth - HEADER_W - 24) / duration });
    el.scrollLeft = 0;
  };

  const selected = clips.find((c) => c.id === selectedClipId);
  const canSplit = !!selected && currentTime > selected.start && currentTime < selected.start + selected.duration;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, track: Track) => {
    const assetId = e.dataTransfer.getData("application/x-flow-asset");
    const asset = state.assets.find((a) => a.id === assetId);
    if (!asset || !assetFitsTrack(asset.kind, track.kind)) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const start = snapTime(Math.max(0, (e.clientX - rect.left) / pxPerSec), "");
    dispatch({
      type: "addClip",
      clip: { id: uid("clip"), trackId: track.id, start, duration: asset.duration, label: asset.name.replace(/\.[^.]+$/, ""), assetId: asset.id },
    });
  };

  const toolButton = "flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-slate-300 transition hover:bg-[#141E34] hover:text-white disabled:pointer-events-none disabled:opacity-40";

  return (
    <section aria-label="Multi-track timeline" className="flex shrink-0 flex-col border-t border-[#1B253B] bg-[#080C14]" style={{ height }}>
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[#1B253B] bg-[#0A0E1A] px-3">
        <h2 className="mr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Timeline</h2>
        <button type="button" className={toolButton} disabled={!canSplit} onClick={() => selected && dispatch({ type: "splitClip", id: selected.id, at: currentTime })}>
          <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
          Split
          <kbd className="ml-1 rounded bg-[#141E34] px-1 font-mono text-[9px] text-slate-500">S</kbd>
        </button>
        <button type="button" className={toolButton} disabled={!selected} onClick={() => selected && dispatch({ type: "deleteClip", id: selected.id })}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </button>
        <button
          type="button"
          aria-pressed={snap}
          onClick={() => dispatch({ type: "toggleSnap" })}
          className={`${toolButton} ${snap ? "bg-[#00D2FF]/10 text-[#00D2FF]" : ""}`}
        >
          <Magnet className="h-3.5 w-3.5" aria-hidden="true" />
          Snap
        </button>

        <div className="mx-3 h-4 w-px bg-[#1B253B]" aria-hidden="true" />
        <span className="font-mono text-[11px] tabular-nums text-[#00D2FF]">{formatTimecode(currentTime)}</span>
        <span className="ml-1 font-mono text-[11px] tabular-nums text-slate-600">{`/ ${formatTimecode(duration)}`}</span>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={toolButton} aria-label="Zoom out" onClick={() => dispatch({ type: "setZoom", pxPerSec: pxPerSec / 1.25 })}>
            <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <label className="flex items-center">
            <span className="sr-only">Timeline zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              value={Math.round(pxPerSec)}
              onChange={(e) => dispatch({ type: "setZoom", pxPerSec: Number(e.target.value) })}
              className="h-1 w-28 cursor-pointer accent-[#00D2FF]"
            />
          </label>
          <button type="button" className={toolButton} aria-label="Zoom in" onClick={() => dispatch({ type: "setZoom", pxPerSec: pxPerSec * 1.25 })}>
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button type="button" className={toolButton} onClick={fitToView}>
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            Fit
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto">
        <div className="relative" style={{ width: HEADER_W + lanesWidth }}>
          <div className="sticky top-0 z-30 flex">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-[#1B253B] bg-[#0A0E1A] px-2.5 text-[10px] font-medium text-slate-500"
              style={{ width: HEADER_W, height: RULER_H }}
            >
              {`${tracks.length} tracks · ${clips.length} clips`}
            </div>
            <Ruler width={lanesWidth} pxPerSec={pxPerSec} onScrub={seekFromClientX} />
          </div>

          {tracks.map((track) => {
            const style = TRACK_STYLES[track.kind];
            const trackClips = clipsByTrack.get(track.id) ?? [];
            const dimmed = track.muted || (anySolo && !track.solo && track.kind !== "video" && track.kind !== "caption");
            return (
              <div key={track.id} className="flex">
                <TrackHeader track={track} clipCount={trackClips.length} dimmed={dimmed} />
                <div
                  className={`relative shrink-0 border-b border-[#141C2E] ${dimmed ? "opacity-40" : ""} ${track.locked ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(148,163,184,0.04)_6px,rgba(148,163,184,0.04)_12px)]" : "bg-[#0A0F1A]"}`}
                  style={{ width: lanesWidth, height: style.rowHeight }}
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    dispatch({ type: "selectClip", id: null });
                    seekFromClientX(e.clientX, e.currentTarget);
                  }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("application/x-flow-asset") && !track.locked) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }
                  }}
                  onDrop={(e) => handleDrop(e, track)}
                >
                  {trackClips.map((clip) => (
                    <TimelineClip
                      key={clip.id}
                      clip={clip}
                      kind={track.kind}
                      pxPerSec={pxPerSec}
                      selected={clip.id === selectedClipId}
                      locked={track.locked}
                      thumbSrc={clip.assetId ? assetSrc.get(clip.assetId) : undefined}
                      dispatch={dispatch}
                      snapTime={snapTime}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#00D2FF] shadow-[0_0_8px_rgba(0,210,255,0.8)]"
            style={{ left: HEADER_W + currentTime * pxPerSec }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
