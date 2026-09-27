import fs from "fs";
import path from "path";
import { env, ensureDataDirs } from "@/lib/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const activeLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (env.mode === "production" ? "info" : "debug");

let logFilePath = "";

function getLogFilePath(): string {
  if (logFilePath) return logFilePath;
  try {
    ensureDataDirs();
    const dir = path.join(env.dataDir, "logs");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    logFilePath = path.join(dir, "mhp.log");
  } catch {
    logFilePath = "";
  }
  return logFilePath;
}

function serializeMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return " " + JSON.stringify(meta, redactSensitive);
  } catch {
    return "";
  }
}

const SENSITIVE_KEYS = [
  "apikey",
  "api_key",
  "authorization",
  "password",
  "secret",
  "token",
  "key",
];

function redactSensitive(_key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value;
}

function shouldRedact(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => k.includes(s));
}

function safeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = shouldRedact(k) ? "[redacted]" : v;
  }
  return out;
}

function write(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel]) return;

  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] [${scope}] ${message}${serializeMeta(safeMeta(meta))}`;

  const consoleFn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(line);

  const file = getLogFilePath();
  if (file) {
    try {
      fs.appendFileSync(file, line + "\n", "utf-8");
    } catch {
      /* logging must never throw */
    }
  }
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  child: (scope: string) => Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, meta) => write("debug", scope, m, meta),
    info: (m, meta) => write("info", scope, m, meta),
    warn: (m, meta) => write("warn", scope, m, meta),
    error: (m, meta) => write("error", scope, m, meta),
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger("mhp");