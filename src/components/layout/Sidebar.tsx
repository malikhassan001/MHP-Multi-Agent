"use client";

import React from "react";
import Image from "next/image";
import {
  MessageSquarePlus,
  Search,
  Code2,
  FolderGit2,
  Users2,
  CheckSquare2,
  Files,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
} from "lucide-react";

export type NavView =
  | "chat"
  | "workspace"
  | "video"
  | "agents"
  | "projects"
  | "files"
  | "tasks";

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenSearch,
  onOpenSettings,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: "chat", label: "Chats", icon: MessageSquarePlus, action: () => onSelectView("chat") },
    { id: "workspace", label: "Coding IDE", icon: Code2, action: () => onSelectView("workspace") },
    { id: "video", label: "Video Studio", icon: Clapperboard, action: () => onSelectView("video") },
    { id: "agents", label: "Agents Library", icon: Users2, action: () => onSelectView("agents") },
    { id: "projects", label: "Projects", icon: FolderGit2, action: () => onSelectView("projects") },
    { id: "tasks", label: "Task Monitor", icon: CheckSquare2, action: () => onSelectView("tasks") },
    { id: "files", label: "Files & Artifacts", icon: Files, action: () => onSelectView("files") },
  ];

  return (
    <aside
      className={`relative h-screen bg-[#0A0E1A] border-r border-[#1B253B] flex flex-col transition-all duration-300 z-30 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1B253B] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectView("chat")}>
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#00D2FF]/40 shadow-[0_0_12px_rgba(0,102,255,0.4)]">
            <img src="/mhp_logo.jpg" alt="MHP Logo" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-white via-[#E2E8F0] to-[#00D2FF] bg-clip-text text-transparent">
                MHP
              </span>
              <span className="text-[10px] text-[#00D2FF] font-medium tracking-tight truncate">Malik Hassan Phularwan</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#151F33] transition"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-[#0077FF] hover:to-[#0060E6] text-white font-medium text-sm shadow-[0_0_15px_rgba(0,102,255,0.35)] transition"
        >
          <Sparkles size={16} className="text-[#00D2FF] flex-shrink-0" />
          {!isCollapsed && <span>New Session</span>}
        </button>

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#111827] hover:bg-[#192338] text-slate-400 hover:text-slate-200 text-sm border border-[#1E2A44] transition"
        >
          <Search size={16} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="flex-1 text-left flex justify-between items-center">
              <span>Search</span>
              <kbd className="text-[10px] bg-[#1E2A44] px-1.5 py-0.5 rounded text-slate-400">Ctrl K</kbd>
            </span>
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-[#151F35] text-[#00D2FF] font-semibold border-l-2 border-[#00D2FF]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#121A2D]"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Badge & Footer Settings */}
      <div className="p-3 border-t border-[#1B253B] space-y-1">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#111827]/80 border border-[#1E2A44]/80 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00D2FF] flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0">
              MHP
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-200 truncate">Malik Hassan Phularwan</span>
              <span className="text-[10px] text-slate-400 truncate">MHP Workspace Admin</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-2" title="Malik Hassan Phularwan (MHP)">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00D2FF] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              MHP
            </div>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151F33] text-sm transition"
          title="Settings"
        >
          <Settings size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
};
