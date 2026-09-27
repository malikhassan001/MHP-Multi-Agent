import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, parseBody } from "@/lib/core/api";
import { rateLimiter, clientKey } from "@/lib/security/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/security/audit";
import { jobStore } from "@/lib/jobs/store";
import { startJob } from "@/lib/jobs/orchestrator";
import { ensureWorkerStarted } from "@/lib/jobs/worker";

export const dynamic = "force-dynamic";

const CreateJobSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  topic: z.string().min(3).max(2000),
  description: z.string().max(4000).optional(),
  language: z.string().max(20).optional(),
  voice: z.string().max(60).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  targetDurationSec: z.number().int().min(5).max(3600).optional(),
  style: z.string().max(120).optional(),
  musicMood: z.string().max(60).optional(),
  subtitles: z.boolean().optional(),
  sceneCount: z.number().int().min(1).max(40).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = requireUser(req);
    ensureWorkerStarted();
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const jobs = projectId ? jobStore.byProject(projectId) : jobStore.all();
    return ok({
      jobs: jobs.map((j) => ({
        id: j.id,
        projectId: j.projectId,
        name: j.name,
        status: j.status,
        stage: j.stage,
        progress: j.progress,
        outputUrl: j.outputUrl,
        durationSec: j.durationSec,
        error: j.error,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
      owner: user.id,
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireUser(req);
    rateLimiter.consume(clientKey(req, "job-create"), 20, 60000);
    const body = await parseBody(req, CreateJobSchema);

    const job = jobStore.create(body.projectId, user.id, body.name, {
      topic: body.topic,
      description: body.description,
      language: body.language,
      voice: body.voice,
      aspectRatio: body.aspectRatio,
      targetDurationSec: body.targetDurationSec,
      style: body.style,
      musicMood: body.musicMood,
      subtitles: body.subtitles,
      sceneCount: body.sceneCount,
    });

    recordAudit({
      action: "job.create",
      actor: user.id,
      resourceType: "job",
      resourceId: job.id,
      ip: clientKey(req),
      success: true,
      metadata: { topic: body.topic },
    });

    ensureWorkerStarted();
    startJob(job.id);

    return ok({ job });
  } catch (err) {
    return fail(err);
  }
}