# MHP System Architecture & Specification

## High-Level Topology

```text
                                 ┌──────────────────────────────────────────────┐
                                 │                USER INTERFACE                │
                                 │       React 18 / Next.js 14 / Tailwind CSS   │
                                 └──────────────────────┬───────────────────────┘
                                                        │ HTTP POST / SSE Stream
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │             SUPER AGENT ENGINE               │
                                 │   - Intent & Capability Detection            │
                                 │   - Task Graph (DAG) Planner                 │
                                 │   - Dynamic Agent Router                     │
                                 │   - Verification & Retry Loop                │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      ▼                                 ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
         │     AGENT REGISTRY      │       │      TOOL REGISTRY      │       │    PROVIDER ADAPTERS    │
         │  - 9 Built-in Domains   │       │  - Zod Input Schemas    │       │  - Local (Ollama)       │
         │  - 50+ Specialist Agents│       │  - Granular Permissions │       │  - Free-tier (Groq, OR) │
         │  - Custom Agent Builder │       │  - Sandbox File Ops     │       │  - External Commercial  │
         │  - Scalable to 1,000+   │       │  - Sandboxed Terminal   │       │  - Smart Engine Fallback│
         └─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

## Core Principles
1. **Capability-Driven Routing**: No brittle regex keyword matches. Agents register their capabilities (`code_generation`, `pdf_parsing`, `seo_audit`), and the task planner matches tasks dynamically.
2. **Directed Acyclic Graphs (DAG)**: Tasks are modeled as graphs of `TaskNode` units with explicit dependencies, permitting both sequential pipelines and parallel branch execution.
3. **Defense in Depth**: Sandboxed filesystem roots prevent directory escape. Destructive shell commands are intercepted by regex filters and blocked before execution.
4. **Resilience & Fallback**: If a primary AI provider (such as a local Ollama server or an external API) fails or times out, the system automatically falls back to compatible secondary providers.