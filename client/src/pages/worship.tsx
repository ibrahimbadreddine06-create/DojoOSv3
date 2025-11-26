import ComingSoon from "./coming-soon";
import { Heart } from "lucide-react";

export default function Worship() {
  return (
    <ComingSoon
      moduleName="Worship"
      description="Log your prayers, Quran reading, dhikr, and duas to strengthen your spiritual practice."
      icon={<Heart className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
