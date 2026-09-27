import fs from "fs";
import path from "path";

export type AppMode = "development" | "production" | "test";

function readEnvFile(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env");
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  try {
    const raw = fs.readFileSync(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .replace(/^["']|["']$/g, "")
        .trim();
      if (key) result[key] = value;
    }
  } catch {
    return result;
  }
  return result;
}

const fileEnv = readEnvFile();

function read(key: string, fallback = ""): string {
  return process.env[key] ?? fileEnv[key] ?? fallback;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = read(key, "");
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function readInt(key: string, fallback: number): number {
  const raw = read(key, "");
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  mode: (read("NODE_ENV", "development") as AppMode) || "development",
  port: readInt("PORT", 3000),

  mockAI: readBool("MOCK_AI", true),

  appSecret: read("APP_SECRET", "mhp_dev_secret_change_in_production"),
  authSecret: read("AUTH_SECRET", read("APP_SECRET", "mhp_dev_secret_change_in_production")),
  allowAnonymous: readBool("ALLOW_ANONYMOUS", true),

  databaseDriver: read("DATABASE_DRIVER", "file"),
  databaseUrl: read("DATABASE_URL", "file:./mhp.db"),
  dataDir: read("MHP_DATA_DIR", path.resolve(process.cwd(), "data")),

  workspaceRoot: read("WORKSPACE_ROOT", path.resolve(process.cwd(), "workspace")),
  exportsDir: read("MHP_EXPORTS_DIR", path.resolve(process.cwd(), "exports")),
  uploadsDir: read("MHP_UPLOADS_DIR", path.resolve(process.cwd(), "uploads")),

  ffmpegPath: read("FFMPEG_PATH", "ffmpeg"),
  ffprobePath: read("FFPROBE_PATH", "ffprobe"),

  executionTimeoutMs: readInt("EXECUTION_TIMEOUT_MS", 30000),
  renderTimeoutMs: readInt("RENDER_TIMEOUT_MS", 1000 * 60 * 30),
  maxOutputBytes: readInt("MAX_OUTPUT_BYTES", 1048576),
  maxUploadBytes: readInt("MAX_UPLOAD_BYTES", 1024 * 1024 * 512),

  rateLimitWindowMs: readInt("RATE_LIMIT_WINDOW_MS", 60000),
  rateLimitMax: readInt("RATE_LIMIT_MAX", 120),
  rateLimit: {
    windowMs: readInt("RATE_LIMIT_WINDOW_MS", 60000),
    max: readInt("RATE_LIMIT_MAX", 120),
  },

  maxConcurrentJobs: readInt("MAX_CONCURRENT_JOBS", 2),

  allowedOrigins: read("ALLOWED_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  keys: {
    openai: read("OPENAI_API_KEY"),
    anthropic: read("ANTHROPIC_API_KEY"),
    gemini: read("GEMINI_API_KEY"),
    groq: read("GROQ_API_KEY"),
    openrouter: read("OPENROUTER_API_KEY"),
    elevenlabs: read("ELEVENLABS_API_KEY"),
    replicate: read("REPLICATE_API_TOKEN"),
    stability: read("STABILITY_API_KEY"),
    pexels: read("PEXELS_API_KEY"),
    pixabay: read("PIXABAY_API_KEY"),
    jamendo: read("JAMENDO_CLIENT_ID"),
  },
} as const;

export function isProduction(): boolean {
  return env.mode === "production";
}

export function isMockAI(): boolean {
  return env.mockAI;
}

export function ensureDataDirs(): void {
  for (const dir of [env.dataDir, env.exportsDir, env.uploadsDir, env.workspaceRoot]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}