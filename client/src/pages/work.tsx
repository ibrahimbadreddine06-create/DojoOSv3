import ComingSoon, { lockedModules } from "./coming-soon";
import { Keyboard } from "lucide-react";

export default function Work() {
  return (
    <ComingSoon
      moduleName={lockedModules.work.name}
      description={lockedModules.work.description}
      icon={<Keyboard className="h-10 w-10 text-primary" />}
    />
  );
}
