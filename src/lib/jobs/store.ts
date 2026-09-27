import { db, Collections } from "@/lib/db";
import { Collection } from "@/lib/db/types";
import { JobStage, JobStatus, VideoJob, VideoJobInput } from "./types";

class JobStore {
  private collection: Collection<VideoJob> = db.collection<VideoJob>(Collections.jobs);

  public create(projectId: string, ownerId: string, name: string, input: VideoJobInput): VideoJob {
    const now = Date.now();
    const job: VideoJob = {
      id: `job_${now}_${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      ownerId,
      name,
      status: "queued",
      stage: "pending",
      progress: 0,
      input,
      scenes: [],
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now,
      logs: [],
    };
    this.collection.insert(job);
    return job;
  }

  public get(id: string): VideoJob | undefined {
    return this.collection.get(id);
  }

  public all(): VideoJob[] {
    return this.collection.query({ sortBy: "createdAt", sortDir: "desc" });
  }

  public byProject(projectId: string): VideoJob[] {
    return this.all().filter((j) => j.projectId === projectId);
  }

  public byStatus(status: JobStatus): VideoJob[] {
    return this.all().filter((j) => j.status === status);
  }

  public update(id: string, patch: Partial<VideoJob>): VideoJob | undefined {
    return this.collection.update(id, { ...patch, updatedAt: Date.now() });
  }

  public setStatus(id: string, status: JobStatus): VideoJob | undefined {
    const patch: Partial<VideoJob> = { status };
    if (status === "running") patch.startedAt = Date.now();
    if (status === "completed" || status === "failed" || status === "cancelled") {
      patch.finishedAt = Date.now();
    }
    return this.update(id, patch);
  }

  public setStage(id: string, stage: JobStage, progress: number): VideoJob | undefined {
    return this.update(id, { stage, progress });
  }

  public log(id: string, level: string, message: string): void {
    const job = this.get(id);
    if (!job) return;
    const logs = [...(job.logs || []), { at: Date.now(), level, message }].slice(-200);
    this.update(id, { logs });
  }

  public remove(id: string): boolean {
    return this.collection.delete(id);
  }

  public queued(): VideoJob[] {
    return this.all().filter((j) => j.status === "queued");
  }
}

export const jobStore = new JobStore();