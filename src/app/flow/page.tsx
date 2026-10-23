import type { Metadata, Viewport } from "next";
import { FlowStudio } from "@/components/flow/FlowStudio";

export const metadata: Metadata = {
  title: "Flow Voice-to-Video Studio — MHP",
  description: "Turn a voice-over script into a scene-by-scene video with a multi-track timeline, scene prompt parser, preview monitor, and asset manager.",
};

export const viewport: Viewport = {
  themeColor: "#070A11",
};

export default function FlowPage() {
  return (
    <main>
      <h1 className="sr-only">Flow Voice-to-Video Studio</h1>
      <FlowStudio />
    </main>
  );
}
