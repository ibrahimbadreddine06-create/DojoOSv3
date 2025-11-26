import ComingSoon from "./coming-soon";
import { Briefcase } from "lucide-react";

export default function Work() {
  return (
    <ComingSoon
      moduleName="Work"
      description="Organize your professional projects and career development tasks."
      icon={<Briefcase className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
