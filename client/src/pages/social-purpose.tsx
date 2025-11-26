import ComingSoon from "./coming-soon";
import { Users } from "lucide-react";

export default function SocialPurpose() {
  return (
    <ComingSoon
      moduleName="Social Purpose"
      description="Track your community involvement, networking, and legacy-building activities."
      icon={<Users className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
