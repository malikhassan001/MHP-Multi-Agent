"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Film,
  Music,
  Mic,
  Subtitles,
  Cpu,
  AlertTriangle,
} from "lucide-react";

interface JobSummary {
  id: string;
  projectId: string;
  name: string;
  status: "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  stage: string;
  progress: number;
  outputUrl?: string;
  durationSec?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

interface ProviderMeta {
  id: string;
  kind: string;
  label: string;
  requiresKey: boolean;
  local: boolean;
  capabilities: string[];
}

const STAGE_LABELS: Record<string, string> = {
  pending: "Queued",
  planning: "Planning",
  script: "Writing script",
  voiceover: "Generating voiceover",
  visuals: "Creating visuals",
  music: "Composing music",
  subtitles: "Building subtitles",
  render: "Rendering",
  finalize: "Finalizing",
  done: "Done",
};

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  running: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  paused: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cancelled: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "vi", label: "Vietnamese" },
];

export const VideoStudio: React.FC = () => {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    name: "",
    topic: "",
    description: "",
    language: "en",
    aspectRatio: "16:9" as "16:9" | "9:16" | "1:1",
    targetDurationSec: 30,
    sceneCount: 4,
    style: "cinematic",
    musicMood: "",
    subtitles: true,
  });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/video/jobs", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) setJobs(json.data.jobs);
    } catch {
      /* transient */
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/video/providers", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) {
        setProviders(json.data.providers);
        setFfmpegAvailable(json.data.ffmpegAvailable);
      }
    } catch {
      /* transient */
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchProviders();
    pollRef.current = setInterval(fetchJobs, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchJobs, fetchProviders]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const activeCount = useMemo(
    () => jobs.filter((j) => j.status === "running" || j.status === "queued").length,
    [jobs]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) {
      setError("Please enter a topic for your video.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/video/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "proj_default",
          name: form.name.trim() || form.topic.slice(0, 60),
          topic: form.topic,
          description: form.description || undefined,
          language: form.language,
          aspectRatio: form.aspectRatio,
          targetDurationSec: form.targetDurationSec,
          sceneCount: form.sceneCount,
          style: form.style || undefined,
          musicMood: form.musicMood || undefined,
          subtitles: form.subtitles,
        }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error?.message || "Failed to create job");
      setSelectedJobId(json.data.job.id);
      setForm((f) => ({ ...f, name: "", topic: "", description: "" }));
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    await fetch(`/api/video/jobs/${id}`, { method: "DELETE" });
    fetchJobs();
  };

  const handleRetry = async (id: string) => {
    await fetch(`/api/video/jobs/${id}`, { method: "POST" });
    fetchJobs();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070A11]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
              <Clapperboard className="text-[#00D2FF]" />
              Video Generation Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Script to rendered MP4 — powered by multi-provider pipeline and FFmpeg.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#0D1322] border border-[#1E2A44] text-xs text-slate-300 flex items-center gap-2">
              <Cpu size={13} className="text-[#00D2FF]" />
              FFmpeg:{" "}
              {ffmpegAvailable === null
                ? "checking…"
                : ffmpegAvailable
                ? "available"
                : "not found"}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#0D1322] border border-[#1E2A44] text-xs text-slate-300 flex items-center gap-2">
              <Loader2 size={13} className={activeCount > 0 ? "animate-spin text-sky-400" : "text-slate-500"} />
              {activeCount} active
            </span>
          </div>
        </div>

        {ffmpegAvailable === false && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">FFmpeg not detected</div>
              <div className="text-xs text-amber-200/80 mt-0.5">
                Set the FFMPEG_PATH environment variable to your ffmpeg.exe to enable real MP4 rendering.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Creation form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 p-5 rounded-2xl bg-[#0D1322] border border-[#1E2A44] space-y-4 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">New Video</h2>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Title</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Optional — defaults to topic"
                className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white placeholder:text-slate-600 focus:border-[#00D2FF] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Topic *</label>
              <textarea
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. The future of renewable energy in 60 seconds"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white placeholder:text-slate-600 focus:border-[#00D2FF] outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Additional context</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tone, audience, key points…"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white placeholder:text-slate-600 focus:border-[#00D2FF] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white focus:border-[#00D2FF] outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Aspect ratio</label>
                <select
                  value={form.aspectRatio}
                  onChange={(e) =>
                    setForm({ ...form, aspectRatio: e.target.value as "16:9" | "9:16" | "1:1" })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white focus:border-[#00D2FF] outline-none"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Vertical</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Duration (sec)</label>
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={form.targetDurationSec}
                  onChange={(e) =>
                    setForm({ ...form, targetDurationSec: Number(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white focus:border-[#00D2FF] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Scenes</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={form.sceneCount}
                  onChange={(e) => setForm({ ...form, sceneCount: Number(e.target.value) || 4 })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white focus:border-[#00D2FF] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Style</label>
                <input
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  placeholder="cinematic"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white placeholder:text-slate-600 focus:border-[#00D2FF] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Music mood</label>
                <input
                  value={form.musicMood}
                  onChange={(e) => setForm({ ...form, musicMood: e.target.value })}
                  placeholder="optional"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] text-sm text-white placeholder:text-slate-600 focus:border-[#00D2FF] outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.subtitles}
                onChange={(e) => setForm({ ...form, subtitles: e.target.checked })}
                className="accent-[#0066FF] w-4 h-4"
              />
              <Subtitles size={15} className="text-[#00D2FF]" />
              Burn subtitles
            </label>

            {error && (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-[#0077FF] hover:to-[#0060E6] disabled:opacity-50 text-white text-sm font-semibold shadow-[0_0_15px_rgba(0,102,255,0.35)] transition"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isSubmitting ? "Starting…" : "Generate Video"}
            </button>
          </form>

          {/* Jobs + preview */}
          <div className="lg:col-span-3 space-y-5">
            {selectedJob && (
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E2A44]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white truncate pr-3">{selectedJob.name}</h2>
                  <span
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase ${
                      STATUS_STYLES[selectedJob.status] || STATUS_STYLES.queued
                    }`}
                  >
                    {selectedJob.status}
                  </span>
                </div>

                {selectedJob.status === "completed" && selectedJob.outputUrl ? (
                  <video
                    controls
                    src={selectedJob.outputUrl}
                    className="w-full rounded-xl border border-[#1E2A44] bg-black"
                  />
                ) : (
                  <div className="aspect-video rounded-xl border border-[#1E2A44] bg-[#0A0E1A] flex flex-col items-center justify-center gap-3">
                    {selectedJob.status === "failed" ? (
                      <>
                        <XCircle size={32} className="text-rose-400" />
                        <div className="text-xs text-rose-300 px-6 text-center">
                          {selectedJob.error || "Generation failed"}
                        </div>
                      </>
                    ) : (
                      <>
                        <Loader2 size={28} className="animate-spin text-[#00D2FF]" />
                        <div className="text-sm text-slate-300">
                          {STAGE_LABELS[selectedJob.stage] || selectedJob.stage}
                        </div>
                        <div className="w-2/3 h-1.5 rounded-full bg-[#1E2A44] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#0066FF] to-[#00D2FF] transition-all"
                            style={{ width: `${selectedJob.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500">{selectedJob.progress}%</div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {selectedJob.status === "completed" && selectedJob.outputUrl && (
                    <a
                      href={selectedJob.outputUrl}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-xs font-semibold text-white transition"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  )}
                  {(selectedJob.status === "running" || selectedJob.status === "queued") && (
                    <button
                      onClick={() => handleCancel(selectedJob.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2A44] hover:bg-[#2a3a5c] text-xs font-semibold text-slate-200 transition"
                    >
                      <XCircle size={13} />
                      Cancel
                    </button>
                  )}
                  {(selectedJob.status === "failed" || selectedJob.status === "cancelled") && (
                    <button
                      onClick={() => handleRetry(selectedJob.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2A44] hover:bg-[#2a3a5c] text-xs font-semibold text-slate-200 transition"
                    >
                      <RefreshCw size={13} />
                      Retry
                    </button>
                  )}
                  {selectedJob.durationSec ? (
                    <span className="text-xs text-slate-500 ml-auto">
                      {selectedJob.durationSec.toFixed(1)}s
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Job list */}
            <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E2A44]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Film size={15} className="text-[#00D2FF]" />
                  Render Queue
                </h2>
                <button
                  onClick={fetchJobs}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#151F33] transition"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No videos yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selectedJobId === job.id
                          ? "border-[#00D2FF] bg-[#0F1A2E]"
                          : "border-[#1E2A44] bg-[#0A0E1A] hover:border-[#2a3a5c]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-white truncate">{job.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase flex-shrink-0 ${
                            STATUS_STYLES[job.status] || STATUS_STYLES.queued
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1 rounded-full bg-[#1E2A44] overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              job.status === "failed"
                                ? "bg-rose-500"
                                : job.status === "completed"
                                ? "bg-emerald-500"
                                : "bg-gradient-to-r from-[#0066FF] to-[#00D2FF]"
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 w-24 text-right flex items-center justify-end gap-1">
                          {job.status === "completed" ? (
                            <CheckCircle2 size={11} className="text-emerald-400" />
                          ) : job.status === "failed" ? (
                            <XCircle size={11} className="text-rose-400" />
                          ) : (
                            <Clock size={11} />
                          )}
                          {STAGE_LABELS[job.stage] || job.stage}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Providers */}
            <div className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E2A44]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
                Pipeline Providers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-[#0A0E1A] border border-[#1E2A44] flex items-center gap-2"
                  >
                    {p.kind === "llm" ? (
                      <Cpu size={14} className="text-[#00D2FF] flex-shrink-0" />
                    ) : p.kind === "tts" ? (
                      <Mic size={14} className="text-[#00D2FF] flex-shrink-0" />
                    ) : p.kind === "music" ? (
                      <Music size={14} className="text-[#00D2FF] flex-shrink-0" />
                    ) : p.kind === "subtitle" ? (
                      <Subtitles size={14} className="text-[#00D2FF] flex-shrink-0" />
                    ) : (
                      <Film size={14} className="text-[#00D2FF] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-200 truncate">{p.label}</div>
                      <div className="text-[9px] text-slate-500 uppercase">{p.kind}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};