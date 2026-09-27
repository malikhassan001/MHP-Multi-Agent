import { BaseRecord } from "@/lib/db/types";

export type JobStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type JobStage =
  | "pending"
  | "planning"
  | "script"
  | "voiceover"
  | "visuals"
  | "music"
  | "subtitles"
  | "render"
  | "finalize"
  | "done";

export interface VideoJobInput {
  topic: string;
  description?: string;
  language?: string;
  voice?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  targetDurationSec?: number;
  style?: string;
  musicMood?: string;
  subtitles?: boolean;
  sceneCount?: number;
}

export interface JobScene {
  index: number;
  text: string;
  durationSec: number;
  imagePath?: string;
  audioPath?: string;
}

export interface VideoJob extends BaseRecord {
  projectId: string;
  ownerId: string;
  name: string;
  status: JobStatus;
  stage: JobStage;
  progress: number;
  input: VideoJobInput;
  scenes: JobScene[];
  outputPath?: string;
  outputUrl?: string;
  durationSec?: number;
  error?: string;
  attempts: number;
  maxAttempts: number;
  startedAt?: number;
  finishedAt?: number;
  logs: Array<{ at: number; level: string; message: string }>;
}

export interface JobProgressEvent {
  jobId: string;
  status: JobStatus;
  stage: JobStage;
  progress: number;
  message?: string;
  at: number;
}