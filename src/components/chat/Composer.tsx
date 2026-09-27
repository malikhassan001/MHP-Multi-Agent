"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  X,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

interface ComposerProps {
  onSendMessage: (text: string, agentId: string, attachments: any[]) => void;
  isLoading: boolean;
  onStop: () => void;
  selectedAgent: string;
  onSelectAgent: (agentId: string) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  selectedAgent,
  onSelectAgent,
}) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<{ id: string; name: string; type: string; content?: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Web Speech API if supported in browser
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser environment.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, selectedAgent, attachments);
    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `att_${Date.now()}_${Math.random()}`,
            name: file.name,
            type: file.type || "text/plain",
            content,
          },
        ]);
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pb-6 pt-2">
      <div className="relative rounded-2xl bg-[#0D1322] border border-[#1E2A44] focus-within:border-[#0066FF] shadow-2xl transition duration-200">
        {/* Attachments preview row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 border-b border-[#1A253D]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141E34] border border-[#233355] text-xs text-slate-200"
              >
                <FileText size={14} className="text-[#00D2FF]" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask MHP anything... e.g. 'Build me a simple portfolio website with a dark theme.'"
          className="w-full px-4 py-3.5 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none min-h-[56px] max-h-[200px]"
          rows={1}
        />

        {/* Controls row */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#18233A] bg-[#0A0E1A]/40 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151F33] transition"
              title="Attach files (PDF, code, images, CSV)"
            >
              <Paperclip size={17} />
            </button>

            {/* Voice microphone button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-lg transition ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#151F33]"
              }`}
              title={isRecording ? "Stop listening" : "Voice input"}
            >
              {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Agent Mode Selector */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#1E2A44]">
              <Sparkles size={14} className="text-[#00D2FF]" />
              <select
                value={selectedAgent}
                onChange={(e) => onSelectAgent(e.target.value)}
                className="bg-[#121A2D] text-xs font-medium text-slate-200 border border-[#1E2A44] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00D2FF] cursor-pointer"
              >
                <option value="auto">AUTO Orchestrator</option>
                <option value="coding-agent">Coding Agent</option>
                <option value="research-agent">Research Agent</option>
                <option value="writing-agent">Writing Agent</option>
                <option value="pdf-agent">PDF Agent</option>
                <option value="general-chat">General Chat</option>
              </select>
            </div>
          </div>

          {/* Send / Stop button */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition"
              >
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() && attachments.length === 0}
                className={`p-2 rounded-xl transition ${
                  text.trim() || attachments.length > 0
                    ? "bg-gradient-to-r from-[#0066FF] to-[#00D2FF] text-white shadow-[0_0_12px_rgba(0,102,255,0.5)] cursor-pointer"
                    : "bg-[#162035] text-slate-600 cursor-not-allowed"
                }`}
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
