"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Keyboard, Waves } from "lucide-react";
import { formatShort } from "@/lib/flow/utils";
import { AssetManager } from "./AssetManager";
import { PreviewPlayer } from "./PreviewPlayer";
import { ScenePromptParser } from "./ScenePromptParser";
import { StudioProvider, useStudio } from "./studio-store";
import { Timeline } from "./Timeline";

const SHORTCUTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Step 1 frame (Shift: 1s)"],
  ["Home / End", "Jump to start / end"],
  ["S", "Split selected clip at playhead"],
  ["Del", "Delete selected clip"],
  ["+ / −", "Zoom timeline"],
  ["L", "Toggle loop"],
];

function StudioToolbar() {
  const { state, dispatch, duration } = useStudio();
  const [showKeys, setShowKeys] = useState(false);

  return (
    <header className="relative flex h-11 shrink-0 items-center gap-3 border-b border-[#1B253B] bg-[#0A0E1A] px-3">
      <Link
        href="/"
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#141E34] hover:text-white"
        aria-label="Back to MHP dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#0066FF] to-[#00D2FF]">
          <Waves className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">Flow</span>
        <span className="text-xs text-slate-500">Voice-to-Video Studio</span>
      </div>
      <div className="mx-2 h-4 w-px bg-[#1B253B]" aria-hidden="true" />
      <label className="min-w-0">
        <span className="sr-only">Project name</span>
        <input
          value={state.projectName}
          onChange={(e) => dispatch({ type: "renameProject", name: e.target.value })}
          className="w-64 truncate rounded bg-transparent px-1.5 py-0.5 text-xs font-medium text-slate-200 outline-none hover:bg-[#121A2D] focus:bg-[#121A2D]"
        />
      </label>

      <dl className="ml-auto flex items-center gap-4 text-[10px]">
        {[
          ["Scenes", state.appliedScenes.length.toString()],
          ["Runtime", formatShort(duration)],
          ["Format", `${state.aspect} · 30fps`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-mono text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        aria-expanded={showKeys}
        aria-controls="flow-shortcuts"
        onClick={() => setShowKeys((v) => !v)}
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] text-slate-400 transition hover:bg-[#141E34] hover:text-white"
      >
        <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        Shortcuts
      </button>
      {showKeys && (
        <div id="flow-shortcuts" className="absolute right-3 top-12 z-50 w-64 rounded-lg border border-[#1B253B] bg-[#0B101C] p-3 shadow-2xl">
          <ul className="space-y-1.5">
            {SHORTCUTS.map(([key, label]) => (
              <li key={key} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{label}</span>
                <kbd className="rounded bg-[#141E34] px-1.5 py-0.5 font-mono text-[10px] text-slate-200">{key}</kbd>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function KeyboardShortcuts() {
  const { state, dispatch } = useStudio();
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      const s = latest.current;
      switch (e.key) {
        case " ":
          e.preventDefault();
          dispatch({ type: "togglePlay" });
          break;
        case "ArrowRight":
          e.preventDefault();
          dispatch({ type: "seek", time: s.currentTime + (e.shiftKey ? 1 : 1 / 30) });
          break;
        case "ArrowLeft":
          e.preventDefault();
          dispatch({ type: "seek", time: s.currentTime - (e.shiftKey ? 1 : 1 / 30) });
          break;
        case "Home":
          dispatch({ type: "seek", time: 0 });
          break;
        case "End":
          dispatch({ type: "seek", time: Number.MAX_SAFE_INTEGER });
          break;
        case "s":
        case "S":
          if (s.selectedClipId && !e.metaKey && !e.ctrlKey) dispatch({ type: "splitClip", id: s.selectedClipId, at: s.currentTime });
          break;
        case "Delete":
        case "Backspace":
          if (s.selectedClipId) dispatch({ type: "deleteClip", id: s.selectedClipId });
          break;
        case "=":
        case "+":
          dispatch({ type: "setZoom", pxPerSec: s.pxPerSec * 1.25 });
          break;
        case "-":
          dispatch({ type: "setZoom", pxPerSec: s.pxPerSec / 1.25 });
          break;
        case "l":
        case "L":
          dispatch({ type: "toggleLoop" });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  return null;
}

function TimelineResizer({ onResize }: { onResize: (delta: number) => void }) {
  const last = useRef<number | null>(null);
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize timeline"
      className="group relative h-1.5 shrink-0 cursor-row-resize bg-[#0A0E1A] hover:bg-[#0066FF]/40"
      onPointerDown={(e) => {
        last.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (last.current === null) return;
        onResize(last.current - e.clientY);
        last.current = e.clientY;
      }}
      onPointerUp={() => (last.current = null)}
    >
      <div className="absolute left-1/2 top-1/2 h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2A3757] group-hover:bg-[#00D2FF]" />
    </div>
  );
}

export function FlowStudio() {
  const [timelineHeight, setTimelineHeight] = useState(330);

  return (
    <StudioProvider>
      <div className="flex h-screen min-w-[1180px] flex-col overflow-hidden bg-[#070A11] text-slate-200">
        <StudioToolbar />
        <div className="flex min-h-0 flex-1">
          <AssetManager />
          <PreviewPlayer />
          <ScenePromptParser />
        </div>
        <TimelineResizer onResize={(d) => setTimelineHeight((h) => Math.min(620, Math.max(180, h + d)))} />
        <Timeline height={timelineHeight} />
      </div>
      <KeyboardShortcuts />
    </StudioProvider>
  );
}
