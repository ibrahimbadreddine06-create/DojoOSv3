import ComingSoon, { lockedModules } from "./coming-soon";
import { Briefcase } from "lucide-react";

export default function Business() {
  return (
    <ComingSoon
      moduleName={lockedModules.business.name}
      description={lockedModules.business.description}
      icon={<Briefcase className="h-10 w-10 text-primary" />}
    />
  );
}
