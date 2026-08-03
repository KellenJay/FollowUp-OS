export default function TermsOfService() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", color: "#13161c", lineHeight: 1.6 }}>
      <h1>Terms of service</h1>
      <p><em>Last updated: 2026-07-27</em></p>

      <p>
        FollowUp OS is a personal productivity tool, provided as-is, currently used
        by its developer and a small number of invited colleagues rather than offered
        as a public product.
      </p>

      <h2>Your responsibilities</h2>
      <p>
        You are responsible for the accuracy of anything you send using FollowUp OS
        &mdash; every outgoing email requires your explicit review and a manual send
        action, and you are the one sending it. You are responsible for keeping your
        Google account access to the app secure and revoking it if you no longer want
        FollowUp OS to have access.
      </p>

      <h2>No warranty</h2>
      <p>
        FollowUp OS is provided without warranty of any kind. AI-generated
        classifications and draft replies may be inaccurate or incomplete &mdash;
        always review before sending.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may change as the app evolves. Continued use after a change means
        you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: {process.env.NEXT_PUBLIC_CONTACT_EMAIL || "the app owner"}.</p>
    </main>
  );
}
