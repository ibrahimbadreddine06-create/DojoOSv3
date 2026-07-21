import ComingSoon, { lockedModules } from "./coming-soon";
import { Compass } from "lucide-react";

export default function Worship() {
  return (
    <ComingSoon
      moduleName={lockedModules.worship.name}
      description={lockedModules.worship.description}
      icon={<Compass className="h-10 w-10 text-primary" />}
    />
  );
}
