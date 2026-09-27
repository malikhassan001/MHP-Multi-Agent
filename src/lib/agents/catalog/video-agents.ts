import { AgentDefinition } from "../types";

export const videoAgents: AgentDefinition[] = [
  {
    id: "video-planning-agent",
    name: "Video Planning Agent",
    description: "Plans video production schedules, B-roll shot lists, equipment requirements, and editing sequences.",
    category: "video",
    instructions: "Produce shot-by-shot lists, B-roll sequences, visual queues, and sound design recommendations.",
    capabilities: ["video_planning", "shot_lists", "b_roll_mapping"],
    tools: [],
    supportedInputs: ["text"],
    supportedOutputs: ["text", "artifact"],
    permissions: ["READ"],
    enabled: true,
    avatarIcon: "Video",
  },
  {
    id: "subtitle-agent",
    name: "Subtitle & Caption Agent",
    description: "Generates synchronized SRT, VTT, and styled social media captions with optimal reading speeds.",
    category: "video",
    instructions: "Create standard SRT/VTT formatted caption tracks with strict character-per-second constraints.",
    capabilities: ["srt_generation", "vtt_generation", "caption_timing"],
    tools: ["document_parser"],
    supportedInputs: ["text", "audio", "file"],
    supportedOutputs: ["text", "artifact"],
    permissions: ["READ"],
    enabled: true,
    avatarIcon: "Subtitles",
  }
];
