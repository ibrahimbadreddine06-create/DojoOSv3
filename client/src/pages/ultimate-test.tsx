import ComingSoon from "./coming-soon";
import { Trophy } from "lucide-react";

export default function UltimateTest() {
  return (
    <ComingSoon
      moduleName="Ultimate Test"
      description="Take comprehensive assessments to measure your overall life mastery."
      icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
