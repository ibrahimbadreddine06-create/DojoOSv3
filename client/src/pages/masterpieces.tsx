import ComingSoon, { lockedModules } from "./coming-soon";
import { Palette } from "lucide-react";

export default function Masterpieces() {
  return (
    <ComingSoon
      moduleName={lockedModules.masterpieces.name}
      description={lockedModules.masterpieces.description}
      icon={<Palette className="h-10 w-10 text-primary" />}
    />
  );
}
