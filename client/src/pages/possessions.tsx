import ComingSoon from "./coming-soon";
import { Home } from "lucide-react";

export default function Possessions() {
  return (
    <ComingSoon
      moduleName="Possessions"
      description="Catalog your belongings, track wishlist items, and manage your wardrobe."
      icon={<Home className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
