import { WorkoutTab } from "@/components/body/workout-tab";
import { IntakeTab } from "@/components/body/intake-tab";
import { SleepTab } from "@/components/body/sleep-tab";
import { HygieneTab } from "@/components/body/hygiene-tab";
import { useLocation, useParams } from "wouter";
import { BodyHub } from "@/components/body/body-hub";
import { BodyLayout } from "@/components/body/body-layout";

export default function Body() {
  const { subpage } = useParams();

  // If no subpage, show the Hub
  if (!subpage) {
    return <BodyHub />;
  }

  // If subpage exists, wrap content in BodyLayout
  return (
    <BodyLayout>
      {subpage === "workout" && <WorkoutTab />}
      {subpage === "intake" && <IntakeTab />}
      {subpage === "sleep" && <SleepTab />}
      {subpage === "hygiene" && <HygieneTab />}
    </BodyLayout>
  );
}
