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
            <div className="px-6 py-4 bg-purple-500/5 border-b border-purple-500/10">
              <TabsList className="grid grid-cols-5 w-full bg-transparent gap-2 h-auto">
                <LogTypeTrigger value="food" icon={<Utensils className="w-4 h-4" />} label="Food" active={selectedType === "food"} />
                <LogTypeTrigger value="water" icon={<Droplets className="w-4 h-4" />} label="Water" active={selectedType === "water"} />
                <LogTypeTrigger value="supplement" icon={<Zap className="w-4 h-4" />} label="Supp" active={selectedType === "supplement"} />
                <LogTypeTrigger value="medication" icon={<Pill className="w-4 h-4" />} label="Med" active={selectedType === "medication"} />
                <LogTypeTrigger value="other" icon={<ChevronRight className="w-4 h-4" />} label="Misc" active={selectedType === "other"} />
              </TabsList>
            </div>

            <div className="p-6 h-[450px] overflow-y-auto custom-scrollbar">
              <TabsContent value="food" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
                      )}
                    </div>
                    <Input 
                      placeholder="Search food or scan barcode..." 
                      className="pl-10 h-12 bg-muted/30 border-2 border-transparent focus-visible:ring-0 focus-visible:border-purple-500/50 transition-all font-bold text-sm" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-500/10 rounded-lg text-muted-foreground hover:text-purple-600 transition-colors">
                      <Barcode className="w-5 h-5" />
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      {searchResults.map((p: any) => (
                        <div 
                          key={p._id} 
                          className="p-3 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-white hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer flex justify-between items-center group"
                          onClick={() => logMutation.mutate({ 
                            mealName: p.product_name, 
                            mealType: "snack", 
                            calories: p.nutriments?.["energy-kcal_100g"] || 0,
                            protein: p.nutriments?.proteins_100g || 0,
                            carbs: p.nutriments?.carbohydrates_100g || 0,
                            fats: p.nutriments?.fat_100g || 0,
                            fiber: p.nutriments?.fiber_100g || 0,
                            sugar: p.nutriments?.sugars_100g || 0,
                            sodium: p.nutriments?.sodium_100g ? p.nutriments.sodium_100g * 1000 : 0, // Convert g to mg
                            imageUrl: p.image_front_small_url
                          })}
                        >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border shadow-sm overflow-hidden flex items-center justify-center p-1">
                                {p.image_front_small_url ? <img src={p.image_front_small_url} alt="" className="w-full h-full object-contain" /> : <Utensils className="w-5 h-5 opacity-20" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-black tracking-tight line-clamp-1">{p.product_name || "Unknown Product"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground">{p.brands || "Food Item"}</p>
                              </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black font-mono text-purple-600">{Math.round(p.nutriments?.["energy-kcal_100g"] || 0)}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground/50 ml-0.5">kcal</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!searchQuery && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-24 flex-col gap-2 border-2 border-dashed bg-purple-500/[0.02] hover:bg-purple-500/5 hover:border-purple-500/40 hover:text-purple-600 transition-all group rounded-2xl"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoMutation.isPending}
                      >
                        <div className="p-3 rounded-xl bg-purple-100/50 group-hover:scale-110 transition-transform">
                          {photoMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin text-purple-600" /> : <Camera className="w-6 h-6 text-purple-600" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{photoMutation.isPending ? "Analyzing..." : "Analyze Photo"}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-24 flex-col gap-2 border-2 border-dashed bg-purple-500/[0.02] hover:bg-purple-500/5 hover:border-purple-500/40 hover:text-purple-600 transition-all group rounded-2xl"
                        onClick={() => setDescribeMode(true)}
                      >
                        <div className="p-3 rounded-xl bg-purple-100/50 group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Describe Meal</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Macro Presets */}
                {!searchQuery && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Quick Add Macros
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                       <MacroQuickAdd label="Prot" color="bg-blue-500" onAdd={() => logMutation.mutate({ mealName: "Extra Protein", protein: 10, calories: 40 })} />
                       <MacroQuickAdd label="Carb" color="bg-amber-500" onAdd={() => logMutation.mutate({ mealName: "Extra Carbs", carbs: 15, calories: 60 })} />
                       <MacroQuickAdd label="Fat" color="bg-pink-500" onAdd={() => logMutation.mutate({ mealName: "Extra Fat", fats: 5, calories: 45 })} />
                       <MacroQuickAdd label="Fib" color="bg-teal-500" onAdd={() => logMutation.mutate({ mealName: "Fiber Boost", fiber: 5, calories: 10 })} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
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
                      className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition-all group"
                      onClick={() => logMutation.mutate({ mealName: "Water", mealType: "water", water: amt, calories: 0, protein: 0, carbs: 0, fats: 0 })}
                    >
                      <div className="p-3 rounded-xl bg-blue-100/50 group-hover:scale-110 transition-transform">
                        <Droplets className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-lg font-black tracking-tighter">{amt}ml</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="supplement" className="mt-0 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                    <Zap className="w-3 h-3 text-amber-500" /> From Your Routines
                  </h4>
                  <div className="space-y-2">
                    {/* Filtered routines would go here */}
                    <div className="p-4 border-2 border-dashed rounded-2xl text-center text-[10px] font-bold text-muted-foreground/50 py-10">
                      Routines integration pending...
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medication" className="mt-0 space-y-4">
                 <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                    <Pill className="w-3 h-3 text-red-500" /> Prescribed Routines
                  </h4>
                  <div className="space-y-2">
                    <div className="p-4 border-2 border-dashed rounded-2xl text-center text-[10px] font-bold text-muted-foreground/50 py-10">
                      Routines integration pending...
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="other" className="mt-0 space-y-4">
                <div className="p-8 text-center italic text-muted-foreground/60 text-xs">
                  Quick-log other items like coffee, tea, or custom snacks.
                </div>
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

function MacroQuickAdd({ label, color, onAdd }: { label: string, color: string, onAdd: () => void }) {
  return (
    <button 
      onClick={onAdd}
      className={`p-2.5 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-white hover:border-purple-500/20 hover:shadow-md transition-all flex flex-col items-center gap-1 group`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-purple-600 transition-colors">+{label}</span>
    </button>
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
