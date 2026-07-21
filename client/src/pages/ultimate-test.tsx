import ComingSoon, { lockedModules } from "./coming-soon";
import { Trophy } from "lucide-react";

export default function UltimateTest() {
  return (
    <ComingSoon
      moduleName={lockedModules.ultimateTest.name}
      description={lockedModules.ultimateTest.description}
      icon={<Trophy className="h-10 w-10 text-primary" />}
    />
  );
}
