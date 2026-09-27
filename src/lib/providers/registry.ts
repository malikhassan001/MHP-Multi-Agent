import { AIProvider, ChatMessage, ChatCompletionOptions, ChatStreamChunk } from "./types";
import { smartAutonomousProvider } from "./adapters/smart-engine";
import { ollamaProvider } from "./adapters/ollama";
import {
  openRouterProvider,
  groqProvider,
  openAIProvider,
  anthropicProvider,
  geminiProvider,
} from "./adapters/cloud-providers";

class ModelProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.register(smartAutonomousProvider);
    this.register(ollamaProvider);
    this.register(openRouterProvider);
    this.register(groqProvider);
    this.register(openAIProvider);
    this.register(anthropicProvider);
    this.register(geminiProvider);
  }

  public register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AIProvider {
    const found = this.providers.get(id);
    if (found) return found;
    return smartAutonomousProvider; // Safe default
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getAvailableProviders(): AIProvider[] {
    return this.getAllProviders().filter((p) => p.isConfigured || p.isLocal);
  }

  public async executeWithFallback(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { preferredProviderId?: string }
  ): Promise<{ response: string; providerUsed: string }> {
    const preferredId = options?.preferredProviderId || "smart-engine";
    const primary = this.getProvider(preferredId);

    try {
      if (primary.isConfigured || primary.isLocal) {
        const res = await primary.chat(messages, options);
        return { response: res, providerUsed: primary.id };
      }
    } catch (err) {
      console.warn(`Primary provider [${primary.id}] failed, trying fallback:`, err);
    }

    // Fallback order: Smart Engine is guaranteed to succeed locally
    const fallback = smartAutonomousProvider;
    const res = await fallback.chat(messages, options);
    return { response: res, providerUsed: fallback.id };
  }

  public async *streamWithFallback(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { preferredProviderId?: string }
  ): AsyncIterable<ChatStreamChunk & { providerUsed: string }> {
    const preferredId = options?.preferredProviderId || "smart-engine";
    const primary = this.getProvider(preferredId);

    try {
      if (primary.isConfigured || primary.isLocal) {
        for await (const chunk of primary.stream(messages, options)) {
          yield { ...chunk, providerUsed: primary.id };
        }
        return;
      }
    } catch (err) {
      console.warn(`Streaming from [${primary.id}] failed, falling back to smart-engine:`, err);
    }

    for await (const chunk of smartAutonomousProvider.stream(messages, options)) {
      yield { ...chunk, providerUsed: smartAutonomousProvider.id };
    }
  }
}

export const providerRegistry = new ModelProviderRegistry();
