'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  FileText, 
  Info, 
  IndianRupee, 
  PlusCircle, 
  Lock, 
  Loader2, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const INITIAL_SERVICES_DATA = [
  {
    id: "gi",
    title: "Groundwater Investigation",
    items: [
      { id: "gi-1", name: "Individual / Domestic", rate: 585 },
      { id: "gi-2", name: "Govt, LSGD, Institutions", rate: 1935 },
      { id: "gi-3", name: "Industrial / Commercial", rate: 3860 },
    ],
    description: [
      "Scientific assessment of groundwater availability using geophysical techniques.",
      "Site selection for Open Wells and Bore Wells based on hydrogeological data.",
      "Integration of GPS, GIS mapping, and resistivity meter (VES) findings.",
    ],
  },
  {
    id: "ds",
    title: "Drilling Services",
    items: [
      { id: "ds-1", name: "110 mm Borewell Drilling", rate: 390 },
      { id: "ds-2", name: "150 mm Borewell Drilling", rate: 665 },
      { id: "ds-3", name: "200 mm Tubewell Construction", rate: 2980 },
      { id: "ds-4", name: "Overburden Drilling (Casing)", rate: 450 },
    ],
    description: [
      "Construction of bore wells and tube wells using specialized departmental rigs.",
      "Installation of PVC/GI casing pipes as per site requirements.",
      "Suitable for Domestic, Agriculture, and Industrial deployments.",
    ],
  },
  {
    id: "yt",
    title: "Yield Testing (Pumping Test)",
    items: [
      { id: "yt-1", name: "Step Drawdown Test (SDT)", rate: 7490 },
      { id: "yt-2", name: "Constant Discharge Test (CDT)", rate: 12500 },
      { id: "yt-3", name: "Well Logging / Depth Profiling", rate: 14475 },
    ],
    description: [
      "Determining the sustainable yield and recovery parameters of the well.",
      "Analysis of drawdown data to recommend safe pumping rates.",
      "Mandatory for large-scale infrastructure and public water schemes.",
    ],
  },
  {
    id: "wq",
    title: "Water Quality Analysis",
    items: [
      { id: "wq-1", name: "Physical & Chemical Testing", rate: 1200 },
      { id: "wq-2", name: "Bacteriological (Microbial) Testing", rate: 900 },
      { id: "wq-3", name: "Heavy Metal Analysis", rate: 2500 },
    ],
    description: [
      "Comprehensive testing in regional departmental laboratories.",
      "Technical certification of potability and chemical compliance.",
      "Provides recommendations for water treatment if required.",
    ],
  },
  {
    id: "pr",
    title: "Permit & Regulation",
    items: [
      { id: "pr-1", name: "New Borewell Permit Application", rate: 500 },
      { id: "pr-2", name: "Well Conversion / Deepening Permit", rate: 750 },
      { id: "pr-3", name: "Industrial No-Objection Certificate (NOC)", rate: 5000 },
    ],
    description: [
      "Regulatory oversight to ensure sustainable groundwater usage.",
      "Mandatory processing for notified blocks and industrial zones.",
      "Verification of distance rules and local water security.",
    ],
  },
];

