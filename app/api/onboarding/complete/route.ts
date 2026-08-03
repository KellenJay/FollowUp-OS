import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeOnboarding } from "@/lib/onboarding";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const vipAddresses: string[] = Array.isArray(body.vipAddresses) ? body.vipAddresses : [];
  const excludedAddresses: string[] = Array.isArray(body.excludedAddresses) ? body.excludedAddresses : [];

  const ownerId = session.user.id;
  await completeOnboarding(ownerId, vipAddresses, excludedAddresses);

  return NextResponse.json({ ok: true });
}
