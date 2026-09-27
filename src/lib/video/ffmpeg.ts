import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/core/logger";
import { renderError } from "@/lib/core/errors";

const log = logger.child("ffmpeg");

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function runFfmpeg(
  args: string[],
  options?: { timeoutMs?: number; onStderr?: (chunk: string) => void; signal?: AbortSignal }
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const bin = env.ffmpegPath;
    const child = spawn(bin, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(renderError(`FFmpeg timed out after ${options?.timeoutMs ?? env.renderTimeoutMs}ms`));
      }
    }, options?.timeoutMs ?? env.renderTimeoutMs);

    const abortHandler = () => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(renderError("FFmpeg aborted"));
      }
    };
    options?.signal?.addEventListener("abort", abortHandler);

    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      const chunk = d.toString();
      stderr += chunk;
      options?.onStderr?.(chunk);
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(renderError(`Failed to launch FFmpeg (${bin}): ${err.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", abortHandler);
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(renderError(`FFmpeg exited with code ${code}`, stderr.slice(-2000)));
    });
  });
}

export async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const bin = env.ffprobePath;
    const child = spawn(bin, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], { windowsHide: true });
    let out = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.on("error", () => resolve(0));
    child.on("close", () => {
      const parsed = Number.parseFloat(out.trim());
      resolve(Number.isFinite(parsed) ? parsed : 0);
    });
  });
}

export interface RenderSlide {
  imagePath?: string;
  color?: string;
  text?: string;
  durationSec: number;
  audioPath?: string;
}

export interface RenderOptions {
  workDir: string;
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  slides: RenderSlide[];
  musicPath?: string;
  subtitlePath?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/%/g, "\\%")
    .replace(/\n/g, "\\n");
}

export async function renderSlideshow(options: RenderOptions): Promise<{ path: string; durationSec: number }> {
  const width = options.width ?? 1280;
  const height = options.height ?? 720;
  const fps = options.fps ?? 30;
  const workDir = options.workDir;
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  if (options.slides.length === 0) throw renderError("No slides to render");

  const totalDuration = options.slides.reduce((sum, s) => sum + s.durationSec, 0);
  const segmentPaths: string[] = [];

  for (let i = 0; i < options.slides.length; i++) {
    const slide = options.slides[i];
    const segPath = path.join(workDir, `segment_${String(i).padStart(3, "0")}.mp4`);
    const args: string[] = ["-y"];

    if (slide.imagePath && fs.existsSync(slide.imagePath)) {
      args.push("-loop", "1", "-t", slide.durationSec.toFixed(3), "-i", slide.imagePath);
    } else {
      args.push(
        "-f",
        "lavfi",
        "-t",
        slide.durationSec.toFixed(3),
        "-i",
        `color=c=${slide.color || "black"}:s=${width}x${height}:r=${fps}`
      );
    }

    const filters: string[] = [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
      "format=yuv420p",
    ];

    if (slide.text) {
      filters.push(
        `drawtext=text='${escapeDrawText(slide.text)}':fontcolor=white:fontsize=${Math.round(
          height / 14
        )}:box=1:boxcolor=black@0.5:boxborderw=20:x=(w-text_w)/2:y=h-text_h-60`
      );
    }

    args.push(
      "-vf",
      filters.join(","),
      "-r",
      String(fps),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-t",
      slide.durationSec.toFixed(3),
      segPath
    );

    await runFfmpeg(args, {
      timeoutMs: env.renderTimeoutMs,
      signal: options.signal,
    });
    segmentPaths.push(segPath);
    options.onProgress?.(Math.round(((i + 1) / (options.slides.length + 2)) * 100));
  }

  const concatList = path.join(workDir, "concat.txt");
  fs.writeFileSync(
    concatList,
    segmentPaths.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"),
    "utf-8"
  );

  const mergedPath = path.join(workDir, "merged.mp4");
  await runFfmpeg(
    ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", mergedPath],
    { signal: options.signal }
  );
  options.onProgress?.(Math.round(((options.slides.length + 1) / (options.slides.length + 2)) * 100));

  let finalInput = mergedPath;
  const postArgs: string[] = [];

  if (options.musicPath && fs.existsSync(options.musicPath)) {
    postArgs.push("-i", options.musicPath);
  }

  const outputArgs: string[] = ["-y", "-i", finalInput];
  if (options.musicPath && fs.existsSync(options.musicPath)) {
    outputArgs.push("-i", options.musicPath);
  }

  const vf: string[] = [];
  if (options.subtitlePath && fs.existsSync(options.subtitlePath)) {
    const sub = options.subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:");
    vf.push(`subtitles='${sub}'`);
  }

  if (vf.length > 0) outputArgs.push("-vf", vf.join(","));

  if (options.musicPath && fs.existsSync(options.musicPath)) {
    outputArgs.push("-map", "0:v:0", "-map", "1:a:0", "-shortest", "-c:v", "libx264", "-preset", "veryfast");
    outputArgs.push("-c:a", "aac", "-b:a", "192k");
  } else {
    outputArgs.push("-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p");
  }

  outputArgs.push("-movflags", "+faststart", options.outputPath);

  await runFfmpeg(outputArgs, {
    timeoutMs: env.renderTimeoutMs,
    signal: options.signal,
  });
  options.onProgress?.(100);

  const durationSec = await probeDuration(options.outputPath);
  log.info("Render complete", { outputPath: options.outputPath, durationSec });
  return { path: options.outputPath, durationSec: durationSec || totalDuration };
}

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await runFfmpeg(["-version"], { timeoutMs: 8000 });
    return true;
  } catch {
    return false;
  }
}