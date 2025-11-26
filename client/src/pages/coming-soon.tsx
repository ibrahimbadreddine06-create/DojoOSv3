import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ComingSoonProps {
  moduleName: string;
  description: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ moduleName, description, icon }: ComingSoonProps) {
  return (
    <div className="container max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                {icon}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                <Lock className="h-4 w-4 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" data-testid="text-coming-soon-title">
                {moduleName}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {description}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Lock className="h-4 w-4" />
              Coming Soon
            </div>

            <p className="text-sm text-muted-foreground">
              This module is currently in development. Stay tuned for updates!
            </p>

            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const lockedModules = {
  body: {
    name: "Body",
    description: "Track your fitness, nutrition, sleep, and hygiene routines to optimize your physical well-being.",
  },
  worship: {
    name: "Worship",
    description: "Log your prayers, Quran reading, dhikr, and duas to strengthen your spiritual practice.",
  },
  finances: {
    name: "Finances",
    description: "Monitor your income, expenses, and savings to achieve financial freedom.",
  },
  masterpieces: {
    name: "Masterpieces",
    description: "Create and organize your creative works, from writing to art projects.",
  },
  possessions: {
    name: "Possessions",
    description: "Catalog your belongings, track wishlist items, and manage your wardrobe.",
  },
  business: {
    name: "Business",
    description: "Manage your entrepreneurial ventures, projects, and tasks.",
  },
  work: {
    name: "Work",
    description: "Organize your professional projects and career development tasks.",
  },
  socialPurpose: {
    name: "Social Purpose",
    description: "Track your community involvement, networking, and legacy-building activities.",
  },
  disciplines: {
    name: "Disciplines",
    description: "Master specialized skills and habits through structured practice routines.",
  },
  ultimateTest: {
    name: "Ultimate Test",
    description: "Take comprehensive assessments to measure your overall life mastery.",
  },
};
