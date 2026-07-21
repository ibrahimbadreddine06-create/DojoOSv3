import ComingSoon, { lockedModules } from "./coming-soon";
import { Coins } from "lucide-react";

export default function Finances() {
  return (
    <ComingSoon
      moduleName={lockedModules.finances.name}
      description={lockedModules.finances.description}
      icon={<Coins className="h-10 w-10 text-primary" />}
    />
  );
}
