"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { avatarFor, initialsFor } from "@/lib/avatar";
import type { SenderCandidate } from "@/lib/google/candidates";

export default function OnboardingForm({
  candidates,
  onComplete,
}: {
  candidates: SenderCandidate[];
  // When embedded as AppShell's modal, closes the modal in place instead of
  // navigating — the dashboard underneath is already live. Standalone usage
  // (direct /onboarding visit) falls back to the old navigate-to-"/" behavior.
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  function toggle(address: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vipAddresses: Array.from(checked), excludedAddresses: [] }),
    });
    if (onComplete) {
      onComplete();
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.3px", color: "#13161c", margin: "0 0 8px" }}>
        Let&apos;s find your VIPs
      </h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#9aa1ac", margin: "0 0 32px" }}>
        Based on a scan of your recent inbox and sent mail, these are the people you exchange the most email with.
        Tick anyone you always want prioritized, regardless of how the AI would otherwise classify them.
      </p>

      {candidates.length === 0 ? (
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9aa1ac", marginBottom: 32 }}>
          We didn&apos;t find enough email history yet to suggest anyone — that&apos;s fine, you can flag important
          senders anytime directly from their message card.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {candidates.map((c) => {
            const isChecked = checked.has(c.address);
            return (
              <label
                key={c.address}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: "#fff",
                  border: `1px solid ${isChecked ? "#0b8ee8" : "#eff0f3"}`,
                  borderRadius: 16,
                  boxShadow: "0 1px 2px rgba(16,24,40,.04), 0 10px 26px -18px rgba(16,24,40,.16)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(c.address)}
                  style={{ width: 18, height: 18, accentColor: "#0b8ee8", flexShrink: 0 }}
                />
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: avatarFor(c.address),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#13161c",
                    flexShrink: 0,
                  }}
                >
                  {initialsFor(c.name || c.address)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#13161c" }}>{c.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#9aa1ac" }}>{c.address}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9aa1ac", flexShrink: 0, textAlign: "right" }}>
                  {c.sentCount} sent · {c.receivedCount} received
                </div>
              </label>
            );
          })}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="hover-dark-btn"
        style={{
          background: "#13161c",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Saving..." : "Continue"}
      </button>
    </main>
  );
}
