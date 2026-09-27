import { TaskGraph, TaskNode, TaskNodeStatus } from "./types";

export class TaskExecutionGraph {
  public graph: TaskGraph;

  constructor(id: string, title: string, userPrompt: string) {
    this.graph = {
      id,
      title,
      userPrompt,
      status: "pending",
      nodes: [],
      createdAt: Date.now(),
      artifacts: [],
    };
  }

  public addNode(node: Omit<TaskNode, "status" | "retries">): void {
    this.graph.nodes.push({
      ...node,
      status: "pending",
      retries: 0,
    });
  }

  public getReadyNodes(): TaskNode[] {
    return this.graph.nodes.filter((node) => {
      if (node.status !== "pending") return false;
      return node.dependencies.every((depId) => {
        const dep = this.graph.nodes.find((n) => n.id === depId);
        return dep?.status === "completed";
      });
    });
  }

  public updateNodeStatus(
    nodeId: string,
    status: TaskNodeStatus,
    output?: unknown,
    error?: string,
    durationMs?: number
  ): void {
    const node = this.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.status = status;
    if (output !== undefined) node.output = output;
    if (error !== undefined) node.error = error;
    if (durationMs !== undefined) node.durationMs = durationMs;

    // Check if graph is finished
    const allCompleted = this.graph.nodes.every((n) => n.status === "completed");
    const anyFailed = this.graph.nodes.some((n) => n.status === "failed");

    if (allCompleted) {
      this.graph.status = "completed";
      this.graph.completedAt = Date.now();
    } else if (anyFailed && this.getReadyNodes().length === 0) {
      this.graph.status = "failed";
      this.graph.completedAt = Date.now();
    } else {
      this.graph.status = "running";
    }
  }
}
