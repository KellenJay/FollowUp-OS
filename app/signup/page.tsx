"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// Plain/unstyled like app/connect/page.tsx — functional scaffolding, real
// visual design lands in the landing-page/marketing pass (out of scope for
// this multi-tenant foundation phase).
export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
        body: JSON.stringify({ name, email, password }),
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
        setError("Account created — sign in from the Connect page.");
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
    <main style={{ maxWidth: 380, margin: "80px auto", fontFamily: "inherit", padding: "0 20px" }}>
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "10px 12px", fontSize: 14 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px 12px", fontSize: 14 }}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ padding: "10px 12px", fontSize: 14 }}
        />
        {error && <p style={{ color: "#a5561b", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ padding: "10px 12px", fontSize: 14, cursor: "pointer" }}>
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Already have an account? <a href="/connect">Sign in</a>
      </p>
    </main>
  );
}
