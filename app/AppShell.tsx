"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import OnboardingForm from "./onboarding/OnboardingForm";
import type { SenderCandidate } from "@/lib/google/candidates";

export default function AppShell({ onboardingComplete }: { onboardingComplete: boolean }) {
  // Dashboard mounts immediately regardless of onboarding state (see
  // app/page.tsx) — this just fetches the VIP-candidate scan in the
  // background and shows it as a modal once ready, instead of the old
  // blocking /onboarding page that awaited the same scan before rendering
  // anything at all.
  const [candidates, setCandidates] = useState<SenderCandidate[] | null>(null);

  useEffect(() => {
    if (onboardingComplete) return;
    let cancelled = false;
    fetch("/api/onboarding/candidates")
      .then((res) => (res.ok ? res.json() : { candidates: [] }))
      .then((data) => {
        if (!cancelled) setCandidates(data.candidates ?? []);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [onboardingComplete]);

  return (
    <>
      <div id="app" />
      <Script src="/app.js" strategy="afterInteractive" />
      {candidates !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(19,22,28,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 30px 60px -25px rgba(16,24,40,.5)",
            }}
          >
            <OnboardingForm candidates={candidates} onComplete={() => setCandidates(null)} />
          </div>
        </div>
      )}
    </>
  );
}
