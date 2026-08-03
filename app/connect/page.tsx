import { auth, signIn, signOut } from "@/auth";
import { hasConnectedMailbox } from "@/lib/onboarding";

// Was purely a Google-OAuth test page; now the real entry point for both
// audiences the multi-tenant foundation introduces: fully signed-out
// visitors (Google or email/password + a link to sign up), and already-
// authenticated email/password users who haven't connected a mailbox yet
// (see app/page.tsx's redirect chain — hasConnectedMailbox gates on this).
export default async function ConnectPage() {
  const session = await auth();
  const needsMailbox = session?.user ? !(await hasConnectedMailbox(session.user.id)) : false;

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", textAlign: "center", padding: "0 20px" }}>
      {session?.user ? (
        needsMailbox ? (
          <>
            <h1>Connect your mailbox</h1>
            <p style={{ fontSize: 13, color: "#5d6470" }}>
              Connect the Google account matching your sign-in email ({session.user.email}) to start scanning your inbox.
            </p>
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button type="submit">Connect your Google mailbox</button>
            </form>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
              style={{ marginTop: 12 }}
            >
              <button type="submit">Sign out</button>
            </form>
          </>
        ) : (
          <>
            <h1>You're connected</h1>
            <p>Signed in as {session.user.email}</p>
            <p style={{ marginTop: 16 }}>
              <a href="/" style={{ fontWeight: 700 }}>Continue to your dashboard →</a>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
              style={{ marginTop: 20 }}
            >
              <button type="submit">Sign out</button>
            </form>
          </>
        )
      ) : (
        <>
          <h1>Sign in</h1>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button type="submit">Sign in with Google</button>
          </form>

          <p style={{ margin: "18px 0", fontSize: 12, color: "#a7adb8" }}>or</p>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("credentials", formData);
            }}
            style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}
          >
            <input name="email" type="email" placeholder="Email" required style={{ padding: "10px 12px", fontSize: 14 }} />
            <input name="password" type="password" placeholder="Password" required style={{ padding: "10px 12px", fontSize: 14 }} />
            <button type="submit">Sign in</button>
          </form>

          <p style={{ marginTop: 16, fontSize: 13 }}>
            No account yet? <a href="/signup">Sign up</a>
          </p>
        </>
      )}
    </main>
  );
}
