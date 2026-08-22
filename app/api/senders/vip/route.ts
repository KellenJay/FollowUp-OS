import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { listVips, addVip } from "@/lib/senders";

export async function GET() {
  try {
    const ownerId = await requireOwnerId();
    const vips = await listVips(ownerId);
    return NextResponse.json({ vips });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!address || !address.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : undefined;

  try {
    const ownerId = await requireOwnerId();
    const vip = await addVip(ownerId, address, name);
    return NextResponse.json({ vip });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
