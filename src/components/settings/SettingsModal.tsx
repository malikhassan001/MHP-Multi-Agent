"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  Database,
  Volume2,
  Palette,
  Shield,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"providers" | "memory" | "voice" | "security" | "appearance">("providers");

  // Local state for keys
  const [keys, setKeys] = useState({
    gemini: "",
    openai: "",
    anthropic: "",
    groq: "",
    openrouter: "",
    ollama: "http://localhost:11434",
  });

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current configured status on open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/providers/keys")
        .then((res) => res.json())
        .then((data) => {
          if (data.keys) {
            setKeys((prev) => ({
              ...prev,
              gemini: data.keys.gemini?.configured ? "••••••••••••••••••••" : "",
              openai: data.keys.openai?.configured ? "••••••••••••••••••••" : "",
              anthropic: data.keys.anthropic?.configured ? "••••••••••••••••••••" : "",
              groq: data.keys.groq?.configured ? "••••••••••••••••••••" : "",
              openrouter: data.keys.openrouter?.configured ? "••••••••••••••••••••" : "",
              ollama: data.keys.ollama?.preview || "http://localhost:11434",
            }));
          }
        })
        .catch((err) => console.error("Failed to load keys:", err));
    }
  }, [isOpen]);

  // Sample memories list
  const [memories, setMemories] = useState([
    { id: "mem_1", key: "preferred_stack", value: "TypeScript, React, Next.js, Tailwind CSS" },
    { id: "mem_2", key: "theme_preference", value: "Obsidian dark mode with neon cobalt accents" },
    { id: "mem_3", key: "project_goal", value: "Build scalable autonomous agent workspace" },
  ]);

  if (!isOpen) return null;

  const handleSaveKey = async (provider: string, keyVal: string) => {
    // If it's the placeholder mask, don't overwrite
    if (keyVal.startsWith("••••")) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/providers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keyVal }),
      });
      if (res.ok) {
        setSavedStatus((prev) => ({ ...prev, [provider]: true }));
        setTimeout(() => {
          setSavedStatus((prev) => ({ ...prev, [provider]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error("Save key error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const promises = Object.entries(keys).map(([prov, val]) => {
      if (val && !val.startsWith("••••")) {
        return fetch("/api/providers/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: prov, key: val }),
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    setIsSaving(false);
    setSavedStatus({ all: true });
    setTimeout(() => setSavedStatus({}), 2000);
  };

  const tabs = [
    { id: "providers", label: "AI Providers & Keys", icon: Key },
    { id: "memory", label: "Agent Memory", icon: Database },
    { id: "voice", label: "Voice & Speech", icon: Volume2 },
    { id: "security", label: "Security & Sandbox", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1322] border border-[#1E2A44] rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2A44] flex items-center justify-between bg-[#111A2E]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span>MHP Settings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure real LLM backends, API keys, and workspace controls.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Settings Tabs Sidebar */}
          <div className="w-56 bg-[#0A0E1A] border-r border-[#1E2A44] p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-[#141E34] text-[#00D2FF] font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-[#111827]"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#080C14]">
            {activeTab === "providers" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Live AI Provider Configuration</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect real LLM APIs to stream live AI responses directly in the chat interface. Keys are saved securely to your local server.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Gemini API Key */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Google Gemini API Key</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#0066FF]/20 text-[#00D2FF] text-[10px] font-semibold">Recommended</span>
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00D2FF] hover:underline flex items-center gap-1"
                      >
                        Get Free Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys.gemini}
                        onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                        placeholder="AIzaSy..."
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("gemini", keys.gemini)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.gemini ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* OpenAI API Key */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white">OpenAI API Key (GPT-4o, GPT-4o-mini)</label>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00D2FF] hover:underline flex items-center gap-1"
                      >
                        Get Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys.openai}
                        onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                        placeholder="sk-proj-..."
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("openai", keys.openai)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.openai ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Anthropic API Key */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white">Anthropic API Key (Claude 3.5 Sonnet)</label>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00D2FF] hover:underline flex items-center gap-1"
                      >
                        Get Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys.anthropic}
                        onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                        placeholder="sk-ant-..."
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("anthropic", keys.anthropic)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.anthropic ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Groq API Key */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white">Groq API Key (Ultra-Fast Llama 3.3)</label>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00D2FF] hover:underline flex items-center gap-1"
                      >
                        Get Free Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys.groq}
                        onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                        placeholder="gsk_..."
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("groq", keys.groq)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.groq ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* OpenRouter API Key */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white">OpenRouter API Key (Free & Open Weights)</label>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#00D2FF] hover:underline flex items-center gap-1"
                      >
                        Get Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={keys.openrouter}
                        onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
                        placeholder="sk-or-..."
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("openrouter", keys.openrouter)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.openrouter ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Local Ollama */}
                  <div className="p-3.5 rounded-xl bg-[#0D1322] border border-[#1E2A44]">
                    <label className="block text-xs font-bold text-white mb-1.5">Local Ollama Base URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keys.ollama}
                        onChange={(e) => setKeys({ ...keys, ollama: e.target.value })}
                        placeholder="http://localhost:11434"
                        className="flex-1 px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:border-[#00D2FF] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveKey("ollama", keys.ollama)}
                        className="px-3 py-2 rounded-xl bg-[#17233B] hover:bg-[#1E2E4E] border border-[#243557] text-[#00D2FF] text-xs font-semibold"
                      >
                        {savedStatus.ollama ? "Saved!" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-[#0077FF] hover:to-[#0060E6] text-white text-xs font-bold shadow-[0_0_15px_rgba(0,102,255,0.4)] transition"
                  >
                    {savedStatus.all ? <Check size={14} className="text-emerald-400" /> : null}
                    <span>{savedStatus.all ? "All Keys Saved Successfully!" : "Save All Configured Keys"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "memory" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Agent Memory Management</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    View, edit, and purge persistent facts known to the Super Agent.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#0D1322] border border-[#1E2A44] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#00D2FF] font-mono">{m.key}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{m.value}</div>
                      </div>
                      <button
                        onClick={() => setMemories((prev) => prev.filter((item) => item.id !== m.id))}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Delete memory item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Voice & Speech Interface</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure microphone recognition and text-to-speech feedback.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200">Speech Recognition Engine</span>
                    <span className="text-xs text-emerald-400 font-semibold">Web Speech API (Ready)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200">Text-to-Speech Output</span>
                    <span className="text-xs text-slate-400">Natural Neural Voice</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Security & Sandbox Execution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Safety controls and permission boundaries for autonomous agents.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Shield size={16} /> Filesystem Traversal Guards Enabled
                  </div>
                  <p className="text-slate-400">All file modifications are restricted to the project workspace boundary.</p>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-2">
                    <Check size={16} /> Destructive Command Interceptor Active
                  </div>
                  <p className="text-slate-400">Prohibits host-level disk deletion, formatting, and runaway processes.</p>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Visual Appearance & Themes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select your preferred visual aesthetic for MHP.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button className="p-3 rounded-xl bg-[#080C14] border-2 border-[#0066FF] text-left">
                    <div className="font-semibold text-xs text-white">Obsidian Dark</div>
                    <div className="text-[10px] text-[#00D2FF]">Electric Cobalt (Default)</div>
                  </button>
                  <button className="p-3 rounded-xl bg-[#151D30] border border-[#1E2A44] text-left opacity-75 hover:opacity-100">
                    <div className="font-semibold text-xs text-white">Midnight Blue</div>
                    <div className="text-[10px] text-slate-400">Deep Slate</div>
                  </button>
                  <button className="p-3 rounded-xl bg-[#1E293B] border border-[#1E2A44] text-left opacity-75 hover:opacity-100">
                    <div className="font-semibold text-xs text-white">System Auto</div>
                    <div className="text-[10px] text-slate-400">OS Sync</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};