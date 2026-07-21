import ComingSoon, { lockedModules } from "./coming-soon";
import { Heart } from "lucide-react";

export default function SocialPurpose() {
  return (
    <ComingSoon
      moduleName={lockedModules.socialPurpose.name}
      description={lockedModules.socialPurpose.description}
      icon={<Heart className="h-10 w-10 text-primary" />}
    />
  );
}
