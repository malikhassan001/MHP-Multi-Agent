export type VideoProviderKind =
  | "llm"
  | "tts"
  | "image"
  | "video"
  | "music"
  | "stock"
  | "storage"
  | "subtitle";

export type ProviderStatus = "available" | "degraded" | "unconfigured" | "offline";

export interface ProviderHealth {
  id: string;
  kind: VideoProviderKind;
  status: ProviderStatus;
  latencyMs?: number;
  message?: string;
}

export interface ProviderMeta {
  id: string;
  kind: VideoProviderKind;
  label: string;
  requiresKey: boolean;
  local: boolean;
  capabilities: string[];
}

export interface GenerationContext {
  jobId: string;
  workDir: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, note?: string) => void;
}

export interface BaseProvider extends ProviderMeta {
  isConfigured(): boolean;
  checkHealth(): Promise<ProviderHealth>;
}

export interface LLMProvider extends BaseProvider {
  kind: "llm";
  complete: (prompt: string, ctx: GenerationContext, options?: { system?: string }) => Promise<string>;
  stream: (
    prompt: string,
    ctx: GenerationContext,
    options?: { system?: string }
  ) => AsyncIterable<string>;
}

export interface TTSProvider extends BaseProvider {
  kind: "tts";
  synthesize: (
    text: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { voice?: string; language?: string; speed?: number }
  ) => Promise<{ path: string; durationSec: number }>;
}

export interface ImageProvider extends BaseProvider {
  kind: "image";
  generate: (
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { width?: number; height?: number; seed?: number }
  ) => Promise<{ path: string; width: number; height: number }>;
}

export interface VideoProvider extends BaseProvider {
  kind: "video";
  generateClip: (
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { durationSec?: number; width?: number; height?: number }
  ) => Promise<{ path: string; durationSec: number }>;
}

export interface MusicProvider extends BaseProvider {
  kind: "music";
  generate: (
    prompt: string,
    outPath: string,
    ctx: GenerationContext,
    options?: { durationSec?: number; mood?: string }
  ) => Promise<{ path: string; durationSec: number }>;
}

export interface StockProvider extends BaseProvider {
  kind: "stock";
  search: (
    query: string,
    ctx: GenerationContext,
    options?: { count?: number; kind?: "video" | "image" }
  ) => Promise<Array<{ url: string; thumbnail?: string; durationSec?: number; width?: number; height?: number }>>;
}

export interface StorageProvider extends BaseProvider {
  kind: "storage";
  put: (localPath: string, key: string) => Promise<{ url: string; key: string }>;
  getUrl: (key: string) => string;
  remove: (key: string) => Promise<boolean>;
}

export interface SubtitleProvider extends BaseProvider {
  kind: "subtitle";
  build: (
    segments: Array<{ start: number; end: number; text: string }>,
    outPath: string,
    options?: { format?: "srt" | "vtt" }
  ) => Promise<{ path: string; format: string }>;
}

export type AnyProvider =
  | LLMProvider
  | TTSProvider
  | ImageProvider
  | VideoProvider
  | MusicProvider
  | StockProvider
  | StorageProvider
  | SubtitleProvider;