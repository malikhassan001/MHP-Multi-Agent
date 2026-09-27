import fs from "fs";
import path from "path";
import { env, ensureDataDirs } from "@/lib/config/env";
import { logger } from "@/lib/core/logger";
import { videoProviders } from "@/lib/video/registry";
import { GenerationContext } from "@/lib/video/types";
import { renderSlideshow, RenderSlide } from "@/lib/video/ffmpeg";
import { jobStore } from "./store";
import { JobScene, VideoJob } from "./types";

const log = logger.child("jobs:orchestrator");

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
};

export interface OrchestratorHandle {
  jobId: string;
  controller: AbortController;
}

const activeControllers: Map<string, AbortController> = new Map();

export function cancelJob(jobId: string): boolean {
  const controller = activeControllers.get(jobId);
  if (!controller) return false;
  controller.abort();
  activeControllers.delete(jobId);
  return true;
}

export function isJobActive(jobId: string): boolean {
  return activeControllers.has(jobId);
}

function buildContext(job: VideoJob, workDir: string, controller: AbortController): GenerationContext {
  return {
    jobId: job.id,
    workDir,
    signal: controller.signal,
    onProgress: (percent, note) => {
      const scaled = Math.min(99, Math.max(0, percent));
      jobStore.update(job.id, { progress: scaled });
      if (note) jobStore.log(job.id, "info", note);
    },
  };
}

function splitIntoScenes(script: string, targetCount: number, totalDuration: number): JobScene[] {
  const lines = script
    .split(/\n+/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .filter((l) => l.length > 20 && !/^scene\s*\d+/i.test(l));

  const chunks = lines.length > 0 ? lines : [script.trim() || "Generated scene"];
  const count = Math.min(Math.max(targetCount, 1), chunks.length);
  const per = totalDuration / count;
  const scenes: JobScene[] = [];
  for (let i = 0; i < count; i++) {
    scenes.push({
      index: i,
      text: chunks[i],
      durationSec: Math.max(2, Math.round(per * 10) / 10),
    });
  }
  return scenes;
}

export async function runJob(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  if (activeControllers.has(jobId)) return;
  const controller = new AbortController();
  activeControllers.set(jobId, controller);

  ensureDataDirs();
  const workDir = path.join(env.dataDir, "jobs", jobId);
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const ctx = buildContext(job, workDir, controller);
  const dims = ASPECT_DIMENSIONS[job.input.aspectRatio || "16:9"];
  const targetDuration = job.input.targetDurationSec || 30;
  const sceneCount = job.input.sceneCount || 4;

  try {
    jobStore.setStatus(jobId, "running");
    jobStore.update(jobId, { attempts: job.attempts + 1, error: undefined });

    jobStore.setStage(jobId, "planning", 5);
    jobStore.log(jobId, "info", "Planning video structure");

    jobStore.setStage(jobId, "script", 15);
    jobStore.log(jobId, "info", "Generating script");
    const llm = videoProviders.llm();
    const script = await llm.complete(
      `Write a ${targetDuration}-second video script about: ${job.input.topic}. ` +
        `Style: ${job.input.style || "cinematic"}. Language: ${job.input.language || "en"}. ` +
        `Structure it into ${sceneCount} distinct scenes.` +
        (job.input.description ? ` Additional context: ${job.input.description}` : ""),
      ctx,
      { system: "You are a professional video scriptwriter." }
    );

    const scenes = splitIntoScenes(script, sceneCount, targetDuration);
    jobStore.update(jobId, { scenes });

    jobStore.setStage(jobId, "voiceover", 30);
    const tts = videoProviders.tts();
    for (const scene of scenes) {
      if (controller.signal.aborted) throw new Error("Job cancelled");
      const audioPath = path.join(workDir, `vo_${scene.index}.wav`);
      const res = await tts.synthesize(scene.text, audioPath, ctx, {
        voice: job.input.voice,
        language: job.input.language,
      });
      scene.audioPath = res.path;
      scene.durationSec = Math.max(scene.durationSec, Math.min(res.durationSec, targetDuration));
    }
    jobStore.update(jobId, { scenes });
    jobStore.log(jobId, "info", `Voiceover generated for ${scenes.length} scenes`);

    jobStore.setStage(jobId, "visuals", 50);
    const image = videoProviders.image();
    for (const scene of scenes) {
      if (controller.signal.aborted) throw new Error("Job cancelled");
      const imagePath = path.join(workDir, `scene_${scene.index}.png`);
      await image.generate(scene.text, imagePath, ctx, { width: dims.width, height: dims.height });
      scene.imagePath = imagePath;
    }
    jobStore.update(jobId, { scenes });
    jobStore.log(jobId, "info", "Visuals generated");

    let musicPath: string | undefined;
    if (job.input.musicMood) {
      jobStore.setStage(jobId, "music", 62);
      const music = videoProviders.music();
      musicPath = path.join(workDir, "music.wav");
      await music.generate(job.input.topic, musicPath, ctx, {
        durationSec: targetDuration,
        mood: job.input.musicMood,
      });
      jobStore.log(jobId, "info", "Background music generated");
    }

    let subtitlePath: string | undefined;
    if (job.input.subtitles) {
      jobStore.setStage(jobId, "subtitles", 70);
      const sub = videoProviders.subtitles();
      let cursor = 0;
      const segments = scenes.map((s) => {
        const start = cursor;
        cursor += s.durationSec;
        return { start, end: cursor, text: s.text };
      });
      subtitlePath = path.join(workDir, "subtitles.srt");
      await sub.build(segments, subtitlePath, { format: "srt" });
      jobStore.log(jobId, "info", "Subtitles generated");
    }

    jobStore.setStage(jobId, "render", 75);
    jobStore.log(jobId, "info", "Rendering video with FFmpeg");

    const slides: RenderSlide[] = scenes.map((s) => ({
      imagePath: s.imagePath,
      text: s.text.slice(0, 120),
      durationSec: s.durationSec,
    }));

    const outputPath = path.join(env.exportsDir, `${jobId}.mp4`);
    const renderResult = await renderSlideshow({
      workDir,
      outputPath,
      width: dims.width,
      height: dims.height,
      slides,
      musicPath,
      subtitlePath,
      onProgress: (p) => {
        const scaled = 75 + Math.round((p / 100) * 20);
        jobStore.update(jobId, { progress: Math.min(98, scaled) });
      },
      signal: controller.signal,
    });

    jobStore.setStage(jobId, "finalize", 98);
    const storage = videoProviders.storage();
    const stored = await storage.put(outputPath, `${jobId}.mp4`);

    jobStore.update(jobId, {
      status: "completed",
      stage: "done",
      progress: 100,
      outputPath,
      outputUrl: stored.url,
      durationSec: renderResult.durationSec,
      finishedAt: Date.now(),
    });
    jobStore.log(jobId, "info", "Job completed successfully");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cancelled = controller.signal.aborted || /cancel/i.test(message);
    jobStore.update(jobId, {
      status: cancelled ? "cancelled" : "failed",
      error: message,
      finishedAt: Date.now(),
    });
    jobStore.log(jobId, cancelled ? "warn" : "error", message);
    log.error("Job failed", { jobId, error: message });
  } finally {
    activeControllers.delete(jobId);
  }
}

export function startJob(jobId: string): void {
  runJob(jobId).catch((err) => {
    log.error("Unhandled job error", { jobId, error: String(err) });
  });
}