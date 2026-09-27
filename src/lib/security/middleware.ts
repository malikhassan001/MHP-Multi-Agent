import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimiter } from "./rate-limit";
import { AppError, toAppError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

const log = logger.child("middleware");

const PROTECTED_PREFIXES = ["/api/"];

export function applySecurity(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const res = NextResponse.next();

  if (origin) {
    const allowed = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || [
      "http://localhost:3000",
    ];
    if (allowed.includes(origin) || allowed.includes("*")) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
    }
  }

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p))) {
    try {
      rateLimiter.consume(clientKey(req, "api"));
    } catch (err) {
      const appError = toAppError(err);
      return NextResponse.json(appError.toJSON(), { status: appError.status });
    }
  }

  return res;
}

export function guard<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  return fn().catch((err) => {
    const appError = err instanceof AppError ? err : toAppError(err);
    log.warn(appError.message, { code: appError.code });
    return NextResponse.json(appError.toJSON(), { status: appError.status });
  });
}