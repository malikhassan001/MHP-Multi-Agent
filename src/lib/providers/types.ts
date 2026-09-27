export type ModelCapability =
  | "chat"
  | "code"
  | "vision"
  | "function_calling"
  | "json_mode"
  | "embedding"
  | "fast_inference";

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  contextLength: number;
  capabilities: ModelCapability[];
  isLocal: boolean;
  costPer1kTokens?: { prompt: number; completion: number };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface ChatStreamChunk {
  delta: string;
  done: boolean;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface ProviderHealthStatus {
  providerId: string;
  healthy: boolean;
  latencyMs: number;
  message?: string;
  availableModels: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  isConfigured: boolean;
  isLocal: boolean;
  models: ModelInfo[];

  checkHealth: () => Promise<ProviderHealthStatus>;
  supports: (capability: ModelCapability) => boolean;
  chat: (messages: ChatMessage[], options?: ChatCompletionOptions) => Promise<string>;
  stream: (
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ) => AsyncIterable<ChatStreamChunk>;
}
