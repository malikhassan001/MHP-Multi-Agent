import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/core/api";
import { notFound } from "@/lib/core/errors";
import { requireUser } from "@/lib/auth/session";
import { jobStore } from "@/lib/jobs/store";
import { cancelJob, startJob } from "@/lib/jobs/orchestrator";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    requireUser(req);
    const job = jobStore.get(params.id);
    if (!job) throw notFound("Job not found");
    return ok({ job });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireUser(req);
    const job = jobStore.get(params.id);
    if (!job) throw notFound("Job not found");
    cancelJob(params.id);
    jobStore.setStatus(params.id, "cancelled");
    return ok({ id: params.id, cancelled: true, owner: user.id });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    requireUser(req);
    const job = jobStore.get(params.id);
    if (!job) throw notFound("Job not found");
    if (job.status === "running" || job.status === "queued") {
      return ok({ job, action: "noop" });
    }
    jobStore.update(params.id, { status: "queued", progress: 0, error: undefined });
    startJob(params.id);
    return ok({ job: jobStore.get(params.id), action: "restarted" });
  } catch (err) {
    return fail(err);
  }
}