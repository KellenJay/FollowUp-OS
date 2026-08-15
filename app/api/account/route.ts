import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { updateAccountSettings } from "@/lib/account";

// Name, reply-promise window, and draft-voice are the three real, stored
// preferences (2026-08-14 feedback: Edit Profile only covered name before,
// even though Settings displayed the other two as if they meant something —
// they didn't, until this pass wired them into app_settings + the
// classifier prompt). Email isn't editable here; it's identity, not a
// stored preference. Scan cycle stays display-only — no real cron exists.
export async function PATCH(request: Request) {
  try {
    const ownerId = await requireOwnerId();
    const body = await request.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    }

    const replyPromiseHours =
      typeof body?.replyPromiseHours === "number" && Number.isFinite(body.replyPromiseHours)
        ? Math.min(720, Math.max(1, Math.round(body.replyPromiseHours)))
        : undefined;

    const draftVoice = typeof body?.draftVoice === "string" ? body.draftVoice.trim().slice(0, 300) : undefined;

    await updateAccountSettings(ownerId, { name, replyPromiseHours, draftVoice });
    return NextResponse.json({ ok: true, name, replyPromiseHours, draftVoice });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
