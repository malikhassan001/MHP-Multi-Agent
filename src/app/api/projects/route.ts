import { NextRequest, NextResponse } from "next/server";
import { projectStore } from "@/lib/projects/project-store";
import { toolRegistry } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = projectStore.getAllProjects();
  // Fetch current workspace tree
  const treeRes = await toolRegistry.executeTool("filesystem", { action: "tree" }, {});
  return NextResponse.json({ projects, workspaceTree: (treeRes.data as any)?.tree || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    const project = projectStore.createProject(name, description || "");
    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
