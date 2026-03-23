import React, { useState, useEffect, useRef } from "react";
import { 
  X, Search, Camera, MessageSquare, Droplets, Zap, Pill, 
  Utensils, ChevronRight, Check, History, Loader2, Barcode, Trash2, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LogIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBlockId?: string | null;
}

type IntakeType = "food" | "water" | "supplement" | "medication" | "other";

export function LogIntakeModal({ isOpen, onClose, preselectedBlockId }: LogIntakeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedType, setSelectedType] = useState<IntakeType>("food");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [describeMode, setDescribeMode] = useState(false);
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const logMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/intake-logs", {
        ...data,
        date: today,
        linkedBlockId: preselectedBlockId || data.linkedBlockId,
        mealType: data.mealType || "snack"
      });
      return res.json();
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [`/api/intake-logs/${today}`] });
       toast({ title: "Logged successfully", description: "Your intake has been recorded." });
       resetFlow();
       onClose();
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (desc: string) => {
      const res = await apiRequest("POST", "/api/nutrition/analyze-description", { description: desc });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    }
  });

  const photoMutation = useMutation({
    mutationFn: async (base64: string) => {
      const res = await apiRequest("POST", "/api/nutrition/analyze-photo", { image: base64 });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    }
  });

  const resetFlow = () => {
    setDescribeMode(false);
    setDescription("");
    setAnalysisResult(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Open Food Facts Search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1&page_size=5`);
        const data = await response.json();
        setSearchResults(data.products || []);
      } catch (err) {
        console.error("OFF Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      photoMutation.mutate(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if(!v) { resetFlow(); onClose(); } }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-2xl">
        <div className="p-6 bg-purple-600 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white mb-2">Log Intake</DialogTitle>
            <DialogDescription className="text-purple-100/70 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
              {preselectedBlockId ? "Logging for specific planner block" : "Fuel your performance"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {analysisResult ? (
          <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
             <div className="p-4 bg-muted/50 rounded-2xl border-2 border-purple-500/20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-2">AI Analysis</h3>
                <p className="text-xl font-black tracking-tight">{analysisResult.mealName}</p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                   <MetricBox label="KCAL" value={analysisResult.calories} />
                   <MetricBox label="P" value={analysisResult.protein} unit="g" />
                   <MetricBox label="C" value={analysisResult.carbs} unit="g" />
                   <MetricBox label="F" value={analysisResult.fats} unit="g" />
                </div>
                <div className="flex flex-wrap gap-1 mt-4">
                   {analysisResult.fuelCategories?.map((c: string) => (
                     <span key={c} className="text-[8px] font-black uppercase bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20">{c}</span>
                   ))}
                </div>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" className="flex-1 font-black uppercase tracking-widest text-[10px]" onClick={() => setAnalysisResult(null)}>Edit / Retake</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 font-black uppercase tracking-widest text-[10px]" onClick={() => logMutation.mutate(analysisResult)}>Confirm & Log</Button>
             </div>
          </div>
        ) : describeMode ? (
          <div className="p-6 space-y-4 animate-in slide-in-from-right duration-300">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Describe your meal</label>
                <Textarea 
                  placeholder="e.g. 2 scrambled eggs, a slice of whole wheat toast, and half an avocado..." 
                  className="h-32 bg-muted/50 border-none focus-visible:ring-purple-500 text-sm font-bold resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
                <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px]" onClick={() => setDescribeMode(false)}>Back</Button>
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 font-black uppercase tracking-widest text-[10px] gap-2"
                  disabled={!description || analyzeMutation.isPending}
                  onClick={() => analyzeMutation.mutate(description)}
                >
                  {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Analyze with AI
                </Button>
             </div>
          </div>
        ) : (
          <Tabs defaultValue="food" className="w-full" onValueChange={(v) => setSelectedType(v as IntakeType)}>
            <div className="px-6 py-4 bg-muted/30 border-b">
              <TabsList className="grid grid-cols-5 w-full bg-transparent gap-2 h-auto">
                <LogTypeTrigger value="food" icon={<Utensils className="w-4 h-4" />} label="Food" active={selectedType === "food"} />
                <LogTypeTrigger value="water" icon={<Droplets className="w-4 h-4" />} label="Water" active={selectedType === "water"} />
                <LogTypeTrigger value="supplement" icon={<Zap className="w-4 h-4" />} label="Supp" active={selectedType === "supplement"} />
                <LogTypeTrigger value="medication" icon={<Pill className="w-4 h-4" />} label="Med" active={selectedType === "medication"} />
                <LogTypeTrigger value="other" icon={<ChevronRight className="w-4 h-4" />} label="Misc" active={selectedType === "other"} />
              </TabsList>
            </div>

            <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
              <TabsContent value="food" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    {isSearching ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input 
                      placeholder="Search food or scan barcode..." 
                      className="pl-10 h-12 bg-muted/50 border-none focus-visible:ring-purple-500" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {searchResults.map((p: any) => (
                        <div 
                          key={p._id} 
                          className="p-3 rounded-xl border bg-card hover:border-purple-500 transition-all cursor-pointer flex justify-between items-center group"
                          onClick={() => logMutation.mutate({ 
                            mealName: p.product_name, 
                            mealType: "snack", 
                            calories: p.nutriments?.["energy-kcal_100g"] || 0,
                            protein: p.nutriments?.proteins_100g || 0,
                            carbs: p.nutriments?.carbohydrates_100g || 0,
                            fats: p.nutriments?.fat_100g || 0,
                            imageUrl: p.image_front_small_url
                          })}
                        >
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-muted overflow-hidden">
                                {p.image_front_small_url ? <img src={p.image_front_small_url} alt="" className="w-full h-full object-cover" /> : <Utensils className="w-4 h-4 m-2 opacity-20" />}
                              </div>
                              <p className="text-[11px] font-black tracking-tight line-clamp-1">{p.product_name}</p>
                          </div>
                          <span className="text-[10px] font-black font-mono">{p.nutriments?.["energy-kcal_100g"] || 0} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 border-dashed border-2 hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 transition-all group"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoMutation.isPending}
                    >
                      {photoMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{photoMutation.isPending ? "Analyzing..." : "Take Photo"}</span>
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 border-dashed border-2 hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 transition-all group"
                      onClick={() => setDescribeMode(true)}
                    >
                      <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Describe Meal</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <History className="w-3 h-3" /> Recent Items
                  </h4>
                  <div className="space-y-2">
                    <RecentItem name="Whey Isolate" kCal={120} macros="P: 25g • C: 2g • F: 1g" onAdd={() => logMutation.mutate({ mealName: "Whey Isolate", mealType: "snack", calories: 120, protein: 25, carbs: 2, fats: 1 })} />
                    <RecentItem name="Oats & Blueberries" kCal={350} macros="P: 10g • C: 60g • F: 5g" onAdd={() => logMutation.mutate({ mealName: "Oats & Blueberries", mealType: "breakfast", calories: 350, protein: 10, carbs: 60, fats: 5 })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="water" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[250, 500, 750, 1000].map(amt => (
                    <Button 
                      key={amt} 
                      variant="outline" 
                      className="h-24 flex-col gap-2 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 text-lg font-black"
                      onClick={() => logMutation.mutate({ mealName: "Water", mealType: "water", water: amt, calories: 0, protein: 0, carbs: 0, fats: 0 })}
                    >
                      <Droplets className="w-6 h-6 text-blue-500" />
                      {amt}ml
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="supplement" className="mt-0 text-center py-10 text-muted-foreground italic text-xs">
                No supplements available to log from routines.
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogTypeTrigger({ value, icon, label, active }: { value: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <TabsTrigger value={value} className={`flex-col h-16 gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all ${active ? "text-purple-600" : "text-muted-foreground/60"}`}>
       <div className={`p-2 rounded-lg ${active ? "bg-purple-100/50" : "bg-muted/50"}`}>{icon}</div>
       <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
    </TabsTrigger>
  );
}

function RecentItem({ name, kCal, macros, onAdd }: { name: string, kCal: number, macros: string, onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border hover:bg-muted/50 transition-colors group">
      <div>
        <p className="text-sm font-black tracking-tight">{name}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">{macros}</p>
      </div>
      <div className="flex items-center gap-4">
         <span className="text-xs font-black font-mono">{kCal} kcal</span>
         <Button size="icon" variant="ghost" className="h-8 w-8 text-purple-600 hover:bg-purple-100/50" onClick={onAdd}>
            <Check className="w-4 h-4" />
         </Button>
      </div>
    </div>
  );
}

function MetricBox({ label, value, unit = "" }: { label: string, value: number, unit?: string }) {
  return (
    <div className="p-2 bg-muted/30 rounded-lg border text-center">
       <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">{label}</div>
       <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-sm font-black">{Math.round(value)}</span>
          <span className="text-[8px] text-muted-foreground/50 font-bold uppercase">{unit}</span>
       </div>
    </div>
  );
}
