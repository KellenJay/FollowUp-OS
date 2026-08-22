import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { listVipSuggestions } from "@/lib/senders";

// Kept as its own endpoint (not bundled into GET /api/senders/vip) because it
// re-runs a live Gmail scan across every mailbox, same as the onboarding
// candidate scan — too slow/expensive to fire on every settings page visit.
export async function GET() {
  try {
    const ownerId = await requireOwnerId();
    const suggestions = await listVipSuggestions(ownerId);
    return NextResponse.json({ suggestions });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
