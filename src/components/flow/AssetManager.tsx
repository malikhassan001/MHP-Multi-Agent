"use client";

import React, { useMemo, useRef, useState } from "react";
import { AudioWaveform, Film, Image as ImageIcon, Mic, Music, Plus, Search, Trash2, Upload } from "lucide-react";
import type { Asset, AssetKind } from "@/lib/flow/types";
import { assetFitsTrack, formatShort, uid } from "@/lib/flow/utils";
import { useStudio } from "./studio-store";
import { Waveform } from "./Waveform";

type Filter = "all" | "visual" | "voice" | "music" | "sfx";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "visual", label: "Visual" },
  { id: "voice", label: "Voice" },
  { id: "music", label: "Music" },
  { id: "sfx", label: "SFX" },
];

const KIND_ICON = { image: ImageIcon, video: Film, voice: Mic, music: Music, sfx: AudioWaveform } as const;
const KIND_COLOR: Record<AssetKind, string> = {
  image: "#00D2FF",
  video: "#00D2FF",
  voice: "#4D94FF",
  music: "#F59E0B",
  sfx: "#34D399",
};
const STORAGE_LIMIT_MB = 500;

function matchesFilter(kind: AssetKind, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "visual") return kind === "image" || kind === "video";
  return kind === filter;
}

function readMediaDuration(url: string, tag: "audio" | "video"): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(tag);
    const timer = window.setTimeout(() => resolve(5), 4000);
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      window.clearTimeout(timer);
      resolve(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 5);
    };
    el.onerror = () => {
      window.clearTimeout(timer);
      resolve(5);
    };
    el.src = url;
  });
}

async function fileToAsset(file: File): Promise<Asset | null> {
  const url = URL.createObjectURL(file);
  const sizeMb = Math.round((file.size / 1024 / 1024) * 10) / 10;
  const base = { id: uid("asset"), name: file.name, sizeMb, addedLabel: "Imported", tags: file.name.toLowerCase().replace(/\.[^.]+$/, "").split(/[\s_\-]+/) };
  if (file.type.startsWith("image/")) return { ...base, kind: "image", duration: 5, src: url };
  if (file.type.startsWith("video/")) return { ...base, kind: "video", duration: await readMediaDuration(url, "video") };
  if (file.type.startsWith("audio/")) {
    const duration = await readMediaDuration(url, "audio");
    const kind: AssetKind = /vo|voice|narr/i.test(file.name) ? "voice" : duration < 4 ? "sfx" : "music";
    return { ...base, kind, duration };
  }
  URL.revokeObjectURL(url);
  return null;
}

