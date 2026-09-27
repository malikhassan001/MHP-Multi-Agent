import { NextResponse } from "next/server";
import { providerRegistry } from "@/lib/providers/registry";
import { agentRegistry } from "@/lib/agents/registry";
import { toolRegistry } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = await Promise.all(providerRegistry.getAllProviders().map((p) => p.checkHealth()));
  const totalAgents = agentRegistry.getAllAgents().length;
  const totalTools = toolRegistry.getAllTools().length;

  return NextResponse.json({
    status: "healthy",
    platform: "MHP Unified AI Super Agent",
    timestamp: Date.now(),
    uptimeSeconds: process.uptime(),
    metrics: {
      agentsAvailable: totalAgents,
      toolsAvailable: totalTools,
      providersActive: providers.filter((p) => p.healthy).length,
    },
    providers,
  });
}
