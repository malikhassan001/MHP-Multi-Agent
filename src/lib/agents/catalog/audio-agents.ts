import { AgentDefinition } from "../types";

export const audioAgents: AgentDefinition[] = [
  {
    id: "speech-to-text-agent",
    name: "Speech-to-Text Agent",
    description: "Transcribes spoken audio, adds punctuation, detects speakers, and generates timestamped transcripts.",
    category: "audio",
    instructions: "Convert audio input into accurate text transcripts with speaker identification and clean punctuation.",
    capabilities: ["speech_recognition", "transcription", "timestamping"],
    tools: ["media_tool"],
    supportedInputs: ["audio", "file"],
    supportedOutputs: ["text", "artifact"],
    permissions: ["READ", "FILES"],
    enabled: true,
    avatarIcon: "Mic",
  },
  {
    id: "text-to-speech-agent",
    name: "Text-to-Speech Agent",
    description: "Converts written text into natural, expressive voice synthesis with customizable speech cadence.",
    category: "audio",
    instructions: "Convert text into natural speech with appropriate pauses, emphasis, and pitch variations.",
    capabilities: ["voice_synthesis", "narration", "prosody_tuning"],
    tools: ["media_tool"],
    supportedInputs: ["text"],
    supportedOutputs: ["audio", "artifact"],
    permissions: ["READ"],
    enabled: true,
    avatarIcon: "Volume2",
  }
];
