"use client";

import React from "react";
import { X, Download, Copy, ExternalLink, FileText, Code, Check } from "lucide-react";

interface ArtifactViewerProps {
  artifact: {
    id: string;
    name: string;
    type: string;
    content?: string;
    path?: string;
  } | null;
  onClose: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!artifact) return null;

  const handleCopy = () => {
    if (artifact.content) {
      navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!artifact.content) return;
    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-[#0D1322] border border-[#1E2A44] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E2A44] flex items-center justify-between bg-[#111A2E]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0066FF]/20 text-[#00D2FF]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">{artifact.name}</h3>
              <span className="text-xs text-slate-400 uppercase tracking-wider">{artifact.type} Artifact</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A253D] transition text-xs flex items-center gap-1.5"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A253D] transition"
              title="Download artifact"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A253D] transition ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-6 bg-[#080C14]">
          {artifact.type === "html" ? (
            <div className="w-full h-full bg-white rounded-lg overflow-hidden">
              <iframe
                title={artifact.name}
                srcDoc={artifact.content}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {artifact.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