export default function ServicesRatesCatalog() {
  const { toast } = useToast();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [localServices, setLocalServices] = useState<any[]>([]);
  
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // 1. Persistent Cloud Settings
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'service_rates');
  }, [firestore]);

  const { data: cloudSettings, isLoading: isCloudLoading } = useDoc(settingsRef);

  useEffect(() => {
    if (cloudSettings?.services) {
      setLocalServices(cloudSettings.services);
    } else {
      setLocalServices(INITIAL_SERVICES_DATA);
    }
  }, [cloudSettings]);

  // 2. Role detection
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const isAdmin = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.role === 'admin';
  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  // 3. Handlers
  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredServices = localServices.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some((item: any) => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggleEdit = () => {
    if (!isAdmin) return;
    if (isEditMode) {
      // If turning off edit mode without saving, reset to cloud state
      setLocalServices(cloudSettings?.services || INITIAL_SERVICES_DATA);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = () => {
    if (!settingsRef || !isAdmin) return;
    setDocumentNonBlocking(settingsRef, {
      services: localServices,
      lastUpdatedBy: user?.email,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    setIsEditMode(false);
    toast({
      title: "Rates Synchronized",
      description: "Updated technical rates and scope have been saved to the cloud.",
    });
  };

  const updateItem = (serviceIdx: number, itemIdx: number, field: string, value: any) => {
    const updated = [...localServices];
    updated[serviceIdx].items[itemIdx][field] = value;
    setLocalServices(updated);
  };

  const deleteItem = (serviceIdx: number, itemIdx: number) => {
    const updated = [...localServices];
    updated[serviceIdx].items.splice(itemIdx, 1);
    setLocalServices(updated);
  };

  const addItem = (serviceIdx: number) => {
    const updated = [...localServices];
    const newId = `item-${Date.now()}`;
    updated[serviceIdx].items.push({ id: newId, name: "New Technical Item", rate: 0 });
    setLocalServices(updated);
  };

  const updateScope = (serviceIdx: number, scopeIdx: number, value: string) => {
    const updated = [...localServices];
    updated[serviceIdx].description[scopeIdx] = value;
    setLocalServices(updated);
  };

  const addScope = (serviceIdx: number) => {
    const updated = [...localServices];
    updated[serviceIdx].description.push("New technical objective...");
    setLocalServices(updated);
  };

  const deleteScope = (serviceIdx: number, scopeIdx: number) => {
    const updated = [...localServices];
    updated[serviceIdx].description.splice(scopeIdx, 1);
    setLocalServices(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 animate-in fade-in duration-700 pb-32">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* OFFICIAL HEADER */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
          <div className="bg-[#1e3a8a] p-8 text-white relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><ShieldCheck className="size-40" /></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase leading-none">
                  Services & Rates Catalog
                </h1>
                <div className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-none px-3">TECHNICAL HUB</Badge>
                  District Office, Malappuram
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button 
                    onClick={handleToggleEdit}
                    variant={isEditMode ? "destructive" : "white"}
                    className={cn(
                      "rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] gap-3 shadow-xl transition-all active:scale-95",
                      !isEditMode && "bg-white text-[#1e3a8a] hover:bg-blue-50"
                    )}
                  >
                    {isEditMode ? (
                      <><X className="size-5" /> EXIT EDITOR</>
                    ) : (
                      <><Edit3 className="size-5" /> PROVISION NEW RATE</>
                    )}
                  </Button>
                )}
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search services, items or technical parameters..."
                  className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-sm font-medium focus:ring-primary/20 shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {!isAdmin && !isAuthLoading && !isProfileLoading && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 font-black h-10 px-4 gap-2 uppercase text-[9px] tracking-widest">
                  <Lock className="size-3.5" />
                  READ ONLY
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SERVICES ACCORDION LIST */}
        <div className="space-y-4">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, sIdx) => (
              <div
                key={service.id}
                className={cn(
                  "group bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300",
                  openIndex === sIdx ? "shadow-md ring-2 ring-primary/5" : "hover:shadow-md"
                )}
              >
                {/* CATEGORY HEADER */}
                <div
                  className={cn(
                    "flex justify-between items-center p-6 cursor-pointer transition-colors",
                    openIndex === sIdx ? "bg-slate-50" : "hover:bg-slate-50/50"
                  )}
                  onClick={() => toggle(sIdx)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-all",
                      openIndex === sIdx ? "bg-[#1e3a8a] text-white scale-110 shadow-lg shadow-blue-900/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className={cn(
                        "font-black text-lg uppercase tracking-tight",
                        openIndex === sIdx ? "text-[#1e3a8a]" : "text-slate-700"
                      )}>
                        {service.title}
                      </h2>
                      {isEditMode && (
                        <span className="text-[8px] font-black text-blue-500 tracking-widest">SYSTEM NODE: {service.id}</span>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "p-2 rounded-full transition-all",
                    openIndex === sIdx ? "bg-blue-100 rotate-180" : "bg-slate-100"
                  )}>
                    <ChevronDown className={cn(
                      "h-4 w-4",
                      openIndex === sIdx ? "text-[#1e3a8a]" : "text-slate-400"
                    )} />
                  </div>
                </div>

                {/* EXPANDABLE CONTENT */}
                {openIndex === sIdx && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300 space-y-8">
                    
                    {/* SCOPE DESCRIPTION */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Scope of Work</span>
                        </div>
                        {isEditMode && (
                          <Button 
                            onClick={(e) => { e.stopPropagation(); addScope(sIdx); }} 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[8px] font-black uppercase tracking-widest gap-1.5 bg-white border shadow-sm rounded-lg"
                          >
                            <Plus className="size-3" /> ADD LINE
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {service.description.map((d: string, dIdx: number) => (
                          <div key={dIdx} className="flex items-start gap-3 group/scope">
                            <div className="mt-1.5 size-1.5 rounded-full bg-primary/30 shrink-0" />
                            {isEditMode ? (
                              <div className="flex-1 flex gap-2">
                                <Input 
                                  value={d} 
                                  onChange={(e) => updateScope(sIdx, dIdx, e.target.value)} 
                                  className="h-10 text-xs bg-white border-slate-200" 
                                />
                                <Button 
                                  onClick={() => deleteScope(sIdx, dIdx)} 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-10 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600 font-bold leading-relaxed text-justify">
                                {d}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RATES TABLE */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Technical Rate Grid</span>
                          {isEditMode && (
                            <Button 
                              onClick={() => addItem(sIdx)} 
                              size="sm" 
                              className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 bg-[#1e3a8a] rounded-xl"
                            >
                              <PlusCircle className="size-3.5" /> PROVISION ITEM
                            </Button>
                          )}
                       </div>
                       <div className="border border-slate-200 rounded-[28px] overflow-hidden shadow-sm bg-white">
                        <table className="w-full border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="h-12 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                              <th className="w-16 text-center border-r">Sl No</th>
                              <th className="px-6 text-left border-r">Technical Item / Category</th>
                              <th className="w-48 text-right pr-8">Official Rate (₹)</th>
                              {isEditMode && <th className="w-16"></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {service.items.map((item: any, iIdx: number) => (
                              <tr key={item.id} className="h-14 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group/row">
                                <td className="text-center font-black text-slate-300 text-xs border-r">{iIdx + 1}</td>
                                <td className="px-6 border-r">
                                  {isEditMode ? (
                                    <Input 
                                      value={item.name} 
                                      onChange={(e) => updateItem(sIdx, iIdx, 'name', e.target.value)}
                                      className="h-9 text-xs font-bold uppercase border-slate-200 bg-white"
                                    />
                                  ) : (
                                    <span className="text-slate-700 font-black text-xs uppercase tracking-tight">
                                      {item.name}
                                    </span>
                                  )}
                                </td>
                                <td className="text-right pr-8 border-r">
                                  {isEditMode ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-[10px] font-black text-slate-400">₹</span>
                                      <Input 
                                        type="number" 
                                        value={item.rate} 
                                        onChange={(e) => updateItem(sIdx, iIdx, 'rate', parseFloat(e.target.value) || 0)}
                                        className="h-9 w-28 text-right text-xs font-black text-blue-700 bg-white"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-black text-[#1e3a8a] text-sm tabular-nums">
                                      ₹ {item.rate.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </td>
                                {isEditMode && (
                                  <td className="p-1 text-center">
                                    <Button 
                                      onClick={() => deleteItem(sIdx, iIdx)} 
                                      variant="ghost" 
                                      size="icon" 
                                      className="size-10 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center animate-in zoom-in duration-500">
              <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No match found</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">Adjust your query or check system configurations.</p>
            </div>
          )}
        </div>

        {/* PERSISTENT ACTION FOOTER (Edit Mode Only) */}
        {isEditMode && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="rounded-[28px] border-none shadow-2xl ring-2 ring-[#1e3a8a] bg-white p-4">
               <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-4 pl-4">
                    <div className="p-2 bg-blue-50 rounded-xl"><Settings className="size-5 text-blue-600 animate-spin-slow" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Rate Management Node</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">You are currently modifying global technical rates.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={handleToggleEdit} className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400">DISCARD</Button>
                    <Button onClick={handleSaveChanges} disabled={isPending} className="h-12 px-10 rounded-2xl bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95">
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      SYNCHRONIZE TO CLOUD
                    </Button>
                  </div>
               </div>
            </Card>
          </div>
        )}

        {/* FOOTER NOTE */}
        {!isEditMode && (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-[32px] border border-slate-200 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
              <Info className="h-6 w-6 text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Compliance</p>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                All rates are established under official departmental mandates and subject to periodic government review. 
                Management of these records is restricted to authorized district administrators via the Technical Hub.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

