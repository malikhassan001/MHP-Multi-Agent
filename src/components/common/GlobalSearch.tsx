"use client";

import React, { useState, useEffect } from "react";
import { Search, Bot, Code, FileText, ArrowRight, X } from "lucide-react";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionType: string, payload?: any) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction("open_search");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  const quickItems = [
    { type: "prompt", label: "Build a modern portfolio website with dark theme", icon: Code, category: "Coding Task" },
    { type: "prompt", label: "Summarize this PDF and produce an executive report", icon: FileText, category: "Document Analysis" },
    { type: "prompt", label: "Generate YouTube script, thumbnail concept, and SEO tags", icon: Bot, category: "Multi-Agent Workflow" },
    { type: "view", label: "Open Coding Workspace IDE", icon: Code, category: "Navigation", target: "workspace" },
    { type: "view", label: "Browse Specialist Agents Library", icon: Bot, category: "Navigation", target: "agents" },
  ];

  const filtered = quickItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()) ||
    i.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4">
      <div className="bg-[#0D1322] border border-[#1E2A44] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-[#1E2A44] flex items-center gap-3 bg-[#111A2E]">
          <Search size={18} className="text-[#00D2FF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, agents, projects, files..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  onClose();
                  if (item.type === "prompt") onSelectAction("run_prompt", item.label);
                  if (item.type === "view") onSelectAction("navigate", item.target);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#152038] cursor-pointer text-xs text-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#18243E] text-[#00D2FF]">
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-100 group-hover:text-[#00D2FF] transition">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-500 group-hover:text-white" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
