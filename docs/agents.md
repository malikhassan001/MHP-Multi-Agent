# Universal Agent Framework & Registry

## Overview
MHP uses a capability-oriented agent abstraction. Rather than hard-coding agents, each specialist implements `AgentDefinition` and registers with `agentRegistry`.

## Specification

```typescript
interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  instructions: string;
  capabilities: string[];
  tools: string[];
  supportedInputs: ("text" | "file" | "image" | "audio" | "code")[];
  supportedOutputs: ("text" | "code" | "artifact" | "image" | "audio" | "file")[];
  preferredModels?: string[];
  permissions?: string[];
  enabled: boolean;
  isCustom?: boolean;
}
```

## Initial Agent Domains
1. **Chat & Knowledge**: General Chat, Writing, Research, Summarization, Translation, Explanation, Study, Brainstorming.
2. **Coding**: Coding Agent, Debugging, Refactoring, Code Review, Python, JavaScript, TypeScript, React, Next.js, Testing, Git.
3. **Web**: Web Research, Browser Agent, Website Analyzer.
4. **File**: PDF Agent, Spreadsheet/CSV Agent, JSON Transform, File Organizer.
5. **Creative**: Image Prompt, Thumbnail Design, Scriptwriting, UI/UX Design.
6. **Audio**: Speech-to-Text, Text-to-Speech.
7. **Video**: Video Planning, Subtitle & Caption Agent.
8. **Business**: Marketing, SEO & Content Optimization, Content Strategy.
9. **Utility**: Calculator, Regex & Pattern Agent.

## Adding a Custom Agent
Users can create custom agents directly through the UI or programmatically via `agentRegistry.registerAgent()`.