export interface MemoryItem {
  id: string;
  type: "user" | "project" | "conversation";
  targetId?: string; // projectId or conversationId
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
}

class MemoryStore {
  private memories: Map<string, MemoryItem> = new Map();

  constructor() {
    // Initial sample user memories
    this.addMemory({
      id: "mem_1",
      type: "user",
      key: "preferred_stack",
      value: "TypeScript, React, Next.js, Tailwind CSS",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    });
    this.addMemory({
      id: "mem_2",
      type: "user",
      key: "theme_preference",
      value: "Obsidian dark mode with neon cobalt accents",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    });
  }

  public addMemory(item: MemoryItem): void {
    this.memories.set(item.id, item);
  }

  public getMemories(type?: "user" | "project" | "conversation", targetId?: string): MemoryItem[] {
    return Array.from(this.memories.values()).filter((m) => {
      if (type && m.type !== type) return false;
      if (targetId && m.targetId !== targetId) return false;
      return true;
    });
  }

  public updateMemory(id: string, value: string, enabled?: boolean): boolean {
    const item = this.memories.get(id);
    if (!item) return false;
    item.value = value;
    if (enabled !== undefined) item.enabled = enabled;
    item.updatedAt = Date.now();
    return true;
  }

  public deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  public getContextString(projectId?: string): string {
    const active = Array.from(this.memories.values()).filter(
      (m) => m.enabled && (m.type === "user" || (m.type === "project" && m.targetId === projectId))
    );
    if (active.length === 0) return "";
    return `User & Project Memory:\n` + active.map((m) => `- ${m.key}: ${m.value}`).join("\n");
  }
}

export const memoryStore = new MemoryStore();
