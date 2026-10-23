import type { Asset, ParseResult, Scene } from "./types";

export const WORDS_PER_SECOND = 2.6;

const HEADING_RE = /^(?:#{1,3}\s*scene\b|\[scene\b)(.*)$/i;
const FIELD_RE = /^(vo|voice|narration|visual|prompt|shot|camera|mood|duration)\s*:\s*(.*)$/i;
const DURATION_RE = /(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?\b/i;

interface DraftScene {
  title: string;
  narration: string[];
  visual?: string;
  camera?: string;
  mood?: string;
  duration?: number;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function estimateSpeechDuration(text: string): number {
  return countWords(text) / WORDS_PER_SECOND;
}

function parseHeading(rest: string, index: number): DraftScene {
  const cleaned = rest.replace(/\]\s*$/, "").replace(/^[\s:\-#\d.]+/, "");
  const [titlePart, ...meta] = cleaned.split(/[|,]/);
  const durationMatch = meta.join(" ").match(DURATION_RE) ?? cleaned.match(DURATION_RE);
  return {
    title: titlePart?.replace(DURATION_RE, "").trim() || `Scene ${index}`,
    narration: [],
    duration: durationMatch ? Number.parseFloat(durationMatch[1]) : undefined,
  };
}

function parseStructured(lines: string[]): DraftScene[] {
  const drafts: DraftScene[] = [];
  let current: DraftScene | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = line.match(HEADING_RE);
    if (heading) {
      current = parseHeading(heading[1], drafts.length + 1);
      drafts.push(current);
      continue;
    }

    if (!current) {
      current = { title: "Intro", narration: [] };
      drafts.push(current);
    }

    const field = line.match(FIELD_RE);
    if (!field) {
      current.narration.push(line);
      continue;
    }

    const key = field[1].toLowerCase();
    const value = field[2].trim();
    if (key === "vo" || key === "voice" || key === "narration") current.narration.push(value);
    else if (key === "visual" || key === "prompt" || key === "shot") current.visual = value;
    else if (key === "camera") current.camera = value;
    else if (key === "mood") current.mood = value;
    else if (key === "duration") {
      const m = value.match(/(\d+(?:\.\d+)?)/);
      if (m) current.duration = Number.parseFloat(m[1]);
    }
  }
  return drafts;
}

function parseFreeform(text: string): DraftScene[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph, i) => {
      const directive = paragraph.match(/\[([^\]]+)\]/);
      const narration = paragraph.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
      const firstClause = narration.split(/[.,;!?]/)[0]?.trim() ?? "";
      return {
        title: firstClause.split(/\s+/).slice(0, 4).join(" ") || `Scene ${i + 1}`,
        narration: [narration],
        visual: directive?.[1].trim(),
      };
    });
}

function matchAsset(scene: Pick<Scene, "visual" | "narration" | "title">, assets: Asset[], fallbackIndex: number): string | undefined {
  const visuals = assets.filter((a) => a.kind === "image" || a.kind === "video");
  if (visuals.length === 0) return undefined;
  const haystack = `${scene.visual} ${scene.title} ${scene.narration}`.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const asset of visuals) {
    const score = asset.tags.reduce((acc, tag) => (haystack.includes(tag.toLowerCase()) ? acc + 1 : acc), 0);
    if (score > 0 && (!best || score > best.score)) best = { id: asset.id, score };
  }
  return best?.id ?? visuals[fallbackIndex % visuals.length].id;
}

export function parseScript(text: string, assets: Asset[] = []): ParseResult {
  const lines = text.split(/\r?\n/);
  const structured = lines.some((l) => HEADING_RE.test(l.trim()));
  const drafts = structured ? parseStructured(lines) : parseFreeform(text);
  const warnings: string[] = [];

  let cursor = 0;
  let wordCount = 0;
  const scenes: Scene[] = drafts.map((draft, i) => {
    const narration = draft.narration.join(" ").trim();
    const words = countWords(narration);
    wordCount += words;
    const spoken = words / WORDS_PER_SECOND;
    const duration = Math.round((draft.duration ?? Math.max(2.5, spoken + 0.8)) * 10) / 10;
    const label = `Scene ${i + 1}`;

    if (!draft.visual) warnings.push(`${label}: no visual prompt — one will be inferred from narration.`);
    if (!narration) warnings.push(`${label}: no narration found.`);
    if (draft.duration && spoken > draft.duration) {
      warnings.push(`${label}: narration needs ~${spoken.toFixed(1)}s but scene is ${draft.duration}s.`);
    }
    if (duration > 20) warnings.push(`${label}: long scene (${duration}s) — consider splitting.`);

    const scene: Scene = {
      id: `scene_${i + 1}`,
      index: i + 1,
      title: draft.title,
      narration,
      visual: draft.visual ?? narration.split(/[.!?]/)[0] ?? "",
      camera: draft.camera,
      mood: draft.mood,
      duration,
      start: cursor,
    };
    scene.assetId = matchAsset(scene, assets, i);
    cursor += duration;
    return scene;
  });

  return {
    scenes,
    warnings,
    totalDuration: Math.round(cursor * 10) / 10,
    wordCount,
    mode: structured ? "structured" : "freeform",
  };
}
