import { ActivityPage } from "@/components/body/activity/activity-page";
import { NutritionPage } from "../components/body/nutrition/nutrition-page";
import { IntakeTab } from "@/components/body/intake-tab";
import { SleepTab } from "@/components/body/sleep-tab";
import { HygieneTab } from "@/components/body/hygiene-tab";
import { useParams } from "wouter";
import { BodyHub } from "@/components/body/body-hub";
import { BodyLayout } from "@/components/body/body-layout";
import { BodySetupWizard } from "@/components/body/body-setup-wizard";

export default function Body() {
  const { subpage } = useParams();

  // Setup wizard — full screen, no layout wrapper
  if (subpage === "setup") {
    return <BodySetupWizard />;
  }

  // All body pages share the bottom nav layout
  return (
    <BodyLayout>
      {!subpage && <BodyHub />}
      {subpage === "activity" && <ActivityPage />}
      {subpage === "nutrition" && <NutritionPage />}
      {subpage === "sleep" && <SleepTab />}
      {subpage === "looks" && <HygieneTab />}
    </BodyLayout>
  );
}
