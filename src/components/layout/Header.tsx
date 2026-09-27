"use client";

import React from "react";
import { Cpu, ShieldCheck, Sparkles, Sliders } from "lucide-react";

interface HeaderProps {
  currentView: string;
  selectedAgent: string;
  selectedProvider: string;
  selectedModel: string;
  onSelectProvider: (provider: string, model: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  selectedAgent,
  selectedProvider,
  selectedModel,
  onSelectProvider,
  onOpenSettings,
}) => {
  const modelOptions = [
    { provider: "gemini", model: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
    { provider: "gemini", model: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { provider: "openai", model: "gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
    { provider: "openai", model: "gpt-4o", label: "OpenAI GPT-4o" },
    { provider: "anthropic", model: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { provider: "groq", model: "llama-3.3-70b-versatile", label: "Groq Llama 3.3 70B" },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "OpenRouter (Free)" },
    { provider: "ollama", model: "llama3", label: "Ollama (Local)" },
  ];

  return (
    <header className="h-14 bg-[#0A0E1A]/90 backdrop-blur-md border-b border-[#1B253B] px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400 font-medium">Malik Hassan Phularwan (MHP)</span>
        <span className="text-slate-700">/</span>
        <span className="text-slate-200 capitalize font-semibold">{currentView}</span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* Real LLM Provider / Model Selector */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#121A2D] border border-[#1E2A44]">
          <Sparkles size={13} className="text-[#00D2FF]" />
          <span className="text-slate-400 font-medium">Model:</span>
          <select
            value={`${selectedProvider}:${selectedModel}`}
            onChange={(e) => {
              const [p, m] = e.target.value.split(":");
              onSelectProvider(p, m);
            }}
            className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            {modelOptions.map((opt) => (
              <option key={`${opt.provider}:${opt.model}`} value={`${opt.provider}:${opt.model}`} className="bg-[#0D1322] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agent mode badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#121A2D] border border-[#1E2A44] text-slate-300">
          <Cpu size={14} className="text-[#00D2FF]" />
          <span>Agent: <strong className="text-white capitalize">{selectedAgent}</strong></span>
        </div>

        {/* Configure keys button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] transition font-medium"
          title="Configure API Keys in Settings"
        >
          <Sliders size={13} />
          <span>API Keys</span>
        </button>

        {/* Sandbox permission security badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0E1E1C] border border-[#00FFB2]/30 text-[#00FFB2]">
          <ShieldCheck size={13} />
          <span>Secure</span>
        </div>
      </div>
    </header>
  );
};