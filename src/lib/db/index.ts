import { env } from "@/lib/config/env";
import { Database } from "./types";
import { createFileDatabase } from "./file-driver";

let instance: Database | null = null;

export function getDatabase(): Database {
  if (instance) return instance;
  switch (env.databaseDriver) {
    case "file":
    default:
      instance = createFileDatabase();
      break;
  }
  return instance;
}

export const db = getDatabase();

export const Collections = {
  projects: "projects",
  jobs: "jobs",
  assets: "assets",
  chapters: "chapters",
  scenes: "scenes",
  users: "users",
  sessions: "sessions",
  auditLogs: "audit_logs",
  characters: "characters",
  templates: "templates",
  presets: "presets",
} as const;

export type { Database, Collection, BaseRecord, QueryOptions } from "./types";