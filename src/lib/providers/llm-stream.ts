import { getApiKey } from "./keys";

export interface StreamLLMOptions {
  provider: "gemini" | "openai" | "anthropic" | "groq" | "openrouter" | "ollama" | string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  overrideApiKey?: string;
}

export interface StreamMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function* streamRealLLM(
  messages: StreamMessage[],
  options: StreamLLMOptions
): AsyncIterable<string> {
  const provider = options.provider || "gemini";
  const apiKey = options.overrideApiKey || getApiKey(provider);

  // Default models per provider
  const defaultModels: Record<string, string> = {
    gemini: "gemini-3.6-flash",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet-20241022",
    groq: "llama-3.3-70b-versatile",
    openrouter: "meta-llama/llama-3.3-70b-instruct:free",
    ollama: "llama3",
  };

  const model = options.model || defaultModels[provider] || "gemini-3.6-flash";

  // Check key requirement
  if (provider !== "ollama" && (!apiKey || apiKey.length < 5)) {
    yield `⚠️ **API Key Required for ${provider.toUpperCase()}**\n\nTo stream real AI responses with **${model}**, please enter your API key in **Settings** (or add \`${provider.toUpperCase()}_API_KEY\` to your \`.env\` file).\n\n*Supported providers: Google Gemini, OpenAI, Anthropic, Groq, OpenRouter, and local Ollama.*`;
    return;
  }

  // Prepend system prompt if provided
  const formattedMessages: StreamMessage[] = [];
  const defaultSystemPrompt = `You are MHP, a unified AI Super Agent platform. The user's name is Malik Hassan Phularwan (MHP), and the project is named Malik Hassan Phularwan (MHP) (or MHP). Always refer to the user and the project as Malik Hassan Phularwan (MHP) or MHP. Never use any old, generic, or default names.`;

  if (options.systemPrompt) {
    formattedMessages.push({ role: "system", content: options.systemPrompt });
  } else {
    formattedMessages.push({ role: "system", content: defaultSystemPrompt });
  }
  formattedMessages.push(...messages);

  // 1. Google Gemini Provider
  if (provider === "gemini") {
    yield* streamGemini(formattedMessages, model, apiKey, options);
    return;
  }

  // 2. Anthropic Provider
  if (provider === "anthropic") {
    yield* streamAnthropic(formattedMessages, model, apiKey, options);
    return;
  }

  // 3. Local Ollama Provider
  if (provider === "ollama") {
    yield* streamOllama(formattedMessages, model, options);
    return;
  }

  // 4. OpenAI-Compatible Providers (OpenAI, Groq, OpenRouter)
  let endpoint = "https://api.openai.com/v1/chat/completions";
  if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
  if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";

  yield* streamOpenAICompatible(endpoint, formattedMessages, model, apiKey, options);
}

// Handler for OpenAI-Compatible Endpoints
async function* streamOpenAICompatible(
  endpoint: string,
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  options: StreamLLMOptions
): AsyncIterable<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (endpoint.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://mhp.local";
    headers["X-Title"] = "MHP Super Agent";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    yield `\n\n❌ **Provider Error (${res.status})**: ${errorText}`;
    return;
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === "[DONE]") return;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Skip malformed chunk
      }
    }
  }
}

// Handler for Google Gemini
async function* streamGemini(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  options: StreamLLMOptions
): AsyncIterable<string> {
  // First attempt: Gemini OpenAI-compatible endpoint
  const openaiEndpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  try {
    const res = await fetch(openaiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") return;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {}
        }
      }
      return;
    }
  } catch (err) {
    console.warn("Gemini OpenAI endpoint error, trying native REST:", err);
  }

  // Fallback: Gemini native streamGenerateContent endpoint
  const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Format messages into Gemini contents array
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMessage = messages.find((m) => m.role === "system");
  const requestBody: any = { contents };
  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  const res = await fetch(nativeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    yield `\n\n❌ **Gemini Error (${res.status})**: ${errorText}`;
    return;
  }

  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);

      try {
        const parsed = JSON.parse(dataStr);
        const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textChunk) yield textChunk;
      } catch {}
    }
  }
}

// Handler for Anthropic Claude
async function* streamAnthropic(
  messages: StreamMessage[],
  model: string,
  apiKey: string,
  options: StreamLLMOptions
): AsyncIterable<string> {
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const userAssistantMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: userAssistantMessages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    yield `\n\n❌ **Anthropic Error (${res.status})**: ${errorText}`;
    return;
  }

  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          yield parsed.delta.text;
        }
      } catch {}
    }
  }
}

// Handler for Local Ollama
async function* streamOllama(
  messages: StreamMessage[],
  model: string,
  options: StreamLLMOptions
): AsyncIterable<string> {
  const baseUrl = getApiKey("ollama") || "http://localhost:11434";

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      yield `\n\n❌ **Ollama Error (${res.status})**: ${errorText}`;
      return;
    }

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const delta = parsed.message?.content;
          if (delta) yield delta;
        } catch {}
      }
    }
  } catch (err: any) {
    yield `\n\n❌ **Cannot connect to Ollama**: Make sure Ollama is running at ${baseUrl}. (${err.message})`;
  }
}