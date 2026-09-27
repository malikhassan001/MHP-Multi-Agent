import crypto from "crypto";
import { env } from "@/lib/config/env";
import { AppError, unauthorized } from "@/lib/core/errors";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "guest";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  issuedAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const sessions: Map<string, AuthSession> = new Map();

function secret(): string {
  return env.authSecret || "mhp-local-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeToken(session: AuthSession): string {
  const body = Buffer.from(
    JSON.stringify({ sub: session.user.id, email: session.user.email, exp: session.expiresAt })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeToken(token: string): { sub: string; email: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (sign(body) !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSession(user: AuthUser): AuthSession {
  const session: AuthSession = {
    token: "",
    user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  session.token = encodeToken(session);
  sessions.set(session.token, session);
  return session;
}

export function verifyToken(token: string): AuthUser | null {
  const cached = sessions.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return { id: decoded.sub, email: decoded.email, name: decoded.email, role: "user" };
}

export function extractToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/mhp_session=([^;]+)/);
  return match ? match[1] : null;
}

export function requireUser(req: Request): AuthUser {
  if (env.allowAnonymous) {
    return { id: "mhp-local", email: "mhp@local", name: "Malik Hassan Phularwan (MHP)", role: "admin" };
  }
  const token = extractToken(req);
  if (!token) throw unauthorized();
  const user = verifyToken(token);
  if (!user) throw new AppError("UNAUTHORIZED", "Invalid or expired session");
  return user;
}

export function revokeSession(token: string): boolean {
  return sessions.delete(token);
}