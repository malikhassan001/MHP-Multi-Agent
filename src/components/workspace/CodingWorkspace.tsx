"use client";

import React, { useState, useEffect } from "react";
import {
  Folder,
  FileCode,
  Play,
  Terminal,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Split,
  Layers,
} from "lucide-react";

export const CodingWorkspace: React.FC = () => {
  const [files, setFiles] = useState<{ name: string; content: string }[]>([
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Alex Rivera | AI Software Architect</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="dark-theme">
  <div class="hero">
    <div class="badge">MHP Autonomous Portfolio</div>
    <h1>Building Scalable <span class="gradient">Multi-Agent</span> Systems</h1>
    <p>Senior Full-Stack & Agentic Systems Architect</p>
    <div class="cta-buttons">
      <button class="btn primary">View Projects</button>
      <button class="btn secondary">Contact</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
    },
    {
      name: "styles.css",
      content: `body {
  background: #080C14;
  color: #F8FAFC;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  text-align: center;
}
.hero { max-width: 600px; padding: 2rem; }
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid #00D2FF;
  color: #00D2FF;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}
h1 { font-size: 2.4rem; margin-bottom: 0.75rem; }
.gradient {
  background: linear-gradient(135deg, #00D2FF, #0066FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
p { color: #94A3B8; margin-bottom: 1.5rem; }
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin: 0 0.5rem;
}
.btn.primary { background: #0066FF; color: white; box-shadow: 0 0 15px rgba(0,102,255,0.4); }
.btn.secondary { background: #162035; color: #E2E8F0; border: 1px solid #233355; }`,
    },
    {
      name: "app.js",
      content: `console.log("MHP Coding Workspace loaded.");
document.querySelectorAll(".btn").forEach(b => {
  b.addEventListener("click", () => alert("MHP interactive preview action triggered!"));
});`,
    },
  ]);

  const [activeFileName, setActiveFileName] = useState("index.html");
  const [activeCode, setActiveCode] = useState("");
  const [previewTab, setPreviewTab] = useState<"editor" | "preview" | "diff">("editor");
  const [terminalOutput, setTerminalOutput] = useState<string>("MHP Sandboxed Terminal Initialized.\nReady for test assertions.");
  const [terminalCommand, setTerminalCommand] = useState("");
  const [isRunningTests, setIsRunningTests] = useState(false);

  const activeFile = files.find((f) => f.name === activeFileName) || files[0];

  useEffect(() => {
    if (activeFile) {
      setActiveCode(activeFile.content);
    }
  }, [activeFileName]);

  const handleCodeChange = (newCode: string) => {
    setActiveCode(newCode);
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newCode } : f))
    );
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTerminalOutput((prev) => `${prev}\n> Running verification test suite across 3 files...`);

    setTimeout(() => {
      setIsRunningTests(false);
      setTerminalOutput((prev) => `${prev}\n✓ index.html: HTML5 syntax validated.\n✓ styles.css: CSS layout and tokens verified.\n✓ app.js: Clean syntax, 0 errors.\n● 3/3 Tests Passed.`);
    }, 800);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCommand.trim()) return;

    const cmd = terminalCommand.trim();
    setTerminalCommand("");
    setTerminalOutput((prev) => `${prev}\n$ ${cmd}\n[Sandbox]: Executed in 12ms. Status code: 0`);
  };

  const getCombinedHtml = () => {
    const htmlFile = files.find((f) => f.name === "index.html")?.content || "";
    const cssFile = files.find((f) => f.name === "styles.css")?.content || "";
    const jsFile = files.find((f) => f.name === "app.js")?.content || "";

    return htmlFile
      .replace('<link rel="stylesheet" href="styles.css">', `<style>${cssFile}</style>`)
      .replace('<script src="app.js"></script>', `<script>${jsFile}</script>`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#070A11] overflow-hidden">
      {/* Top action toolbar */}
      <div className="h-11 bg-[#0D1322] border-b border-[#1E2A44] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers size={14} className="text-[#00D2FF]" />
            Project: <strong className="text-white">Portfolio-Website</strong>
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Sync
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-[#141D30] p-0.5 border border-[#1E2A44] text-xs">
            <button
              onClick={() => setPreviewTab("editor")}
              className={`px-3 py-1 rounded-md transition ${
                previewTab === "editor" ? "bg-[#0066FF] text-white font-medium shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Code Editor
            </button>
            <button
              onClick={() => setPreviewTab("preview")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
                previewTab === "preview" ? "bg-[#0066FF] text-white font-medium shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye size={13} />
              Live Preview
            </button>
            <button
              onClick={() => setPreviewTab("diff")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
                previewTab === "diff" ? "bg-[#0066FF] text-white font-medium shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Split size={13} />
              Diff Patches
            </button>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-[0_0_10px_rgba(16,185,129,0.3)] transition"
          >
            <Play size={12} />
            {isRunningTests ? "Running Tests..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Explorer Tree */}
        <div className="w-56 bg-[#0A0E1A] border-r border-[#1E2A44] flex flex-col">
          <div className="p-3 border-b border-[#1A253D] flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Explorer</span>
            <button
              onClick={() => {
                const name = prompt("Enter file name (e.g. README.md):");
                if (name) {
                  setFiles((prev) => [...prev, { name, content: "# " + name }]);
                  setActiveFileName(name);
                }
              }}
              className="hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 px-2 py-1">
              <Folder size={13} className="text-[#00D2FF]" />
              <span>src /</span>
            </div>
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => setActiveFileName(file.name)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                  activeFileName === file.name
                    ? "bg-[#141E34] text-[#00D2FF] font-semibold border-l-2 border-[#00D2FF]"
                    : "text-slate-300 hover:bg-[#111827] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor / Preview / Diff */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0D1322]">
          {/* File Tabs */}
          <div className="h-9 bg-[#0B0F19] border-b border-[#1E2A44] flex items-center px-2 gap-1">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => setActiveFileName(file.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs cursor-pointer select-none transition ${
                  activeFileName === file.name
                    ? "bg-[#0D1322] text-white border-t-2 border-[#0066FF] font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{file.name}</span>
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
            {previewTab === "editor" && (
              <div className="w-full h-full flex">
                {/* Line numbers column */}
                <div className="w-12 bg-[#0A0E1A] text-slate-600 select-none py-4 text-right pr-3 font-mono text-xs border-r border-[#1B253B]">
                  {activeCode.split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Editable code textarea */}
                <textarea
                  value={activeCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="flex-1 bg-transparent p-4 font-mono text-xs text-slate-200 leading-5 focus:outline-none resize-none overflow-auto"
                  spellCheck={false}
                />
              </div>
            )}

            {previewTab === "preview" && (
              <div className="w-full h-full bg-white">
                <iframe
                  title="Live Preview"
                  srcDoc={getCombinedHtml()}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            )}

            {previewTab === "diff" && (
              <div className="p-4 overflow-auto font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2A44]">
                  <div>
                    <span className="font-semibold text-white">AI Patch Proposal for {activeFileName}</span>
                    <div className="text-slate-400 text-[11px]">Review modifications generated by Coding Agent.</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert("All AI patches accepted.")}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => alert("AI patches rejected.")}
                      className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
                    >
                      Reject All
                    </button>
                  </div>
                </div>

                <div className="bg-[#0A0E1A] p-3 rounded-lg border border-[#1E2A44] space-y-1">
                  <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">+ &lt;div class="badge"&gt;Available for Principal Roles&lt;/div&gt;</div>
                  <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">+ &lt;h1&gt;Building Autonomous &lt;span class="text-gradient"&gt;Multi-Agent&lt;/span&gt; Systems&lt;/h1&gt;</div>
                  <div className="text-slate-500 px-2 py-0.5">  &lt;p class="subtitle"&gt;Full-stack software architect specializing in distributed LLM orchestration&lt;/p&gt;</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Terminal & Test Results Panel */}
          <div className="h-44 bg-[#0A0E1A] border-t border-[#1E2A44] flex flex-col">
            <div className="h-8 bg-[#0D1322] border-b border-[#1A253D] px-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-[#00D2FF]" />
                <span className="font-semibold text-slate-300">Sandboxed Terminal</span>
              </div>
              <button onClick={() => setTerminalOutput("")} className="hover:text-white text-[11px]">
                Clear
              </button>
            </div>
            <div className="flex-1 p-3 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {terminalOutput}
            </div>
            <form onSubmit={handleRunCommand} className="p-2 border-t border-[#1A253D] flex items-center gap-2 bg-[#0A0E1A]">
              <span className="text-[#00D2FF] text-xs font-mono pl-1">$</span>
              <input
                type="text"
                value={terminalCommand}
                onChange={(e) => setTerminalCommand(e.target.value)}
                placeholder="npm test, node app.js, ls, etc."
                className="flex-1 bg-transparent text-xs text-slate-200 font-mono focus:outline-none placeholder-slate-600"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
