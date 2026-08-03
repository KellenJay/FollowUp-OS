import { google } from "googleapis";
import type { GoogleAuthClient } from "@/lib/google/oauth-client";

export type ScannedMeeting = {
  calendarEventId: string;
  title: string;
  attendeeName: string;
  attendeeOrg: string;
  attendeeEmail: string;
  endedAt: string;
};

export async function scanRecentMeetings(
  auth: GoogleAuthClient,
  mailboxAddress: string,
  lookbackHours = 48
): Promise<ScannedMeeting[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const timeMin = new Date(now.getTime() - lookbackHours * 3_600_000);

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: now.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 40,
  });

  const results: ScannedMeeting[] = [];

  for (const event of data.items ?? []) {
    if (!event.id || !event.end?.dateTime) continue;
    const endedAt = new Date(event.end.dateTime);
    if (endedAt.getTime() > now.getTime()) continue; // still in progress or upcoming

    // Skip solo blocks / reminders with no other attendee — not a "meeting".
    const externalAttendee = (event.attendees ?? []).find(
      (a) => a.email?.toLowerCase() !== mailboxAddress.toLowerCase() && !a.resource
    );
    if (!externalAttendee) continue;

    const name = externalAttendee.displayName || externalAttendee.email?.split("@")[0] || "Unknown";
    const org = externalAttendee.email?.split("@")[1] ?? "";

    results.push({
      calendarEventId: event.id,
      title: event.summary || "(no title)",
      attendeeName: name,
      attendeeOrg: org,
      attendeeEmail: externalAttendee.email ?? "",
      endedAt: endedAt.toISOString(),
    });
  }

  return results;
}
