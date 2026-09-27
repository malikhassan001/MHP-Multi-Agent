import { NextRequest, NextResponse } from "next/server";
import { agentRegistry } from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  if (category) {
    return NextResponse.json({ agents: agentRegistry.getAgentsByCategory(category as any) });
  }
  return NextResponse.json({ agents: agentRegistry.getAllAgents() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, category, instructions, capabilities, tools } = body;

    if (!id || !name || !instructions) {
      return NextResponse.json({ error: "Missing required fields for custom agent." }, { status: 400 });
    }

    agentRegistry.registerAgent(
      {
        id,
        name,
        description: description || "Custom user-defined agent",
        category: category || "custom",
        instructions,
        capabilities: capabilities || ["custom_task"],
        tools: tools || ["filesystem"],
        supportedInputs: ["text"],
        supportedOutputs: ["text", "artifact"],
        enabled: true,
      },
      true
    );

    return NextResponse.json({ success: true, agent: agentRegistry.getAgent(id) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