export function AssetManager() {
  const { state, dispatch } = useStudio();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.assets.filter(
      (a) => matchesFilter(a.kind, filter) && (!q || a.name.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q))),
    );
  }, [state.assets, query, filter]);

  const visual = filtered.filter((a) => a.kind === "image" || a.kind === "video");
  const audio = filtered.filter((a) => a.kind !== "image" && a.kind !== "video");
  const selected = state.assets.find((a) => a.id === state.selectedAssetId);
  const usedMb = state.assets.reduce((acc, a) => acc + a.sizeMb, 0);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of state.clips) if (c.assetId) counts.set(c.assetId, (counts.get(c.assetId) ?? 0) + 1);
    return counts;
  }, [state.clips]);

  const addToTimeline = (asset: Asset) => {
    const track = state.tracks.find((t) => assetFitsTrack(asset.kind, t.kind) && !t.locked);
    if (!track) return;
    dispatch({
      type: "addClip",
      clip: { id: uid("clip"), trackId: track.id, start: state.currentTime, duration: asset.duration, label: asset.name.replace(/\.[^.]+$/, ""), assetId: asset.id },
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const assets = (await Promise.all(Array.from(files).map(fileToAsset))).filter((a): a is Asset => a !== null);
    if (assets.length) dispatch({ type: "addAssets", assets });
  };

  const dragProps = (asset: Asset) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("application/x-flow-asset", asset.id);
      e.dataTransfer.effectAllowed = "copy";
    },
    onClick: () => dispatch({ type: "selectAsset", id: asset.id }),
    onDoubleClick: () => addToTimeline(asset),
    "aria-pressed": state.selectedAssetId === asset.id,
  });

  return (
    <aside
      aria-label="Asset manager"
      className="flex w-[280px] shrink-0 flex-col border-r border-[#1B253B] bg-[#090D17]"
      onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        void handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#1B253B] bg-[#0A0E1A] px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assets</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-6 items-center gap-1 rounded-md bg-[#121A2D] px-2 text-[11px] font-medium text-slate-300 transition hover:text-white"
        >
          <Upload className="h-3 w-3" aria-hidden="true" />
          Import
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="shrink-0 space-y-2 border-b border-[#1B253B] p-2">
        <label className="relative block">
          <span className="sr-only">Search assets</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or tag"
            className="h-7 w-full rounded-md border border-[#1B253B] bg-[#060911] pl-7 pr-2 text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#0066FF]/60"
          />
        </label>
        <div className="flex gap-1" role="group" aria-label="Filter assets">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 rounded py-0.5 text-[10px] font-medium transition ${
                filter === f.id ? "bg-[#0066FF] text-white" : "bg-[#121A2D] text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {visual.length > 0 && (
          <>
            <h3 className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">{`Visual · ${visual.length}`}</h3>
            <ul className="mb-3 grid grid-cols-2 gap-1.5">
              {visual.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    {...dragProps(asset)}
                    className={`group relative block aspect-video w-full overflow-hidden rounded-md border bg-[#121A2D] text-left transition ${
                      state.selectedAssetId === asset.id ? "border-[#00D2FF] ring-1 ring-[#00D2FF]" : "border-[#1B253B] hover:border-[#2A3757]"
                    }`}
                  >
                    {asset.src ? (
                      <img src={asset.src} alt="" className="h-full w-full object-cover" draggable={false} />
                    ) : (
                      <Film className="m-auto h-5 w-5 text-slate-600" aria-hidden="true" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-3 text-[9.5px] font-medium text-slate-100">
                      {asset.name}
                    </span>
                    {usage.get(asset.id) && (
                      <span className="absolute right-1 top-1 rounded bg-[#00D2FF] px-1 font-mono text-[8px] font-bold text-black">
                        {`×${usage.get(asset.id)}`}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {audio.length > 0 && (
          <>
            <h3 className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">{`Audio · ${audio.length}`}</h3>
            <ul className="space-y-1">
              {audio.map((asset) => {
                const Icon = KIND_ICON[asset.kind];
                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      {...dragProps(asset)}
                      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                        state.selectedAssetId === asset.id ? "border-[#00D2FF]/70 bg-[#00D2FF]/5" : "border-transparent hover:bg-[#0F1626]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: KIND_COLOR[asset.kind] }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] text-slate-200">{asset.name}</div>
                        <div className="relative mt-0.5 h-3">
                          <Waveform
                            seed={asset.id}
                            bars={48}
                            profile={asset.kind === "voice" ? "speech" : asset.kind === "music" ? "music" : "sfx"}
                            color={KIND_COLOR[asset.kind]}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[9.5px] text-slate-500">{formatShort(asset.duration)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {filtered.length === 0 && <p className="p-6 text-center text-[11px] text-slate-500">No assets match.</p>}
      </div>

      {selected && (
        <div className="shrink-0 border-t border-[#1B253B] bg-[#0A0E1A] p-3">
          <div className="truncate text-xs font-semibold text-slate-100">{selected.name}</div>
          <dl className="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
            <div>
              <dt className="text-slate-500">Type</dt>
              <dd className="capitalize text-slate-300">{selected.kind}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Length</dt>
              <dd className="font-mono text-slate-300">{formatShort(selected.duration)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Size</dt>
              <dd className="font-mono text-slate-300">{`${selected.sizeMb} MB`}</dd>
            </div>
          </dl>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => addToTimeline(selected)}
              className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-[#0066FF] text-[11px] font-semibold text-white transition hover:bg-[#0080FF]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add at playhead
            </button>
            <button
              type="button"
              aria-label={`Remove ${selected.name}`}
              disabled={!!usage.get(selected.id)}
              title={usage.get(selected.id) ? "Asset is used on the timeline" : "Remove asset"}
              onClick={() => dispatch({ type: "removeAsset", id: selected.id })}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#121A2D] text-slate-400 transition hover:text-red-400 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-[#1B253B] px-3 py-2">
        <div className="flex justify-between text-[9.5px] text-slate-500">
          <span>Project storage</span>
          <span className="font-mono">{`${usedMb.toFixed(1)} / ${STORAGE_LIMIT_MB} MB`}</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#1B253B]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#00D2FF]" style={{ width: `${Math.min(100, (usedMb / STORAGE_LIMIT_MB) * 100)}%` }} />
        </div>
      </div>
    </aside>
  );
}
