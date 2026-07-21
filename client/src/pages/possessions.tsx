import ComingSoon, { lockedModules } from "./coming-soon";
import { Package } from "lucide-react";

export default function Possessions() {
  return (
    <ComingSoon
      moduleName={lockedModules.possessions.name}
      description={lockedModules.possessions.description}
      icon={<Package className="h-10 w-10 text-primary" />}
    />
  );
}
