import { Suspense } from "react";
import { OnboardingFlow } from "@/components/maat/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
