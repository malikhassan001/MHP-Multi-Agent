import { env } from "@/lib/config/env";
import {
  AnyProvider,
  ImageProvider,
  LLMProvider,
  MusicProvider,
  ProviderHealth,
  ProviderMeta,
  StockProvider,
  StorageProvider,
  SubtitleProvider,
  TTSProvider,
  VideoProvider,
} from "./types";
import {
  LocalStorageProvider,
  MockImageProvider,
  MockLLMProvider,
  MockMusicProvider,
  MockStockProvider,
  MockTTSProvider,
  MockVideoProvider,
  SrtSubtitleProvider,
} from "./adapters/mock";

class VideoProviderRegistry {
  private providers: Map<string, AnyProvider> = new Map();

  constructor() {
    this.register(new MockLLMProvider());
    this.register(new MockTTSProvider());
    this.register(new MockImageProvider());
    this.register(new MockVideoProvider());
    this.register(new MockMusicProvider());
    this.register(new MockStockProvider());
    this.register(new LocalStorageProvider());
    this.register(new SrtSubtitleProvider());
  }

  public register(provider: AnyProvider): void {
    this.providers.set(provider.id, provider);
  }

  public get<T extends AnyProvider>(id: string): T | undefined {
    return this.providers.get(id) as T | undefined;
  }

  public all(): AnyProvider[] {
    return Array.from(this.providers.values());
  }

  public meta(): ProviderMeta[] {
    return this.all().map((p) => ({
      id: p.id,
      kind: p.kind,
      label: p.label,
      requiresKey: p.requiresKey,
      local: p.local,
      capabilities: p.capabilities,
    }));
  }

  public byKind<K extends AnyProvider["kind"]>(kind: K): Extract<AnyProvider, { kind: K }>[] {
    return this.all().filter((p) => p.kind === kind) as Extract<AnyProvider, { kind: K }>[];
  }

  public pick<K extends AnyProvider["kind"]>(kind: K): Extract<AnyProvider, { kind: K }> {
    const configured = this.byKind(kind).filter((p) => p.isConfigured());
    if (configured.length > 0) return configured[0];
    const fallback = this.byKind(kind)[0];
    if (!fallback) throw new Error(`No provider registered for kind: ${kind}`);
    return fallback;
  }

  public llm(): LLMProvider {
    return this.pick("llm");
  }
  public tts(): TTSProvider {
    return this.pick("tts");
  }
  public image(): ImageProvider {
    return this.pick("image");
  }
  public video(): VideoProvider {
    return this.pick("video");
  }
  public music(): MusicProvider {
    return this.pick("music");
  }
  public stock(): StockProvider {
    return this.pick("stock");
  }
  public storage(): StorageProvider {
    return this.pick("storage");
  }
  public subtitles(): SubtitleProvider {
    return this.pick("subtitle");
  }

  public async health(): Promise<ProviderHealth[]> {
    return Promise.all(this.all().map((p) => p.checkHealth()));
  }
}

export const videoProviders = new VideoProviderRegistry();
export const videoEngine = {
  mockMode: env.mockAI,
  providers: videoProviders,
};