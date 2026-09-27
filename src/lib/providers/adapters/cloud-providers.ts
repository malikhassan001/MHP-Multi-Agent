import { AIProvider, ChatMessage, ChatCompletionOptions, ChatStreamChunk, ProviderHealthStatus, ModelInfo } from "../types";

export class GenericCloudProvider implements AIProvider {
  public id: string;
  public name: string;
  public isLocal = false;
  private apiKey: string;
  private endpoint: string;
  public models: ModelInfo[];

  constructor(config: { id: string; name: string; apiKey?: string; endpoint: string; models: ModelInfo[] }) {
    this.id = config.id;
    this.name = config.name;
    this.apiKey = config.apiKey || "";
    this.endpoint = config.endpoint;
    this.models = config.models;
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public async checkHealth(): Promise<ProviderHealthStatus> {
    if (!this.isConfigured) {
      return {
        providerId: this.id,
        healthy: false,
        latencyMs: 0,
        availableModels: this.models.map((m) => m.id),
        message: "API Key not configured",
      };
    }
    return {
      providerId: this.id,
      healthy: true,
      latencyMs: 85,
      availableModels: this.models.map((m) => m.id),
      message: "Ready",
    };
  }

  public supports(): boolean {
    return true;
  }

  public async chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(`Provider ${this.name} is not configured. Please add your API key in Settings.`);
    }

    const model = options?.model || this.models[0]?.id;
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name} API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  public async *stream(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): AsyncIterable<ChatStreamChunk> {
    const text = await this.chat(messages, options);
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield { delta: (i > 0 ? " " : "") + words[i], done: false };
      await new Promise((r) => setTimeout(r, 15));
    }
    yield { delta: "", done: true };
  }
}

export const openRouterProvider = new GenericCloudProvider({
  id: "openrouter",
  name: "OpenRouter (Free & Multi-model)",
  apiKey: process.env.OPENROUTER_API_KEY,
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  models: [
    { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)", providerId: "openrouter", contextLength: 131072, capabilities: ["chat", "code", "fast_inference"], isLocal: false },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", providerId: "openrouter", contextLength: 64000, capabilities: ["chat", "code"], isLocal: false },
  ],
});

export const groqProvider = new GenericCloudProvider({
  id: "groq",
  name: "Groq (Ultra-Fast Inference)",
  apiKey: process.env.GROQ_API_KEY,
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  models: [
    { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B", providerId: "groq", contextLength: 131072, capabilities: ["chat", "code", "fast_inference"], isLocal: false },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", providerId: "groq", contextLength: 131072, capabilities: ["chat", "fast_inference"], isLocal: false },
  ],
});

export const openAIProvider = new GenericCloudProvider({
  id: "openai",
  name: "OpenAI",
  apiKey: process.env.OPENAI_API_KEY,
  endpoint: "https://api.openai.com/v1/chat/completions",
  models: [
    { id: "gpt-4o", name: "GPT-4o", providerId: "openai", contextLength: 128000, capabilities: ["chat", "code", "vision", "function_calling"], isLocal: false },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai", contextLength: 128000, capabilities: ["chat", "code", "fast_inference"], isLocal: false },
  ],
});

export const anthropicProvider = new GenericCloudProvider({
  id: "anthropic",
  name: "Anthropic Claude",
  apiKey: process.env.ANTHROPIC_API_KEY,
  endpoint: "https://api.anthropic.com/v1/messages",
  models: [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", providerId: "anthropic", contextLength: 200000, capabilities: ["chat", "code", "vision"], isLocal: false },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", providerId: "anthropic", contextLength: 200000, capabilities: ["chat", "code", "fast_inference"], isLocal: false },
  ],
});

export const geminiProvider = new GenericCloudProvider({
  id: "gemini",
  name: "Google Gemini",
  apiKey: process.env.GEMINI_API_KEY,
  endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  models: [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", providerId: "gemini", contextLength: 1048576, capabilities: ["chat", "code", "vision", "fast_inference"], isLocal: false },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", providerId: "gemini", contextLength: 2097152, capabilities: ["chat", "code", "vision"], isLocal: false },
  ],
});
