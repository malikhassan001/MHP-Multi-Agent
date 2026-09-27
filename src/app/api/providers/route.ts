import { NextResponse } from "next/server";
import { providerRegistry } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = await Promise.all(
    providerRegistry.getAllProviders().map(async (p) => {
      const health = await p.checkHealth();
      return {
        id: p.id,
        name: p.name,
        isConfigured: p.isConfigured,
        isLocal: p.isLocal,
        models: p.models,
        health,
      };
    })
  );
  return NextResponse.json({ providers });
}
