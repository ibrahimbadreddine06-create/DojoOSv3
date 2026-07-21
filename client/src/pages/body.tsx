import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { ActivityPage } from "@/components/body/activity/activity-page";
import { NutritionPage } from "@/components/body/nutrition/nutrition-page";
import { RestPage } from "@/components/body/rest/rest-page";
import { HygienePage } from "@/components/body/hygiene/hygiene-page";
import { BodyHub } from "@/components/body/body-hub";
import { BodyLayout } from "@/components/body/body-layout";
import { BodySetupWizard } from "@/components/body/body-setup-wizard";

const SETUP_SKIP_KEY = "dojo-body-setup-skipped";

export default function Body() {
  const { subpage } = useParams();
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/body-profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: subpage !== "setup",
  });

  useEffect(() => {
    if (subpage === "setup" || isLoading || profile) return;
    const skipped = window.localStorage.getItem(SETUP_SKIP_KEY) === "true";
    if (!skipped) navigate("/body/setup");
  }, [isLoading, navigate, profile, subpage]);

  if (subpage === "setup") {
    return <BodySetupWizard />;
  }

  if (isLoading || (!profile && window.localStorage.getItem(SETUP_SKIP_KEY) !== "true")) {
    return null;
  }

  return (
    <BodyLayout>
      {!subpage && <BodyHub />}
      {subpage === "activity" && <ActivityPage />}
      {subpage === "nutrition" && <NutritionPage />}
      {subpage === "sleep" && <RestPage />}
      {subpage === "looks" && <HygienePage />}
    </BodyLayout>
  );
}
