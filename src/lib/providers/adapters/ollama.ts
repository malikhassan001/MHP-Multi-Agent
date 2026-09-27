import { AIProvider, ChatMessage, ChatCompletionOptions, ChatStreamChunk, ProviderHealthStatus, ModelInfo } from "../types";

export class OllamaProvider implements AIProvider {
  public id = "ollama";
  public name = "Ollama (Local Models)";
  public isLocal = true;
  private baseUrl: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  public get isConfigured(): boolean {
    return true; // Local server can always be probed
  }

  public models: ModelInfo[] = [
    {
      id: "llama3",
      name: "Llama 3 (Local)",
      providerId: "ollama",
      contextLength: 8192,
      capabilities: ["chat", "code", "fast_inference"],
      isLocal: true,
    },
    {
      id: "mistral",
      name: "Mistral (Local)",
      providerId: "ollama",
      contextLength: 8192,
      capabilities: ["chat", "code"],
      isLocal: true,
    },
    {
      id: "qwen2.5-coder",
      name: "Qwen 2.5 Coder (Local)",
      providerId: "ollama",
      contextLength: 32768,
      capabilities: ["code", "fast_inference"],
      isLocal: true,
    },
  ];

  public async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        return {
          providerId: this.id,
          healthy: true,
          latencyMs: 15,
          availableModels: models.length > 0 ? models : this.models.map((m) => m.id),
          message: "Ollama instance online",
        };
      }
    } catch {
      // expected if user doesn't have local Ollama daemon currently running
    }
    return {
      providerId: this.id,
      healthy: false,
      latencyMs: 0,
      availableModels: [],
      message: "Ollama not detected on localhost:11434",
    };
  }

  public supports(capability: string): boolean {
    return ["chat", "code", "fast_inference"].includes(capability);
  }

  public async chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options?.model || "llama3",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    const data = await res.json();
    return data.message?.content || "";
  }

  public async *stream(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): AsyncIterable<ChatStreamChunk> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options?.model || "llama3",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });
    if (!res.ok) throw new Error(`Ollama stream error: ${res.statusText}`);
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          yield { delta: json.message?.content || "", done: json.done };
        } catch {}
      }
    }
  }
}

export const ollamaProvider = new OllamaProvider();
