"use client";

import React, { useState, useRef } from "react";
import { Sidebar, NavView } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatContainer, ChatMessageItem } from "@/components/chat/ChatContainer";
import { Composer } from "@/components/chat/Composer";
import { CodingWorkspace } from "@/components/workspace/CodingWorkspace";
import { VideoStudio } from "@/components/video/VideoStudio";
import { AgentMarketplace } from "@/components/agents/AgentMarketplace";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { FolderGit2, Files as FilesIcon, CheckSquare2 } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<NavView>("chat");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Drawers
  const [selectedArtifact, setSelectedArtifact] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSendMessage = async (text: string, agentId: string, attachments: any[] = []) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMsgId = `usr_${Date.now()}`;
    const assistantMsgId = `ast_${Date.now()}`;

    // Add user message and empty assistant placeholder
    const userMessage: ChatMessageItem = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const initialAssistantMessage: ChatMessageItem = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = "";

    try {
      // Build conversation history to send
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: history,
          manualAgentId: agentId,
          provider: selectedProvider,
          model: selectedModel,
          attachments,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.body) throw new Error("No response stream available.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === "token" && typeof event.delta === "string") {
              accumulatedContent += event.delta;

              // Update assistant message live
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            }

            if (event.type === "done") {
              // Extract any code blocks to offer as artifacts
              const detectedArtifacts: any[] = [];
              const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
              let match;
              let count = 1;
              while ((match = codeBlockRegex.exec(accumulatedContent)) !== null) {
                const lang = match[1] || "txt";
                const code = match[2];
                if (code.length > 50) {
                  detectedArtifacts.push({
                    id: `art_${Date.now()}_${count}`,
                    name: `generated_snippet_${count}.${lang === "html" ? "html" : lang === "css" ? "css" : lang === "javascript" || lang === "js" ? "js" : "txt"}`,
                    type: lang === "html" ? "html" : "code",
                    content: code,
                  });
                  count++;
                }
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        artifacts: detectedArtifacts.length > 0 ? detectedArtifacts : undefined,
                      }
                    : msg
                )
              );
            }

            if (event.type === "error") {
              accumulatedContent += `\n\n❌ ${event.message}`;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            }
          } catch (err) {
            console.error("Failed to parse SSE line:", trimmed, err);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        accumulatedContent += "\n\n*[Generation stopped by user]*";
      } else {
        accumulatedContent += `\n\n❌ **Error**: ${err.message || "Failed to communicate with LLM API."}`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: accumulatedContent || "Connection error." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080C14] text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewChat={() => {
          setMessages([]);
          setCurrentView("chat");
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentView={currentView}
          selectedAgent={selectedAgent}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onSelectProvider={(p, m) => {
            setSelectedProvider(p);
            setSelectedModel(m);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* View Switcher */}
        {currentView === "chat" && (
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <ChatContainer
              messages={messages}
              isLoading={isLoading}
              onSelectPrompt={(prompt) => handleSendMessage(prompt, selectedAgent, [])}
              onOpenArtifact={(art) => setSelectedArtifact(art)}
              onOpenWorkspace={() => setCurrentView("workspace")}
            />

            <Composer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStop={handleStop}
              selectedAgent={selectedAgent}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
            />
          </main>
        )}

        {currentView === "workspace" && <CodingWorkspace />}

        {currentView === "video" && <VideoStudio />}

        {currentView === "agents" && <AgentMarketplace />}

        {currentView === "projects" && (
          <div className="flex-1 p-8 overflow-y-auto bg-[#070A11]">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
                <FolderGit2 className="text-[#00D2FF]" />
                Projects & Workspaces
              </h1>
              <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E2A44] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Portfolio & Frontend Workspace</h3>
                  <p className="text-xs text-slate-400 mt-1">Active project containing generated web files, styles, and tests.</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded bg-[#141E34] text-[#00D2FF] text-[10px] border border-[#233355]">branch: main</span>
                    <span className="text-xs text-slate-500">3 files synced</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView("workspace")}
                  className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-xs font-semibold text-white shadow transition"
                >
                  Open in IDE
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "files" && (
          <div className="flex-1 p-8 overflow-y-auto bg-[#070A11]">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
                <FilesIcon className="text-[#00D2FF]" />
                Files & Artifacts
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setSelectedArtifact({
                      id: "f_1",
                      name: "index.html",
                      type: "html",
                      content: "<h1>Alex Rivera Portfolio</h1>",
                    })
                  }
                  className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#00D2FF] cursor-pointer transition"
                >
                  <div className="text-sm font-semibold text-white">index.html</div>
                  <div className="text-xs text-slate-400 mt-1">Generated portfolio markup</div>
                </div>
                <div
                  onClick={() =>
                    setSelectedArtifact({
                      id: "f_2",
                      name: "executive_report.md",
                      type: "report",
                      content: "# Comprehensive System Report\n\nGenerated by MHP Super Agent.",
                    })
                  }
                  className="p-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#00D2FF] cursor-pointer transition"
                >
                  <div className="text-sm font-semibold text-white">executive_report.md</div>
                  <div className="text-xs text-slate-400 mt-1">Synthesized executive analysis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "tasks" && (
          <div className="flex-1 p-8 overflow-y-auto bg-[#070A11]">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold flex items-center gap-2.5 text-white">
                <CheckSquare2 className="text-[#00D2FF]" />
                Task Monitor & Queue
              </h1>
              <div className="p-6 rounded-2xl bg-[#0D1322] border border-[#1E2A44] text-center text-slate-400 text-sm">
                All background execution queues are nominal. Real LLM streaming active.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Artifact Modal */}
      <ArtifactViewer artifact={selectedArtifact} onClose={() => setSelectedArtifact(null)} />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAction={(type, payload) => {
          if (type === "run_prompt") {
            setCurrentView("chat");
            handleSendMessage(payload, selectedAgent, []);
          }
          if (type === "navigate") {
            setCurrentView(payload);
          }
        }}
      />
    </div>
  );
}