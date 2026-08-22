"use client";

import { useState, FormEvent, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const pill: CSSProperties = { borderRadius: 999, fontSize: 15, textAlign: "center" };
const input: CSSProperties = {
  padding: "13px 16px",
  fontSize: 14.5,
  borderRadius: 999,
  border: "1px solid #eceef1",
  background: "#fbfbfc",
  color: "#13161c",
  outline: "none",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

// Styled per Ellen's 2026-08-05 Claude Design mockup for the signup flow
// (dark hero card, "Connect your inbox in under two minutes" copy). No name
// field by design — app/api/signup/route.ts already treats name as optional.
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      // Keeps session-issuing logic in one place (NextAuth's own Credentials
      // flow) rather than duplicating it in the signup route.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created. Sign in from the Connect page.");
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 60px", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif", color: "#13161c" }}>
      <style>{`
        .su-grid { display: grid; grid-template-columns: 1fr 420px; gap: 56px; align-items: center; }
        @media (max-width: 860px) {
          .su-card-outer { padding: 40px 24px !important; border-radius: 20px !important; }
          .su-grid { grid-template-columns: 1fr; gap: 32px; }
          .su-heading { font-size: 32px !important; }
          .su-header { flex-wrap: wrap; gap: 10px; height: auto !important; padding: 20px 0 !important; }
        }
      `}</style>

      <header className="su-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 84 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/landing-logo.png" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} alt="" />
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.01em" }}>
            FollowUp <span style={{ fontWeight: 500, color: "#9aa1ac" }}>OS</span>
          </div>
        </div>
        <div style={{ fontSize: 14.5, color: "#767d89" }}>
          Already have an account? <a href="/connect" style={{ color: "#0b8ee8", fontWeight: 700 }}>Log in</a>
        </div>
      </header>

      <div className="su-card-outer" style={{ position: "relative", background: "#13161c", borderRadius: 28, padding: "64px 60px", marginTop: 8, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -90, bottom: -90, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(11,142,232,.25), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -100, top: -100, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,138,32,.16), transparent 70%)", pointerEvents: "none" }} />

        <div className="su-grid" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ color: "#f08a20", fontWeight: 700, fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 16 }}>
              Get started
            </div>
            <h1 className="su-heading" style={{ color: "#fff", fontSize: 44, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, margin: "0 0 20px" }}>
              Connect your inbox in under two minutes
            </h1>
            <p style={{ color: "#a7adb8", fontSize: 16, lineHeight: 1.6, margin: "0 0 28px", maxWidth: 440 }}>
              Works alongside your email inbox, nothing changes for the people you email.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#c3c8d1", fontSize: 13.5 }}>
                <i className="ti ti-check" style={{ color: "#0b8ee8", fontWeight: 700 }} /> Free to try
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#c3c8d1", fontSize: 13.5 }}>
                <i className="ti ti-check" style={{ color: "#f08a20", fontWeight: 700 }} /> No credit card
              </span>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 30px 60px -25px rgba(0,0,0,.5)" }}>
            <button
              type="button"
              onClick={() => signIn("google")}
              style={{ ...pill, ...input, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, cursor: "pointer", padding: "13px 0" }}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: "#a7adb8", fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em" }}>
              <span style={{ flex: 1, height: 1, background: "#eceef1" }} /> OR <span style={{ flex: 1, height: 1, background: "#eceef1" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={input}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={input}
              />
              {error && <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                style={{ ...pill, background: "#13161c", color: "#fff", fontWeight: 700, border: "none", padding: "14px 0", cursor: "pointer" }}
              >
                {submitting ? "Creating account…" : "Create free account"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 13, color: "#a7adb8" }}>
              Already have an account? <a href="/connect" style={{ color: "#0b8ee8", fontWeight: 700 }}>Log in</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
