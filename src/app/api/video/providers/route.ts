import { ok, fail } from "@/lib/core/api";
import { videoProviders } from "@/lib/video/registry";
import { isFfmpegAvailable } from "@/lib/video/ffmpeg";
import { jobWorker, ensureWorkerStarted } from "@/lib/jobs/worker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureWorkerStarted();
    const [health, ffmpeg] = await Promise.all([
      videoProviders.health(),
      isFfmpegAvailable(),
    ]);
    return ok({
      providers: videoProviders.meta(),
      health,
      ffmpegAvailable: ffmpeg,
      worker: jobWorker.status(),
    });
  } catch (err) {
    return fail(err);
  }
}