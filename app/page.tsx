import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isOnboardingComplete, hasConnectedMailbox } from "@/lib/onboarding";
import AppShell from "./AppShell";
import LandingPage from "./LandingPage";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    return <LandingPage />;
  }

  const ownerId = session.user.id;
  // A brand-new email/password signup has zero mailboxes yet — the
  // onboarding check alone doesn't model that state, so it's checked first.
  if (!(await hasConnectedMailbox(ownerId))) {
    redirect("/connect");
  }
  // No longer redirects to a blocking /onboarding page — the dashboard
  // renders immediately either way, and AppShell fetches candidates in the
  // background + shows the VIP-picker as a modal once onboarding isn't
  // complete (see 2026-08-07 feedback: the old synchronous per-mailbox Gmail
  // scan blocked first paint, worse the more mailboxes an account has).
  const onboardingComplete = await isOnboardingComplete(ownerId);

  return <AppShell onboardingComplete={onboardingComplete} />;
}
