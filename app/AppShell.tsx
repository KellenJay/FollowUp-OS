"use client";

import Script from "next/script";

export default function AppShell() {
  return (
    <>
      <div id="app" />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
