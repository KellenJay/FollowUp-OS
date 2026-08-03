import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOnboardingCandidates, isOnboardingComplete } from "@/lib/onboarding";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/connect");

  const ownerId = session.user.id;
  if (await isOnboardingComplete(ownerId)) redirect("/");

  const candidates = await getOnboardingCandidates(ownerId);

  return <OnboardingForm candidates={candidates} />;
}
