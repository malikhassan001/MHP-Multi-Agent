import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { env } from "@/lib/config/env";
import { notFound, forbidden } from "@/lib/core/errors";
import { fail } from "@/lib/core/api";

export const dynamic = "force-dynamic";

interface Params {
  params: { path: string[] };
}

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".srt": "text/plain; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const relative = (params.path || []).join("/");
    if (!relative || relative.includes("..")) throw forbidden("Invalid path");

    const root = path.resolve(env.exportsDir);
    const target = path.resolve(root, relative);
    if (!target.startsWith(root)) throw forbidden("Path traversal blocked");
    if (!fs.existsSync(target)) throw notFound("Export not found");

    const stat = fs.statSync(target);
    const ext = path.extname(target).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    const stream = fs.createReadStream(target);
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err) {
    return fail(err);
  }
}