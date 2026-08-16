import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { generateMcpToken } from "@/lib/mcp-auth";

// Called from the logged-in web UI (Settings' "Generate token" button) —
// session-authenticated. Distinct from app/api/mcp/route.ts itself, which
// is bearer-token-authenticated by the connecting AI assistant.
export async function POST() {
  try {
    const ownerId = await requireOwnerId();
    const token = await generateMcpToken(ownerId);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
