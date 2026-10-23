"use client";

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, Clock, FileText, Layers, Mic, MicOff, Palette, Sparkles } from "lucide-react";
import { parseScript } from "@/lib/flow/parser";
import { SAMPLE_SCRIPT } from "@/lib/flow/sample";
import type { Scene } from "@/lib/flow/types";
import { formatShort } from "@/lib/flow/utils";
import { useStudio } from "./studio-store";

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

function getRecognition(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const sceneSignature = (scenes: Scene[]) =>
  JSON.stringify(scenes.map((s) => [s.title, s.duration, s.narration, s.visual, s.camera, s.mood, s.assetId]));

function SceneCard({ scene, thumb, active, onSelect }: { scene: Scene; thumb?: string; active: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full gap-3 rounded-lg border p-2 text-left transition ${
          active ? "border-[#00D2FF]/60 bg-[#00D2FF]/5" : "border-[#1B253B] bg-[#0B101C] hover:border-[#2A3757]"
        }`}
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-[#121A2D]">
          {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
          <span className="absolute left-1 top-1 rounded bg-black/70 px-1 font-mono text-[9px] font-bold text-[#00D2FF]">{`S${scene.index}`}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-xs font-semibold text-slate-100">{scene.title}</h3>
            <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-500">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {`${scene.duration}s`}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{scene.narration || "—"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {scene.camera && (
              <span className="flex items-center gap-1 rounded bg-[#121A2D] px-1.5 py-0.5 text-[9px] text-slate-400">
                <Camera className="h-2.5 w-2.5" aria-hidden="true" />
                {scene.camera}
              </span>
            )}
            {scene.mood && (
              <span className="flex items-center gap-1 rounded bg-[#121A2D] px-1.5 py-0.5 text-[9px] text-slate-400">
                <Palette className="h-2.5 w-2.5" aria-hidden="true" />
                {scene.mood}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

export function ScenePromptParser() {
  const { state, dispatch } = useStudio();
  const [tab, setTab] = useState<"script" | "scenes">("script");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);

  const deferredScript = useDeferredValue(state.script);
  const result = useMemo(() => parseScript(deferredScript, state.assets), [deferredScript, state.assets]);
  const dirty = sceneSignature(result.scenes) !== sceneSignature(state.appliedScenes);
  const thumbs = useMemo(() => new Map(state.assets.map((a) => [a.id, a.src])), [state.assets]);

  const activeScene = state.appliedScenes.find(
    (s) => state.currentTime >= s.start && state.currentTime < s.start + s.duration,
  );

  useEffect(() => {
    setSpeechSupported(!!getRecognition());
    return () => recognitionRef.current?.stop();
  }, []);

  const scriptRef = useRef(state.script);
  scriptRef.current = state.script;

  const appendDictation = (text: string) => {
    const transcript = text.trim();
    if (!transcript) return;
    const current = scriptRef.current.trimEnd();
    const structured = /^(#{1,3}\s*scene\b|\[scene\b)/im.test(current);
    const count = (current.match(/^#{1,3}\s*scene\b/gim)?.length ?? 0) + 1;
    const title = transcript.split(/\s+/).slice(0, 3).join(" ");
    const addition = structured ? `# Scene ${count}: ${title}\nVO: ${transcript}` : transcript;
    dispatch({ type: "setScript", script: current ? `${current}\n\n${addition}` : addition });
  };

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) appendDictation(r[0].transcript);
        else pending += r[0].transcript;
      }
      setInterim(pending);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTab("script");
  };

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-medium transition ${
      active ? "bg-[#141E34] text-white" : "text-slate-500 hover:text-slate-300"
    }`;

  return (
    <aside aria-label="Scene prompt parser" className="flex w-[360px] shrink-0 flex-col border-l border-[#1B253B] bg-[#090D17]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#1B253B] bg-[#0A0E1A] px-3">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-[#00D2FF]" aria-hidden="true" />
          Scene Prompt Parser
        </h2>
        <span className="rounded bg-[#121A2D] px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-400">{result.mode}</span>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-[#1B253B] p-2" role="tablist" aria-label="Parser view">
        <button type="button" role="tab" aria-selected={tab === "script"} onClick={() => setTab("script")} className={tabClass(tab === "script")}>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Script
        </button>
        <button type="button" role="tab" aria-selected={tab === "scenes"} onClick={() => setTab("scenes")} className={tabClass(tab === "scenes")}>
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {`Scenes (${result.scenes.length})`}
        </button>
      </div>

      {tab === "script" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-1 px-2 pt-2">
            <button
              type="button"
              onClick={toggleDictation}
              disabled={!speechSupported}
              aria-pressed={listening}
              title={speechSupported ? "Dictate narration with your microphone" : "Speech recognition is not supported in this browser"}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition disabled:opacity-40 ${
                listening ? "bg-red-500/15 text-red-400" : "bg-[#121A2D] text-slate-300 hover:text-white"
              }`}
            >
              {listening ? <MicOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Mic className="h-3.5 w-3.5" aria-hidden="true" />}
              {listening ? "Stop dictation" : "Dictate"}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "setScript", script: SAMPLE_SCRIPT })}
              className="h-7 rounded-md px-2.5 text-[11px] text-slate-400 transition hover:bg-[#121A2D] hover:text-white"
            >
              Load template
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "setScript", script: "" })}
              className="ml-auto h-7 rounded-md px-2.5 text-[11px] text-slate-500 transition hover:bg-[#121A2D] hover:text-white"
            >
              Clear
            </button>
          </div>

          <label htmlFor="flow-script" className="sr-only">
            Voice-over script
          </label>
          <textarea
            id="flow-script"
            value={state.script}
            onChange={(e) => dispatch({ type: "setScript", script: e.target.value })}
            spellCheck={false}
            placeholder={"# Scene 1: Title | 5s\nVO: What the narrator says\nVisual: what the camera sees\nCamera: slow push-in\nMood: hopeful\n\n…or paste plain paragraphs, one per scene."}
            className="m-2 min-h-0 flex-1 resize-none rounded-lg border border-[#1B253B] bg-[#060911] p-3 font-mono text-[11.5px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#0066FF]/60"
          />
          {listening && (
            <p className="mx-2 -mt-1 mb-2 truncate rounded bg-red-500/10 px-2 py-1 text-[11px] italic text-red-300" aria-live="polite">
              {interim || "Listening…"}
            </p>
          )}

          <dl className="grid shrink-0 grid-cols-3 gap-px border-t border-[#1B253B] bg-[#1B253B] text-center">
            {[
              ["Scenes", result.scenes.length.toString()],
              ["Words", result.wordCount.toString()],
              ["Runtime", formatShort(result.totalDuration)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#090D17] py-2">
                <dt className="text-[9px] uppercase tracking-wider text-slate-500">{label}</dt>
                <dd className="font-mono text-sm text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>

          {result.warnings.length > 0 && (
            <details className="shrink-0 border-t border-[#1B253B] px-3 py-2">
              <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {`${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}`}
              </summary>
              <ul className="mt-1.5 max-h-24 space-y-1 overflow-y-auto">
                {result.warnings.map((w) => (
                  <li key={w} className="text-[10.5px] leading-snug text-slate-400">
                    {w}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2" aria-label="Parsed scenes">
          {result.scenes.length === 0 && <li className="p-6 text-center text-xs text-slate-500">Write a script to generate scenes.</li>}
          {result.scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              thumb={scene.assetId ? thumbs.get(scene.assetId) : undefined}
              active={!dirty && activeScene?.id === scene.id}
              onSelect={() => !dirty && dispatch({ type: "seek", time: scene.start })}
            />
          ))}
        </ul>
      )}

      <div className="shrink-0 border-t border-[#1B253B] p-2">
        <button
          type="button"
          disabled={!dirty || result.scenes.length === 0}
          onClick={() => dispatch({ type: "applyScenes", result })}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] text-xs font-semibold text-white transition hover:bg-[#0080FF] disabled:bg-[#121A2D] disabled:text-slate-500"
        >
          {dirty ? (
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {`Build timeline from ${result.scenes.length} scenes`}
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Timeline in sync with script
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
