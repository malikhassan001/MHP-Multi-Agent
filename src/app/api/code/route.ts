import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, command, filePath, content, language } = await req.json();

    if (action === "terminal") {
      const res = await toolRegistry.executeTool("terminal", { command }, {
        grantedPermissions: ["EXECUTE"],
      });
      return NextResponse.json(res);
    }

    if (action === "save_file") {
      const res = await toolRegistry.executeTool("filesystem", { action: "write", filePath, content }, {
        grantedPermissions: ["FILES"],
      });
      return NextResponse.json(res);
    }

    if (action === "test") {
      const res = await toolRegistry.executeTool("code_runner", { language: language || "html", code: content }, {
        grantedPermissions: ["EXECUTE", "FILES"],
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
