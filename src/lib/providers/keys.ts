import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

// In-memory key store initialized from environment
const runtimeKeys: Record<string, string> = {
  gemini: process.env.GEMINI_API_KEY || "",
  openai: process.env.OPENAI_API_KEY || "",
  anthropic: process.env.ANTHROPIC_API_KEY || "",
  groq: process.env.GROQ_API_KEY || "",
  openrouter: process.env.OPENROUTER_API_KEY || "",
  ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
};

// Also read from .env if present
function loadKeysFromEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;
  try {
    const raw = fs.readFileSync(ENV_PATH, "utf-8");
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valParts] = trimmed.split("=");
      const val = valParts.join("=").replace(/^["']|["']$/g, "").trim();
      if (!key) continue;

      if (key === "GEMINI_API_KEY" && val) runtimeKeys.gemini = val;
      if (key === "OPENAI_API_KEY" && val) runtimeKeys.openai = val;
      if (key === "ANTHROPIC_API_KEY" && val) runtimeKeys.anthropic = val;
      if (key === "GROQ_API_KEY" && val) runtimeKeys.groq = val;
      if (key === "OPENROUTER_API_KEY" && val) runtimeKeys.openrouter = val;
      if (key === "OLLAMA_BASE_URL" && val) runtimeKeys.ollama = val;
    }
  } catch (err) {
    console.error("Failed to load .env keys:", err);
  }
}

loadKeysFromEnvFile();

export function getApiKey(providerId: string): string {
  loadKeysFromEnvFile();
  return runtimeKeys[providerId] || "";
}

export function setApiKey(providerId: string, value: string): void {
  runtimeKeys[providerId] = value;
  const envVarMap: Record<string, string> = {
    gemini: "GEMINI_API_KEY",
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    ollama: "OLLAMA_BASE_URL",
  };

  const varName = envVarMap[providerId];
  if (!varName) return;

  process.env[varName] = value;

  // Persist to .env file
  try {
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
    const regex = new RegExp(`^${varName}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${varName}="${value}"`);
    } else {
      envContent += `\n${varName}="${value}"`;
    }
    fs.writeFileSync(ENV_PATH, envContent.trim() + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to persist key to .env:", err);
  }
}

export function getAllConfiguredKeysStatus(): Record<string, { configured: boolean; preview: string }> {
  loadKeysFromEnvFile();
  const res: Record<string, { configured: boolean; preview: string }> = {};
  for (const [provider, key] of Object.entries(runtimeKeys)) {
    if (provider === "ollama") {
      res[provider] = { configured: true, preview: key };
    } else {
      const isConfigured = Boolean(key && key.length > 5);
      res[provider] = {
        configured: isConfigured,
        preview: isConfigured ? `${key.slice(0, 4)}...${key.slice(-3)}` : "",
      };
    }
  }
  return res;
}