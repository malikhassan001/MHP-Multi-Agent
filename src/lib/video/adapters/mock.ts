import fs from "fs";
import path from "path";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/core/logger";
import { runFfmpeg } from "../ffmpeg";
import {
  BaseProvider,
  GenerationContext,
  ImageProvider,
  LLMProvider,
  MusicProvider,
  ProviderHealth,
  StockProvider,
  StorageProvider,
  SubtitleProvider,
  TTSProvider,
  VideoProvider,
} from "../types";

const log = logger.child("provider:mock");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function tick(ctx: GenerationContext, from: number, to: number, steps = 5): Promise<void> {
  for (let i = 1; i <= steps; i++) {
    if (ctx.signal?.aborted) throw new Error("Generation aborted");
    const pct = from + ((to - from) * i) / steps;
    ctx.onProgress?.(Math.round(pct));
    await sleep(120);
  }
}

const PALETTE = ["0x0D1322", "0x121A2D", "0x102A43", "0x0A1B2E", "0x1B2A4A", "0x0F2033"];

abstract class MockBase implements BaseProvider {
  abstract id: string;
  abstract kind: BaseProvider["kind"];
  abstract label: string;
  requiresKey = false;
  local = true;
  capabilities: string[] = [];

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<ProviderHealth> {
    return { id: this.id, kind: this.kind, status: "available", latencyMs: 0, message: "mock" };
  }
}

export class MockLLMProvider extends MockBase implements LLMProvider {
  id = "mock-llm";
  kind = "llm" as const;
  label = "Mock LLM";
  capabilities = ["text", "script", "storyboard"];

  async complete(prompt: string, ctx: GenerationContext, options?: { system?: string }): Promise<string> {
    await tick(ctx, 0, 100, 4);
    const topic = prompt.slice(0, 120).replace(/\s+/g, " ").trim();
    return [
      `# ${topic || "Generated Video"}`,
      "",
      "A cinematic establishing shot sets the mood, introducing the core idea with crisp narration.",
      "",
      "The narrative expands with concrete details, visuals and on-screen context for the viewer.",
      "",
      "A concise wrap-up reinforces the key takeaway and calls the audience to action.",
      "",
      options?.system ? `(guided by: ${options.system.slice(0, 60)})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async *stream(prompt: string, ctx: GenerationContext, options?: { system?: string }): AsyncIterable<string> {
    const text = await this.complete(prompt, ctx, options);
    for (const word of text.split(/(\s+)/)) {
      if (ctx.signal?.aborted) throw new Error("Generation aborted");
      yield word;
      await sleep(8);
    }
  }
}

export class MockTTSProvider extends MockBase implements TTSProvider {
  id = "mock-tts";
  kind = "tts" as const;
  label = "Mock TTS";
  capabilities = ["speech", "narration", "multilingual"];

  async synthesize(
    text: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { voice?: string; language?: string; speed?: number }
  ): Promise<{ path: string; durationSec: number }> {
    ensureDir(outPath);
    const words = text.split(/\s+/).filter(Boolean).length;
    const durationSec = Math.max(1, Math.min(8, Math.round((words / 150) * 60 * 10) / 10));
    await tick(ctx, 0, 80, 4);
    try {
      await runFfmpeg(
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `sine=frequency=200:sample_rate=44100:duration=${durationSec.toFixed(3)}`,
          "-af",
          "volume=0.08",
          outPath,
        ],
        { timeoutMs: 30000, signal: ctx.signal }
      );
    } catch (err) {
      log.warn("Mock TTS ffmpeg failed, writing silent placeholder", {
        error: err instanceof Error ? err.message : String(err),
      });
      fs.writeFileSync(outPath, "MOCK-AUDIO", "utf-8");
    }
    ctx.onProgress?.(100);
    log.info("Mock TTS synthesized", { outPath, durationSec });
    return { path: outPath, durationSec };
  }
}

export class MockImageProvider extends MockBase implements ImageProvider {
  id = "mock-image";
  kind = "image" as const;
  label = "Mock Image";
  capabilities = ["image", "thumbnail", "background"];

  async generate(
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { width?: number; height?: number; seed?: number }
  ): Promise<{ path: string; width: number; height: number }> {
    ensureDir(outPath);
    const width = options?.width || 1280;
    const height = options?.height || 720;
    await tick(ctx, 0, 80, 4);

    const seed = options?.seed ?? prompt.length;
    const color = PALETTE[Math.abs(seed) % PALETTE.length];

    try {
      await runFfmpeg(
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=${color}:s=${width}x${height}`,
          "-frames:v",
          "1",
          outPath,
        ],
        { timeoutMs: 30000, signal: ctx.signal }
      );
    } catch (err) {
      log.warn("Mock image ffmpeg failed, writing solid fallback", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    ctx.onProgress?.(100);
    return { path: outPath, width, height };
  }
}

