"use client";

import React, { useState } from "react";
import { CheckCircle2, CircleDashed, XCircle, ChevronDown, ChevronUp, Bot, Wrench, Clock } from "lucide-react";
import { TaskGraph } from "@/lib/tasks/types";

interface TaskProgressCardProps {
  graph: TaskGraph;
}

export const TaskProgressCard: React.FC<TaskProgressCardProps> = ({ graph }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!graph || !graph.nodes || graph.nodes.length === 0) return null;

  const completedCount = graph.nodes.filter((n) => n.status === "completed").length;
  const totalCount = graph.nodes.length;
  const isFinished = graph.status === "completed";

  return (
    <div className="my-4 rounded-xl bg-[#0D1322] border border-[#1E2A44] shadow-lg overflow-hidden transition">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-[#111A2E] flex items-center justify-between cursor-pointer select-none hover:bg-[#152038] transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0066FF]/20 text-[#00D2FF]">
            {isFinished ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <CircleDashed size={16} className="animate-spin text-[#00D2FF]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">{graph.title || "Autonomous Multi-Agent Workflow"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A253D] text-[#00D2FF] font-medium border border-[#243354]">
                {completedCount} / {totalCount} Steps
              </span>
            </div>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Accordion content */}
      {isExpanded && (
        <div className="p-3 space-y-2 divide-y divide-[#1A253D]/60">
          {graph.nodes.map((node, index) => {
            const isCompleted = node.status === "completed";
            const isRunning = node.status === "running";
            const isFailed = node.status === "failed";

            return (
              <div key={node.id} className="pt-2 first:pt-0">
                <div className="flex items-start justify-between text-xs py-1">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {isCompleted && <CheckCircle2 size={14} className="text-emerald-400" />}
                      {isRunning && <CircleDashed size={14} className="animate-spin text-[#00D2FF]" />}
                      {isFailed && <XCircle size={14} className="text-rose-400" />}
                      {!isCompleted && !isRunning && !isFailed && (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">
                        {index + 1}. {node.title}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{node.description}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Bot size={11} className="text-[#00D2FF]" />
                          {node.agentId}
                        </span>
                        {node.toolId && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Wrench size={11} className="text-slate-400" />
                            {node.toolId}
                          </span>
                        )}
                        {node.durationMs && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock size={11} />
                            {node.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider ${
                      isCompleted
                        ? "text-emerald-400 bg-emerald-950/40"
                        : isRunning
                        ? "text-[#00D2FF] bg-[#0066FF]/20 animate-pulse"
                        : isFailed
                        ? "text-rose-400 bg-rose-950/40"
                        : "text-slate-500 bg-slate-900"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
