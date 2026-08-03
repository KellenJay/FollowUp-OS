import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isOnboardingComplete, hasConnectedMailbox } from "@/lib/onboarding";
import AppShell from "./AppShell";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connect");
  }

  const ownerId = session.user.id;
  // A brand-new email/password signup has zero mailboxes yet — the
  // onboarding check alone doesn't model that state, so it's checked first.
  if (!(await hasConnectedMailbox(ownerId))) {
    redirect("/connect");
  }
  if (!(await isOnboardingComplete(ownerId))) {
    redirect("/onboarding");
  }

  return <AppShell />;
}
