// Sensitive (not restricted) scopes only — see PRD.md open-questions note on
// why "dismiss" is modeled as our own app state instead of a real Gmail
// archive: that would require gmail.modify, which Google classifies as
// "restricted" and requires a costly third-party security assessment to
// verify for production use.
//
// Shared between auth.ts's NextAuth Google provider (first sign-in / first
// mailbox) and app/api/mailboxes/connect's hand-rolled OAuth flow (adding
// additional mailboxes to an already-signed-in account) so the two never
// drift out of sync.
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");
