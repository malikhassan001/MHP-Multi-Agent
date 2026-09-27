export type AgentCategory =
  | "chat"
  | "coding"
  | "web"
  | "file"
  | "creative"
  | "audio"
  | "video"
  | "business"
  | "utility"
  | "custom";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  instructions: string;
  capabilities: string[];
  tools: string[];
  supportedInputs: ("text" | "file" | "image" | "audio" | "code")[];
  supportedOutputs: ("text" | "code" | "artifact" | "image" | "audio" | "file")[];
  preferredModels?: string[];
  permissions?: string[];
  enabled: boolean;
  isCustom?: boolean;
  avatarIcon?: string;
}

export interface AgentRunContext {
  conversationId?: string;
  projectId?: string;
  taskId?: string;
  taskNodeId?: string;
  userInput: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url?: string;
    content?: string;
    size?: number;
  }[];
  previousOutputs?: Record<string, unknown>;
  projectFiles?: Record<string, string>;
  modelProviderId?: string;
  memoryContext?: string;
}

export interface AgentResult {
  success: boolean;
  agentId: string;
  summary: string;
  content: string;
  toolCalls?: {
    toolId: string;
    input: unknown;
    output: unknown;
    status: "success" | "error";
  }[];
  artifacts?: {
    id: string;
    name: string;
    type: "code" | "html" | "pdf" | "image" | "audio" | "report" | "json";
    content: string;
    metadata?: Record<string, unknown>;
  }[];
  errors?: string[];
  durationMs: number;
}
