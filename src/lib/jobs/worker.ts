import { env } from "@/lib/config/env";
import { logger } from "@/lib/core/logger";
import { jobStore } from "./store";
import { isJobActive, runJob } from "./orchestrator";

const log = logger.child("jobs:worker");

class JobWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = 0;
  private started = false;

  public start(): void {
    if (this.started) return;
    this.started = true;
    log.info("Job worker started", { concurrency: env.maxConcurrentJobs });
    this.timer = setInterval(() => this.tick(), 1500);
    if (this.timer.unref) this.timer.unref();
    this.tick();
  }

  public stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  private tick(): void {
    if (this.running >= env.maxConcurrentJobs) return;
    const next = jobStore.queued().find((j) => !isJobActive(j.id));
    if (!next) return;
    this.running += 1;
    runJob(next.id)
      .catch((err) => log.error("Worker job error", { jobId: next.id, error: String(err) }))
      .finally(() => {
        this.running = Math.max(0, this.running - 1);
      });
  }

  public status(): { running: number; concurrency: number; started: boolean } {
    return { running: this.running, concurrency: env.maxConcurrentJobs, started: this.started };
  }
}

export const jobWorker = new JobWorker();

export function ensureWorkerStarted(): void {
  if (!jobWorker.status().started) jobWorker.start();
}