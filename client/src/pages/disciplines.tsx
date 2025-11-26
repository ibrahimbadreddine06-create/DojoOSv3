import ComingSoon from "./coming-soon";
import { Award } from "lucide-react";

export default function Disciplines() {
  return (
    <ComingSoon
      moduleName="Disciplines"
      description="Master specialized skills and habits through structured practice routines."
      icon={<Award className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
