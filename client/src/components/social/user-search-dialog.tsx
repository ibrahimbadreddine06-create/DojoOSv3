import { Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * Kept as a compatibility wrapper for both sidebar variants.
 * Discovery now has one canonical home instead of a second modal flow.
 */
export function UserSearchDialog() {
  const [location] = useLocation();
  return (
    <Button
      asChild
      variant="ghost"
      className={`mb-2 w-full justify-start gap-2 ${location === "/social" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Link href="/social">
        <Users className="h-4 w-4" />
        <span>People</span>
      </Link>
    </Button>
  );
}
