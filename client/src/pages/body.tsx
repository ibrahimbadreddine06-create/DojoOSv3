import ComingSoon from "./coming-soon";
import { Dumbbell } from "lucide-react";

export default function Body() {
  return (
    <ComingSoon
      moduleName="Body"
      description="Track your fitness, nutrition, sleep, and hygiene routines to optimize your physical well-being."
      icon={<Dumbbell className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
