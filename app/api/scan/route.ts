import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runScan } from "@/lib/scan";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const summary = await runScan(session.user.id);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