export class MockVideoProvider extends MockBase implements VideoProvider {
  id = "mock-video";
  kind = "video" as const;
  label = "Mock Video";
  capabilities = ["video", "clip", "animation"];

  async generateClip(
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { durationSec?: number; width?: number; height?: number }
  ): Promise<{ path: string; durationSec: number }> {
    ensureDir(outPath);
    const durationSec = options?.durationSec || 5;
    const width = options?.width || 1280;
    const height = options?.height || 720;
    await tick(ctx, 0, 80, 6);
    await runFfmpeg(
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x0D1322:s=${width}x${height}:r=30`,
        "-t",
        durationSec.toFixed(3),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        outPath,
      ],
      { timeoutMs: 60000, signal: ctx.signal }
    );
    ctx.onProgress?.(100);
    return { path: outPath, durationSec };
  }
}

export class MockMusicProvider extends MockBase implements MusicProvider {
  id = "mock-music";
  kind = "music" as const;
  label = "Mock Music";
  capabilities = ["music", "sfx", "ambience"];

  async generate(
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { durationSec?: number; mood?: string }
  ): Promise<{ path: string; durationSec: number }> {
    ensureDir(outPath);
    const durationSec = options?.durationSec || 30;
    await tick(ctx, 0, 80, 4);
    const freq = options?.mood === "uplifting" ? 330 : options?.mood === "tense" ? 160 : 220;
    try {
      await runFfmpeg(
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `sine=frequency=${freq}:sample_rate=44100:duration=${durationSec.toFixed(3)}`,
          "-af",
          "volume=0.12",
          "-c:a",
          "pcm_s16le",
          outPath,
        ],
        { timeoutMs: 60000, signal: ctx.signal }
      );
    } catch (err) {
      log.warn("Mock music ffmpeg failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    ctx.onProgress?.(100);
    return { path: outPath, durationSec };
  }
}

export class MockStockProvider extends MockBase implements StockProvider {
  id = "mock-stock";
  kind = "stock" as const;
  label = "Mock Stock";
  capabilities = ["stock-video", "stock-image"];

  async search(
    query: string,
    ctx: GenerationContext,
    options?: { count?: number; kind?: "video" | "image" }
  ): Promise<Array<{ url: string; thumbnail?: string; durationSec?: number; width?: number; height?: number }>> {
    await tick(ctx, 0, 100, 3);
    const count = options?.count || 3;
    return Array.from({ length: count }, (_, i) => ({
      url: `mock://stock/${encodeURIComponent(query)}/${i}.${options?.kind === "image" ? "jpg" : "mp4"}`,
      thumbnail: `mock://stock/${encodeURIComponent(query)}/${i}.thumb.jpg`,
      durationSec: options?.kind === "image" ? undefined : 6,
      width: 1920,
      height: 1080,
    }));
  }
}

export class LocalStorageProvider extends MockBase implements StorageProvider {
  id = "local-storage";
  kind = "storage" as const;
  label = "Local Storage";
  capabilities = ["local", "filesystem"];

  async put(localPath: string, key: string): Promise<{ url: string; key: string }> {
    const dest = path.join(env.exportsDir, key);
    ensureDir(dest);
    if (path.resolve(localPath) !== path.resolve(dest)) {
      fs.copyFileSync(localPath, dest);
    }
    return { url: this.getUrl(key), key };
  }

  getUrl(key: string): string {
    return `/api/exports/${encodeURIComponent(key)}`;
  }

  async remove(key: string): Promise<boolean> {
    const target = path.join(env.exportsDir, key);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      return true;
    }
    return false;
  }
}

export class SrtSubtitleProvider extends MockBase implements SubtitleProvider {
  id = "srt-subtitles";
  kind = "subtitle" as const;
  label = "SRT Subtitles";
  capabilities = ["srt", "vtt"];

  async build(
    segments: Array<{ start: number; end: number; text: string }>,
    outPath: string,
    options?: { format?: "srt" | "vtt" }
  ): Promise<{ path: string; format: string }> {
    ensureDir(outPath);
    const format = options?.format || "srt";
    const content =
      format === "vtt"
        ? "WEBVTT\n\n" + segments.map((s) => `${fmtVtt(s.start)} --> ${fmtVtt(s.end)}\n${s.text}`).join("\n\n")
        : segments.map((s, i) => `${i + 1}\n${fmtSrt(s.start)} --> ${fmtSrt(s.end)}\n${s.text}`).join("\n\n");
    fs.writeFileSync(outPath, content, "utf-8");
    return { path: outPath, format };
  }
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function fmtSrt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function fmtVtt(sec: number): string {
  return fmtSrt(sec).replace(",", ".");
}