import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { removeVip } from "@/lib/senders";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const ownerId = await requireOwnerId();
    const found = await removeVip(ownerId, id);
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
