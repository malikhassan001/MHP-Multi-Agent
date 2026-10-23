import { AudioWaveform, Film, Mic, Music, Subtitles, type LucideIcon } from "lucide-react";
import type { TrackKind } from "@/lib/flow/types";

interface TrackStyle {
  icon: LucideIcon;
  label: string;
  rowHeight: number;
  text: string;
  clip: string;
  clipSelected: string;
  wave: string;
  dot: string;
}

export const TRACK_STYLES: Record<TrackKind, TrackStyle> = {
  video: {
    icon: Film,
    label: "Video",
    rowHeight: 64,
    text: "text-[#00D2FF]",
    clip: "bg-[#0B2733] border-[#00D2FF]/40",
    clipSelected: "border-[#00D2FF] ring-1 ring-[#00D2FF]",
    wave: "#00D2FF",
    dot: "bg-[#00D2FF]",
  },
  caption: {
    icon: Subtitles,
    label: "Captions",
    rowHeight: 36,
    text: "text-slate-300",
    clip: "bg-[#1A2236] border-slate-500/40",
    clipSelected: "border-slate-200 ring-1 ring-slate-200",
    wave: "#CBD5E1",
    dot: "bg-slate-300",
  },
  voice: {
    icon: Mic,
    label: "Voice",
    rowHeight: 52,
    text: "text-[#4D94FF]",
    clip: "bg-[#0A1B3D] border-[#0066FF]/50",
    clipSelected: "border-[#4D94FF] ring-1 ring-[#4D94FF]",
    wave: "#4D94FF",
    dot: "bg-[#4D94FF]",
  },
  music: {
    icon: Music,
    label: "Music",
    rowHeight: 52,
    text: "text-amber-400",
    clip: "bg-[#2A1E0A] border-amber-500/40",
    clipSelected: "border-amber-400 ring-1 ring-amber-400",
    wave: "#F59E0B",
    dot: "bg-amber-400",
  },
  sfx: {
    icon: AudioWaveform,
    label: "SFX",
    rowHeight: 44,
    text: "text-emerald-400",
    clip: "bg-[#0A2620] border-emerald-500/40",
    clipSelected: "border-emerald-400 ring-1 ring-emerald-400",
    wave: "#34D399",
    dot: "bg-emerald-400",
  },
};
