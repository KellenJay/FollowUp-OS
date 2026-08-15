import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOnboardingCandidates } from "@/lib/onboarding";

// Fired in the background from AppShell once the dashboard is already
// visible — replaces the old app/onboarding page that awaited this before
// rendering anything.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const candidates = await getOnboardingCandidates(session.user.id);
    return NextResponse.json({ candidates });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
