export type TaskNodeStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface TaskNode {
  id: string;
  agentId: string;
  toolId?: string;
  title: string;
  description: string;
  dependencies: string[];
  input: Record<string, unknown>;
  status: TaskNodeStatus;
  output?: unknown;
  error?: string;
  durationMs?: number;
  retries: number;
}

export interface TaskGraph {
  id: string;
  title: string;
  userPrompt: string;
  status: TaskNodeStatus;
  nodes: TaskNode[];
  createdAt: number;
  completedAt?: number;
  artifacts: {
    id: string;
    name: string;
    type: string;
    path?: string;
    content?: string;
    previewUrl?: string;
  }[];
}
