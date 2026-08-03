export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", color: "#13161c", lineHeight: 1.6 }}>
      <h1>Privacy policy</h1>
      <p><em>Last updated: 2026-07-27</em></p>

      <p>
        FollowUp OS is a personal productivity tool that connects to a user&apos;s own
        Google account (Gmail and Calendar) to help them triage email, draft replies,
        and track follow-ups. It is currently used by its developer and a small number
        of invited colleagues, not offered as a public product.
      </p>

      <h2>What data we access</h2>
      <p>
        With your explicit Google OAuth consent, FollowUp OS reads Gmail message
        content and metadata (subject, sender, body, thread history) and Calendar
        event details, for the Google account(s) you connect. It can send email on
        your behalf, but only after you explicitly review and click send on a specific
        draft &mdash; it never sends automatically or in the background.
      </p>

      <h2>How we use it</h2>
      <p>
        Email and calendar data is used to: classify threads that need a reply,
        search your mailbox history to avoid mis-classifying ongoing relationships,
        generate draft reply suggestions, and summarize post-meeting follow-ups.
        Some of this content is sent to Anthropic&apos;s Claude API to perform
        classification and drafting &mdash; see{" "}
        <a href="https://www.anthropic.com/legal/privacy">Anthropic&apos;s privacy policy</a>{" "}
        for how they handle API data.
      </p>

      <h2>Where it&apos;s stored</h2>
      <p>
        Thread and meeting data is stored in a Postgres database (hosted on Supabase)
        to power the app&apos;s dashboard. OAuth tokens are encrypted before storage.
        Data is retained only as long as needed for the active dashboard queue and a
        rolling search window, and is deleted when a connected mailbox is disconnected.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>
        We don&apos;t sell or share your data with third parties for advertising or
        any purpose beyond operating the features described above. We don&apos;t send
        email without your explicit per-email approval.
      </p>

      <h2>Revoking access</h2>
      <p>
        You can revoke FollowUp OS&apos;s access to your Google account at any time
        from your{" "}
        <a href="https://myaccount.google.com/permissions">Google Account permissions page</a>.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy: {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "the app owner"}.</p>
    </main>
  );
}
