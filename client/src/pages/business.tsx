import ComingSoon from "./coming-soon";
import { Briefcase } from "lucide-react";

export default function Business() {
  return (
    <ComingSoon
      moduleName="Business"
      description="Manage your entrepreneurial ventures, projects, and tasks."
      icon={<Briefcase className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
