import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function HygieneDrilldown() {
  const [, params] = useRoute("/body/looks/metric/:metricKey");
  const [, navigate] = useLocation();

  const metricKey = params?.metricKey;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl min-h-screen pb-24 animate-in fade-in duration-700 space-y-8">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/body/looks")}
          className="rounded-xl w-10 h-10 border-border/60 hover:bg-muted/30"
        >
          <ChevronLeft className="w-5 h-5 opacity-70" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight capitalize">
            {metricKey?.replace(/([A-Z])/g, " $1").trim()} Detail
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical trends and detailed analysis
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/40 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 opacity-40 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-muted-foreground/80">Historical Data Coming Soon</p>
        <p className="text-sm text-muted-foreground/50 mt-1 max-w-xs text-center">
          Detailed temporal graphs and analysis for {metricKey?.replace(/([A-Z])/g, " $1").trim().toLowerCase()} are being developed.
        </p>
      </div>
    </div>
  );
}
