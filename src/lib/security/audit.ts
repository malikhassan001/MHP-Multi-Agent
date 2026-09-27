import { db, Collections } from "@/lib/db";
import { BaseRecord } from "@/lib/db/types";
import { logger } from "@/lib/core/logger";

const log = logger.child("audit");

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.denied"
  | "project.create"
  | "project.delete"
  | "job.create"
  | "job.cancel"
  | "job.retry"
  | "asset.delete"
  | "settings.update"
  | "apikey.update";

export interface AuditLogRecord extends BaseRecord {
  action: AuditAction | string;
  actor: string;
  resourceType: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success: boolean;
}

export function recordAudit(entry: Omit<AuditLogRecord, "id" | "createdAt" | "updatedAt">): void {
  try {
    const collection = db.collection<AuditLogRecord>(Collections.auditLogs);
    collection.insert({
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    log.warn("Failed to write audit entry", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}