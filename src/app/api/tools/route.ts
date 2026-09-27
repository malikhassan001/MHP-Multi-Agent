import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const tools = toolRegistry.getAllTools().map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    requiredPermissions: t.requiredPermissions,
    requiresConfirmation: t.requiresConfirmation,
  }));
  return NextResponse.json({ tools });
}

export async function POST(req: NextRequest) {
  try {
    const { toolId, input, permissions } = await req.json();
    const result = await toolRegistry.executeTool(toolId, input, {
      grantedPermissions: permissions || ["READ", "WRITE", "EXECUTE", "FILES", "NETWORK"],
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
