import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadDashboard } from "@/lib/dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const data = await loadDashboard(session.user.id);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
