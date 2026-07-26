# Feature / capability manifest

Each of these is a discrete capability the app should expose — think of them as the app's internal "skills." Full detail on each is in `PRD.md`; this file is a quick index of what the product actually does, module by module.

## 1. Inbox scan & classify
Scans a connected Gmail inbox for unanswered threads and sorts them into Needs-your-reply, Low-confidence, or auto-filtered/skip. Searches a sender's mailbox history before tagging anything as cold outreach — a recency-windowed scan alone misses ongoing relationships.

## 2. Draft assistant
For any surfaced thread: two AI-drafted reply options (warm-but-concrete tone) plus a free-text box for a custom instruction. Loop: draft → edit/regenerate → approve. Never auto-sends — always a human-reviewed draft at minimum (see PRD open question on whether one-click send is in scope).

## 3. Triage state management
Dismiss (reversible — archives, not deletes) and Restore actions; a persistent Sent list with feedback controls (thumbs up/down) that survive after a thread resolves. Every priority tier gets equal interactivity, not just top-priority items.

## 4. Mailbox search
Natural-language search bar over the connected mailbox(es), returning relevant threads with next-step options (reply, view last exchange, etc.), not just raw search results.

## 5. Scheduled + on-demand refresh
Daily automatic scan (~8am) plus a manual refresh action for on-demand rechecks during the day.

## 6. Meeting-recorder monitor (phase 3)
Tracks which meeting-transcription tool actually produces usable output (has been Optiverse over Otter in practice) and surfaces reliability issues.

## 7. Post-meeting follow-up (phase 3)
After a calendar meeting ends, waits 30 minutes for a transcript email. If one arrives, drafts a follow-up from the real summary/action items. If not, falls back to recent thread history with that contact and drafts a generic-but-informed follow-up, flagged as such.

## 8. Sent-mail follow-up nudges (phase 2)
Flags Ellen's own sent emails that haven't gotten a reply after N business days and offers a follow-up draft, same approve/edit loop as module 2.

## 9. HubSpot lead-stage sync (phase 4, future)
Not built yet. After a call, automatically advances the associated HubSpot contact/deal to the next pipeline stage based on conversation content (from a transcript or Ellen's manual feedback). Requires Ellen to first define the pipeline/stages in HubSpot. Design the data model now so this isn't precluded later, but don't build it yet.
