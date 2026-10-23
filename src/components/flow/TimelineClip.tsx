"use client";

import React, { memo, useRef } from "react";
import type { Clip, TrackKind } from "@/lib/flow/types";
import { FPS } from "@/lib/flow/utils";
import type { StudioAction } from "./studio-store";
import { TRACK_STYLES } from "./track-style";
import { Waveform } from "./Waveform";

type DragMode = "move" | "trim-start" | "trim-end";

interface TimelineClipProps {
  clip: Clip;
  kind: TrackKind;
  pxPerSec: number;
  selected: boolean;
  locked: boolean;
  thumbSrc?: string;
  dispatch: React.Dispatch<StudioAction>;
  snapTime: (time: number, excludeId: string) => number;
}

const PROFILE: Record<TrackKind, "speech" | "music" | "sfx"> = {
  video: "music",
  caption: "speech",
  voice: "speech",
  music: "music",
  sfx: "sfx",
};

const frameRound = (t: number) => Math.round(t * FPS) / FPS;

export const TimelineClip = memo(function TimelineClip({
  clip,
  kind,
  pxPerSec,
  selected,
  locked,
  thumbSrc,
  dispatch,
  snapTime,
}: TimelineClipProps) {
  const style = TRACK_STYLES[kind];
  const drag = useRef<{ mode: DragMode; x: number; start: number; duration: number } | null>(null);
  const width = clip.duration * pxPerSec;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
    e.stopPropagation();
    dispatch({ type: "selectClip", id: clip.id });
    if (locked || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, start: clip.start, duration: clip.duration };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = (e.clientX - d.x) / pxPerSec;
    if (d.mode === "move") {
      const rawStart = Math.max(0, d.start + delta);
      const snappedStart = snapTime(rawStart, clip.id);
      const snappedEnd = snapTime(rawStart + d.duration, clip.id) - d.duration;
      const start =
        Math.abs(snappedStart - rawStart) <= Math.abs(snappedEnd - rawStart) ? snappedStart : Math.max(0, snappedEnd);
      dispatch({ type: "moveClip", id: clip.id, start: frameRound(start) });
    } else if (d.mode === "trim-end") {
      const end = snapTime(d.start + d.duration + delta, clip.id);
      dispatch({ type: "resizeClip", id: clip.id, start: d.start, duration: frameRound(end - d.start) });
    } else {
      const end = d.start + d.duration;
      const start = Math.min(end - 0.3, Math.max(0, snapTime(d.start + delta, clip.id)));
      dispatch({ type: "resizeClip", id: clip.id, start: frameRound(start), duration: frameRound(end - start) });
    }
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const isAudio = kind === "voice" || kind === "music" || kind === "sfx";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${clip.label}, starts ${clip.start.toFixed(1)} seconds, ${clip.duration.toFixed(1)} seconds long`}
      aria-pressed={selected}
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "Enter") dispatch({ type: "selectClip", id: clip.id });
      }}
      className={`group absolute top-1 bottom-1 overflow-hidden rounded-md border text-left outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-white/60 ${style.clip} ${
        selected ? style.clipSelected : ""
      } ${locked ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}`}
      style={{ left: clip.start * pxPerSec, width: Math.max(4, width) }}
    >
      {kind === "video" && thumbSrc && (
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: `url(${thumbSrc})`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}
          aria-hidden="true"
        />
      )}
      {isAudio && (
        <div className="absolute inset-x-0 top-4 bottom-0">
          <Waveform seed={clip.id} bars={clip.duration * 10} profile={PROFILE[kind]} color={style.wave} />
        </div>
      )}

      <div className="relative flex h-4 items-center gap-1 bg-black/45 px-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
        <span className="truncate text-[10px] font-medium leading-none text-slate-100">{clip.label}</span>
      </div>

      {!locked && (
        <>
          <div
            onPointerDown={(e) => onPointerDown(e, "trim-start")}
            className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/40"
            aria-hidden="true"
          />
          <div
            onPointerDown={(e) => onPointerDown(e, "trim-end")}
            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/40"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
});
