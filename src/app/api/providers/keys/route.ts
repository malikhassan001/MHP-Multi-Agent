import { NextRequest, NextResponse } from "next/server";
import { getApiKey, setApiKey, getAllConfiguredKeysStatus } from "@/lib/providers/keys";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ keys: getAllConfiguredKeysStatus() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, key } = body;

    if (!provider || typeof provider !== "string") {
      return NextResponse.json({ error: "Provider name is required." }, { status: 400 });
    }

    setApiKey(provider, key || "");
    return NextResponse.json({ success: true, keys: getAllConfiguredKeysStatus() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}