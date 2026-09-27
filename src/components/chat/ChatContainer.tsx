"use client";

import React from "react";
import { Bot, User, FileCode, CheckCircle, ExternalLink, Sparkles, Layers, ArrowRight } from "lucide-react";
import { TaskProgressCard } from "./TaskProgressCard";
import { TaskGraph } from "@/lib/tasks/types";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  graph?: TaskGraph;
  artifacts?: { id: string; name: string; type: string; content?: string }[];
  timestamp: number;
}

interface ChatContainerProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  activeGraph?: TaskGraph;
  onSelectPrompt: (prompt: string) => void;
  onOpenArtifact: (artifact: any) => void;
  onOpenWorkspace: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  activeGraph,
  onSelectPrompt,
  onOpenArtifact,
  onOpenWorkspace,
}) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center">
        {/* Brand emblem */}
        <div className="relative w-20 h-20 mb-6 rounded-2xl overflow-hidden border border-[#00D2FF]/40 shadow-[0_0_35px_rgba(0,102,255,0.4)]">
          <img src="/mhp_logo.jpg" alt="MHP Emblem" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Welcome, Malik Hassan Phularwan (MHP)
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mb-8">
          Malik Hassan Phularwan (MHP) is your unified AI Super Agent platform. Simply state your objective, and your specialized agents and tools will coordinate to complete it.
        </p>

        {/* Suggestion Prompts matching MVP specifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-3xl w-full text-left">
          <button
            onClick={() => onSelectPrompt("Build me a simple portfolio website with a dark theme.")}
            className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#0066FF] hover:shadow-[0_0_15px_rgba(0,102,255,0.25)] text-left transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00D2FF]">MVP 1 • Coding</span>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-white transition" />
            </div>
            <div className="font-medium text-sm text-slate-200 mb-1">
              "Build me a simple portfolio website with a dark theme."
            </div>
            <div className="text-xs text-slate-500">Coding Agent scaffolds HTML, CSS, JS, runs tests & opens live preview.</div>
          </button>

          <button
            onClick={() => onSelectPrompt("Summarize this PDF and create a clean report.")}
            className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#0066FF] hover:shadow-[0_0_15px_rgba(0,102,255,0.25)] text-left transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00D2FF]">MVP 2 • File Analysis</span>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-white transition" />
            </div>
            <div className="font-medium text-sm text-slate-200 mb-1">
              "Summarize this PDF and create a clean report."
            </div>
            <div className="text-xs text-slate-500">Extracts document structure, synthesizes metrics, and produces markdown report.</div>
          </button>

          <button
            onClick={() => onSelectPrompt("Research this topic, write a 5-minute YouTube script, create a thumbnail concept and give me SEO metadata.")}
            className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#0066FF] hover:shadow-[0_0_15px_rgba(0,102,255,0.25)] text-left transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00D2FF]">MVP 3 • Multi-Agent</span>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-white transition" />
            </div>
            <div className="font-medium text-sm text-slate-200 mb-1">
              "Research, write YouTube script, thumbnail & SEO metadata."
            </div>
            <div className="text-xs text-slate-500">Autonomous DAG across Research, Writing, Creative, and SEO agents.</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00D2FF] p-[1px] flex-shrink-0 shadow-[0_0_10px_rgba(0,102,255,0.4)]">
                  <div className="w-full h-full bg-[#0D1322] rounded-lg flex items-center justify-center">
                    <Sparkles size={16} className="text-[#00D2FF]" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#0052CC] text-white rounded-br-none shadow-[0_4px_16px_rgba(0,82,204,0.3)]"
                    : "bg-[#0D1322] border border-[#1E2A44] text-slate-200 rounded-bl-none shadow-lg"
                }`}
              >
                {/* Active task graph if present on message */}
                {msg.graph && <TaskProgressCard graph={msg.graph} />}

                {/* Message body */}
                <div className="whitespace-pre-wrap font-normal">{msg.content}</div>

                {/* Generated Artifacts Row */}
                {msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1E2A44] flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400 font-medium w-full mb-1 flex items-center gap-1.5">
                      <Layers size={13} className="text-[#00D2FF]" /> Generated Artifacts:
                    </span>
                    {msg.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => onOpenArtifact(art)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141E34] hover:bg-[#1B2947] border border-[#233355] text-xs text-slate-200 transition"
                      >
                        <FileCode size={14} className="text-[#00D2FF]" />
                        <span>{art.name}</span>
                        <ExternalLink size={12} className="text-slate-400" />
                      </button>
                    ))}
                    <button
                      onClick={onOpenWorkspace}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white text-xs font-medium hover:opacity-95 transition ml-auto"
                    >
                      <span>Open in Coding IDE</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#1E2A44] flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {/* Live streaming / active orchestrator graph */}
        {isLoading && activeGraph && <TaskProgressCard graph={activeGraph} />}
      </div>
    </div>
  );
};
