import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { searchDashboard } from "@/lib/search";

export async function GET(request: Request) {
  try {
    const ownerId = await requireOwnerId();
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchDashboard(ownerId, query);
    return NextResponse.json({ query, results });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
