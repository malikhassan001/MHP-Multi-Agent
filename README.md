# MHP — Unified AI Super Agent Platform

![MHP Logo](/public/mhp_logo.jpg)

**MHP** is a unified, extensible multi-agent AI workspace and coding platform inspired by the usability of ChatGPT and the developer workflow of Claude Code, powered by its own unique branding and visual identity.

MHP allows users to communicate with a central **Super Agent** in natural language. The platform automatically determines user intent, creates a structured task execution graph, selects specialized agents and tools, coordinates model providers, executes and verifies intermediate results, manages project files in a sandboxed coding workspace, and renders live streaming responses and rich artifacts.

---

## 🌟 Core Architecture

```
USER
  ↓
MHP UI (React / Next.js / Tailwind / Monaco)
  ↓
SUPER AGENT / ORCHESTRATOR
  ↓
TASK PLANNER & DAG GRAPH
  ↓
AGENT ROUTER
  ↓
SPECIALIZED AGENTS (Chat, Coding, Web, File, Creative, Audio, Video, Business, Utility)
  ↓
TOOL REGISTRY (Filesystem, Terminal, Code Runner, Web Browser, Media, Document Parser)
  ↓
MODEL PROVIDER ADAPTERS (Ollama Local, OpenRouter, Groq, OpenAI, Anthropic, Gemini, Smart Engine)
  ↓
VERIFICATION / TESTING SANDBOX
  ↓
FINAL RESULT & ARTIFACTS
```

---

## 🚀 Key Features

1. **Super Agent Orchestrator**: Understands natural language, files, code, and images; formulates multi-step DAG task plans; routes to specialist agents; manages retries and fallback.
2. **Universal Agent Registry**: Standard `AgentDefinition` model scaling to 1,000+ agents without rewriting application code. Includes initial catalogs across 9 domains and custom agent creation.
3. **Universal Tool Registry**: Strict Zod schemas, granular permissions (`READ`, `WRITE`, `EXECUTE`, `FILES`, `NETWORK`, `BROWSER`), confirmation dialogs for high-risk commands.
4. **Claude Code-Inspired Coding Workspace**: Multi-panel IDE with sandboxed file tree, code editor with syntax highlighting, live web app preview, AI-generated patch diffs (`Accept All` / `Reject All`), and sandboxed terminal runner.
5. **ChatGPT-Style Chat Experience**: Real-time SSE streaming, voice microphone input (Web Speech API), drag-and-drop attachments, expandable step-by-step task progress visualizer, and artifact cards.
6. **Model Provider Abstraction**: Free-first strategy with local Ollama (`http://localhost:11434`), OpenRouter, Groq, OpenAI, Anthropic, Google Gemini, and built-in Smart Autonomous Engine.
7. **Memory & Project Store**: 3 memory tiers (Conversation, Project, User) with full inspection, editing, and deletion controls.

---

## 🛠️ Quick Start

### 1. Launch Development Server
```bash
# Uses portable node & npm installed in tools/node
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Test Suites
```bash
npm test
```

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Built-in MVP Verification Workflows

1. **MVP 1 (Coding & Live Preview)**:
   > *"Build me a simple portfolio website with a dark theme."*
   - Super Agent creates a 3-step DAG.
   - Coding Agent generates `index.html`, `styles.css`, and `app.js`.
   - Testing Agent verifies syntax and responsiveness.
   - Files appear in the Coding Workspace with instant live preview.

2. **MVP 2 (Document Analysis & Report)**:
   > *"Summarize this PDF and create a clean report."*
   - PDF & File Agents extract structure and tabular metrics.
   - Summarization Agent condenses insights.
   - Writing Agent compiles an executive markdown report artifact.

3. **MVP 3 (Multi-Agent Workflow)**:
   > *"Research this topic, write a 5-minute YouTube script, create a thumbnail concept and give me SEO metadata."*
   - Autonomous DAG runs across Research Agent, Script Agent, Creative Agent, SEO Agent, and Final Review.
   - Live progress card visualizes every step in real-time.
