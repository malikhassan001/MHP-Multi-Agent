"use client";

import React, { useState, useEffect } from "react";
import { Users2, Plus, Search, Check, Shield, Wrench, Sparkles, X } from "lucide-react";
import { AgentDefinition } from "@/lib/agents/types";

export const AgentMarketplace: React.FC = () => {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for custom agent
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDescription, setNewAgentDescription] = useState("");
  const [newAgentInstructions, setNewAgentInstructions] = useState("");
  const [newAgentCategory, setNewAgentCategory] = useState("custom");

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (data.agents) setAgents(data.agents);
      })
      .catch((err) => console.error("Failed to load agents", err));
  }, []);

  const categories = [
    { id: "all", label: "All Agents" },
    { id: "coding", label: "Coding" },
    { id: "chat", label: "Chat & Research" },
    { id: "web", label: "Web" },
    { id: "file", label: "Files" },
    { id: "creative", label: "Creative" },
    { id: "audio", label: "Audio" },
    { id: "video", label: "Video" },
    { id: "business", label: "Business" },
    { id: "utility", label: "Utility" },
  ];

  const filteredAgents = agents.filter((a) => {
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
    const matchesQuery =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentInstructions) return;

    const id = `custom_${Date.now()}`;
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: newAgentName,
        description: newAgentDescription,
        category: newAgentCategory,
        instructions: newAgentInstructions,
        capabilities: ["custom_task"],
        tools: ["filesystem"],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.agent) {
        setAgents((prev) => [...prev, data.agent]);
      }
      setShowCreateModal(false);
      setNewAgentName("");
      setNewAgentDescription("");
      setNewAgentInstructions("");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070A11]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Users2 className="text-[#00D2FF]" />
              Agent Library & Marketplace
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Universal Agent Registry supporting hundreds of specialist agents coordinated by the Super Agent.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-[#0077FF] hover:to-[#0060E6] text-white text-sm font-semibold shadow-[0_0_15px_rgba(0,102,255,0.4)] transition"
          >
            <Plus size={16} />
            <span>Create Custom Agent</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? "bg-[#0066FF] text-white shadow-[0_0_10px_rgba(0,102,255,0.3)]"
                    : "bg-[#0E1526] text-slate-400 hover:text-slate-200 border border-[#1A253D]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-9 pr-3 py-2 bg-[#0D1322] border border-[#1E2A44] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#00D2FF]"
            />
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="p-5 rounded-2xl bg-[#0D1322] border border-[#1E2A44] hover:border-[#00D2FF]/40 shadow-lg flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#141E34] text-[#00D2FF] border border-[#1E2E50]">
                    {agent.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Check size={13} /> Active
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-[#00D2FF] transition mb-1.5">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{agent.description}</p>

                {/* Capabilities list */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-[#10182A] text-slate-300 text-[10px] border border-[#1A253D]"
                    >
                      {cap.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools row */}
              <div className="pt-3 border-t border-[#18233A] flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Wrench size={12} className="text-slate-400" />
                  {agent.tools.length} Tools
                </span>
                <span className="flex items-center gap-1">
                  <Shield size={12} className="text-slate-400" />
                  {agent.permissions?.join(", ") || "Standard"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Custom Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-[#1E2A44] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2A44] mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#00D2FF]" />
                Create Custom Agent
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. YouTube Growth Manager"
                  className="w-full px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:outline-none focus:border-[#0066FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                  placeholder="e.g. Creates scripts, thumbnails, and SEO tags for video creators"
                  className="w-full px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions (System Prompt)</label>
                <textarea
                  value={newAgentInstructions}
                  onChange={(e) => setNewAgentInstructions(e.target.value)}
                  placeholder="Describe exact operational instructions, tone, and rules..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#080C14] border border-[#1E2A44] rounded-xl text-xs text-white focus:outline-none focus:border-[#0066FF] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141E34] text-slate-300 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-[0_0_12px_rgba(0,102,255,0.4)]"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
