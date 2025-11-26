import ComingSoon from "./coming-soon";
import { Star } from "lucide-react";

export default function Masterpieces() {
  return (
    <ComingSoon
      moduleName="Masterpieces"
      description="Create and organize your creative works, from writing to art projects."
      icon={<Star className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
