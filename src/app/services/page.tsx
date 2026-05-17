'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { 
  ChevronDown, 
  Search, 
  IndianRupee, 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Save, 
  Plus,
  ShieldCheck,
  Settings,
  History,
  CheckCircle2,
  Copy,
  Info,
  Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      { id: "gi-1", nameEn: "Individual / Domestic", nameMl: "വ്യക്തിഗത / ഗാർഹികം", rate: 585, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "gi-2", nameEn: "Govt, LSGD, Institutions", nameMl: "സർക്കാർ, തദ്ദേശ സ്വയംഭരണം, സ്ഥാപനങ്ങൾ", rate: 1935, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "gi-3", nameEn: "Industrial / Commercial", nameMl: "വ്യവസായം / വാണിജ്യം", rate: 3860, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
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
      { id: "ds-1", nameEn: "110 mm dia കുഴല്‍കിണര്‍ ഡ്രില്ലിംഗ് ചാര്‍ജ് ", nameMl: "110 മില്ലിമീറ്റർ വ്യാസമുള്ള കുഴൽക്കിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്ജ്", rate: 390, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "ds-2", nameEn: "140 mm dia 6 kg/cm2 പി. വി.സി. കേയ്സിംഗ് പൈപ്പിന്റെ വില ", nameMl: "140 മില്ലിമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം / ച. സെ. മി. പിവിസി കെയ്‌സിംഗ് പൈപ്പിന്റെ വില", rate: 566.56, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "ds-3", nameEn: "140 mm dia 10 kg/cm2 പി. വി.സി. കേയ്സിംഗ് പൈപ്പിന്റെ വില ", nameMl: "140 മില്ലിമീറ്റർ വ്യാസമുള്ള 10 കി.ഗ്രാം / ച. സെ. മി. പിവിസി കെയ്‌സിംഗ് പൈപ്പിന്റെ വില", rate: 879.01, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "ds-4", nameEn: "140 mm dia ഏന്‍ഡ് ക്യാപ്പിന്റെ വില", nameMl: "140 മില്ലിമീറ്റർ വ്യാസമുള്ള പിവിസി കുഴൽക്കിണർ അടപ്പിന്റെ വില", rate: 87.59, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
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
      { id: "yt-1", nameEn: "Step Drawdown Test (SDT)", nameMl: "സ്റ്റെപ്പ് ഡ്രോഡൗൺ ടെസ്റ്റ് (SDT)", rate: 7490, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
      { id: "yt-2", nameEn: "Borewell Flushing", nameMl: "ഫ്ലഷിംഗ് നടത്തിയ ആകെ ആഴം", rate: 5790, dateFrom: '2024-04-01', dateTo: '2025-03-31' },
    ],
    description: [
      "Determining the sustainable yield and recovery parameters of the well.",
      "Analysis of drawdown data to recommend safe pumping rates.",
      "Mandatory for large-scale infrastructure and public water schemes.",
    ],
  },
  {
    id: "gst",
    title: "GST Configurations",
    items: [
      { id: "gst-1", nameEn: "Standard Technical GST", nameMl: "സാധാരണ സാങ്കേതിക ജിഎസ്ടി", gstPercentage: 18, conditions: "Applicable on all technical survey and construction charges.", dateFrom: '2024-04-01', dateTo: '' },
    ],
    description: ["Goods and Services Tax percentages for departmental technical works as per latest Government orders."],
  },
];

export default function ServicesRatesCatalog() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'service_rates');
  }, [firestore]);

  const { data: cloudSettings, isLoading: isCloudLoading } = useDoc(settingsRef);

  useEffect(() => {
    if (cloudSettings?.services) {
      // Ensure that any new categories added to INITIAL_SERVICES_DATA (like 'gst')
      // are merged into the local state if they are missing from cloud settings.
      const cloudData = cloudSettings.services;
      const missingFromCloud = INITIAL_SERVICES_DATA.filter(
        initial => !cloudData.some((c: any) => c.id === initial.id)
      );
      
      if (missingFromCloud.length > 0) {
        setLocalServices([...cloudData, ...missingFromCloud]);
        // Mark as dirty so user can save the newly added sections to cloud
        setIsDirty(true);
      } else {
        setLocalServices(cloudData);
      }
    } else if (!isCloudLoading) {
      setLocalServices(INITIAL_SERVICES_DATA);
    }
  }, [cloudSettings, isCloudLoading]);

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

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const isItemActive = (item: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (!item.dateTo) return true;
    return item.dateTo >= today;
  };

  const filteredServices = useMemo(() => {
    return localServices.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.items.some((item: any) => 
        (item.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nameMl || '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [localServices, search]);

  const handleSaveChanges = () => {
    if (!settingsRef || !isAdmin) return;
    
    startTransition(() => {
      setDocumentNonBlocking(settingsRef, {
        services: localServices,
        lastUpdatedBy: user?.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setIsDirty(false);
      toast({
        title: "Rates Synchronized",
        description: "Updated technical rates and effective dates have been saved.",
      });
    });
  };

  const updateItem = (serviceId: string, itemId: string, field: string, value: any) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;
    
    const itemIdx = updated[serviceIdx].items.findIndex((i: any) => i.id === itemId);
    if (itemIdx === -1) return;

    updated[serviceIdx].items[itemIdx][field] = value;
    setLocalServices(updated);
    setIsDirty(true);
  };

  const deleteItem = (serviceId: string, itemId: string) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    updated[serviceIdx].items = updated[serviceIdx].items.filter((i: any) => i.id !== itemId);
    setLocalServices(updated);
    setIsDirty(true);
  };

  const addItem = (serviceId: string) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    const newId = `item-${Date.now()}`;
    const baseItem: any = { 
      id: newId, 
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: ''
    };

    if (serviceId === 'gst') {
      updated[serviceIdx].items.push({ 
        ...baseItem,
        nameEn: "NEW GST ITEM (EN)", 
        nameMl: "പുതിയ ജിഎസ്ടി ഐറ്റം (ML)",
        gstPercentage: 18,
        conditions: "As per departmental norms"
      });
    } else {
      updated[serviceIdx].items.push({ 
        ...baseItem,
        nameEn: "NEW TECHNICAL ITEM (EN)", 
        nameMl: "പുതിയ ഐറ്റം (ML)",
        rate: 0
      });
    }
    setLocalServices(updated);
    setIsDirty(true);
  };

  const copyItem = (serviceId: string, itemToCopy: any) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    const newId = `item-${Date.now()}`;
    updated[serviceIdx].items.push({ 
      ...itemToCopy,
      id: newId,
      dateTo: '' 
    });
    setLocalServices(updated);
    setIsDirty(true);
  };

  const updateScope = (serviceId: string, scopeIdx: number, value: string) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    updated[serviceIdx].description[scopeIdx] = value;
    setLocalServices(updated);
    setIsDirty(true);
  };

  const addScope = (serviceId: string) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    updated[serviceIdx].description.push("New technical objective...");
    setLocalServices(updated);
    setIsDirty(true);
  };

  const deleteScope = (serviceId: string, scopeIdx: number) => {
    if (!isAdmin) return;
    const updated = JSON.parse(JSON.stringify(localServices));
    const serviceIdx = updated.findIndex((s: any) => s.id === serviceId);
    if (serviceIdx === -1) return;

    updated[serviceIdx].description.splice(scopeIdx, 1);
    setLocalServices(updated);
    setIsDirty(true);
  };

  if (isCloudLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 animate-in fade-in duration-700 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
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
            </div>
          </div>
          
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search current and historical technical rates (English or Malayalam)..."
                  className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-sm font-medium focus:ring-primary/20 shadow-inner"
                  value={search || ""}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {!isAdmin && !isAuthLoading && !isProfileLoading && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 h-10 px-4 gap-2 font-black uppercase text-[9px] tracking-widest shadow-sm">
                  <CheckCircle2 className="size-3.5" />
                  TECHNICAL VIEW ACTIVE
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SERVICES ACCORDION LIST */}
        <div className="space-y-4">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, sIdx) => {
              const activeItems = service.items.filter((i: any) => isItemActive(i));
              const previousItems = service.items.filter((i: any) => !isItemActive(i));
              const isGstSection = service.id === 'gst';

              return (
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
                        {isGstSection ? <Percent className="h-5 w-5" /> : <IndianRupee className="h-5 w-5" />}
                      </div>
                      <h2 className={cn(
                        "font-black text-lg uppercase tracking-tight",
                        openIndex === sIdx ? "text-[#1e3a8a]" : "text-slate-700"
                      )}>
                        {service.title}
                      </h2>
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
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Technical Scope</span>
                          </div>
                          {isAdmin && (
                            <Button 
                              onClick={(e) => { e.stopPropagation(); addScope(service.id); }} 
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
                              {isAdmin ? (
                                <div className="flex-1 flex gap-2">
                                  <Input 
                                    value={d || ""} 
                                    onChange={(e) => updateScope(service.id, dIdx, e.target.value)} 
                                    className="h-10 text-xs bg-white border-slate-200" 
                                  />
                                  <Button 
                                    onClick={() => deleteScope(service.id, dIdx)} 
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

                      {/* ACTIVE RATES SECTION */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em]">Active Technical {isGstSection ? 'GST' : 'Rates'}</span>
                          </div>
                          {isAdmin && (
                            <Button 
                              onClick={() => addItem(service.id)} 
                              size="sm" 
                              className="h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2 bg-[#1e3a8a] text-white rounded-xl shadow-lg shadow-blue-900/10 hover:bg-blue-900"
                            >
                              <PlusCircle className="size-4" /> {isGstSection ? 'ADD GST DATA' : 'ADD TECHNICAL ITEM'}
                            </Button>
                          )}
                        </div>
                        <div className="border border-slate-200 rounded-[28px] overflow-hidden shadow-sm bg-white">
                          <table className="w-full border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr className="h-12 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                <th className="w-12 text-center border-r">Sl</th>
                                <th className="px-6 text-left border-r min-w-[150px]">Technical Item (English)</th>
                                <th className="px-6 text-left border-r min-w-[150px]">Technical Item (Malayalam)</th>
                                {isGstSection ? (
                                  <>
                                    <th className="w-24 text-center border-r">GST %</th>
                                    <th className="px-6 text-left border-r min-w-[150px]">Conditions</th>
                                  </>
                                ) : (
                                  <th className="w-32 text-right pr-6 border-r">Rate (₹)</th>
                                )}
                                <th className="w-32 text-center border-r">From</th>
                                <th className="w-32 text-center border-r">To</th>
                                {isAdmin && <th className="w-24">Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {activeItems.length > 0 ? activeItems.map((item: any, iIdx: number) => (
                                <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                                  <td className="text-center font-black text-slate-300 text-[10px] border-r">{iIdx + 1}</td>
                                  <td className="px-6 border-r">
                                    {isAdmin ? (
                                      <Input 
                                        value={item.nameEn || ""} 
                                        onChange={(e) => updateItem(service.id, item.id, 'nameEn', e.target.value)}
                                        className="h-8 text-xs border-slate-200 bg-white"
                                      />
                                    ) : (
                                      <span className="text-slate-700 font-bold text-xs uppercase">{item.nameEn}</span>
                                    )}
                                  </td>
                                  <td className="px-6 border-r">
                                    {isAdmin ? (
                                      <Input 
                                        value={item.nameMl || ""} 
                                        onChange={(e) => updateItem(service.id, item.id, 'nameMl', e.target.value)}
                                        className="h-8 text-xs font-bold border-slate-200 bg-white"
                                      />
                                    ) : (
                                      <span className="text-slate-700 font-bold text-xs">{item.nameMl}</span>
                                    )}
                                  </td>
                                  {isGstSection ? (
                                    <>
                                      <td className="w-24 text-center border-r">
                                        {isAdmin ? (
                                          <Input 
                                            type="number" 
                                            value={item.gstPercentage ?? 0} 
                                            onChange={(e) => updateItem(service.id, item.id, 'gstPercentage', parseInt(e.target.value) || 0)}
                                            className="h-8 w-16 text-center text-xs font-black text-blue-700 bg-white mx-auto"
                                          />
                                        ) : (
                                          <span className="font-black text-[#1e3a8a] text-xs">{item.gstPercentage}%</span>
                                        )}
                                      </td>
                                      <td className="px-6 border-r">
                                        {isAdmin ? (
                                          <Input 
                                            value={item.conditions || ""} 
                                            onChange={(e) => updateItem(service.id, item.id, 'conditions', e.target.value)}
                                            className="h-8 text-xs border-slate-200 bg-white"
                                          />
                                        ) : (
                                          <span className="text-slate-500 font-medium text-xs italic">{item.conditions}</span>
                                        )}
                                      </td>
                                    </>
                                  ) : (
                                    <td className="text-right pr-6 border-r">
                                      {isAdmin ? (
                                        <Input 
                                          type="number" 
                                          value={item.rate ?? 0} 
                                          onChange={(e) => updateItem(service.id, item.id, 'rate', parseFloat(e.target.value) || 0)}
                                          className="h-8 w-24 text-right text-xs font-black text-blue-700 bg-white"
                                        />
                                      ) : (
                                        <span className="font-black text-[#1e3a8a] text-xs">₹{item.rate.toLocaleString('en-IN')}</span>
                                      )}
                                    </td>
                                  )}
                                  <td className="border-r px-2">
                                     {isAdmin ? (
                                       <Input type="date" value={item.dateFrom || ''} onChange={(e) => updateItem(service.id, item.id, 'dateFrom', e.target.value)} className="h-8 text-[9px] px-1 border-slate-200" />
                                     ) : (
                                       <span className="text-[9px] font-bold text-slate-500 block text-center">{item.dateFrom || '---'}</span>
                                     )}
                                  </td>
                                  <td className="border-r px-2">
                                     {isAdmin ? (
                                       <Input type="date" value={item.dateTo || ''} onChange={(e) => updateItem(service.id, item.id, 'dateTo', e.target.value)} className="h-8 text-[9px] px-1 border-slate-200" />
                                     ) : (
                                       <span className="text-[9px] font-bold text-slate-500 block text-center">{item.dateTo || 'PRESENT'}</span>
                                     )}
                                  </td>
                                  {isAdmin && (
                                    <td className="px-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button onClick={() => copyItem(service.id, item)} variant="ghost" size="icon" className="size-7 text-blue-200 hover:text-blue-600 rounded-lg"><Copy className="size-3.5" /></Button>
                                        <Button onClick={() => deleteItem(service.id, item.id)} variant="ghost" size="icon" className="size-7 text-rose-200 hover:text-rose-600 rounded-lg"><Trash2 className="size-3.5" /></Button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              )) : (
                                <tr className="h-20"><td colSpan={isAdmin ? (isGstSection ? 8 : 7) : (isGstSection ? 7 : 6)} className="text-center italic text-slate-400 text-xs uppercase">No active items for this category</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* PREVIOUS RATES SECTION */}
                      {previousItems.length > 0 && (
                        <div className="space-y-4 pt-8 border-t border-dashed border-slate-200 opacity-70 grayscale">
                          <div className="flex items-center gap-2 px-2">
                            <History className="size-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Previous Technical {isGstSection ? 'GST' : 'Rates'} (Historical Archive)</span>
                          </div>
                          <div className="border border-slate-200 rounded-[28px] overflow-hidden bg-white">
                            <table className="w-full border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="h-10 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                  <th className="w-12 text-center border-r">Sl</th>
                                  <th className="px-6 text-left border-r min-w-[150px]">Technical Item (English)</th>
                                  <th className="px-6 text-left border-r min-w-[150px]">Technical Item (Malayalam)</th>
                                  {isGstSection ? (
                                    <>
                                      <th className="w-24 text-center border-r">GST %</th>
                                      <th className="px-6 text-left border-r min-w-[150px]">Conditions</th>
                                    </>
                                  ) : (
                                    <th className="w-32 text-right pr-6 border-r">Expired Rate</th>
                                  )}
                                  <th className="w-32 text-center border-r">From</th>
                                  <th className="w-32 text-center border-r">To</th>
                                  {isAdmin && <th className="w-24">Actions</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {previousItems.map((item: any, iIdx: number) => (
                                  <tr key={item.id} className="h-11 border-b border-slate-100 last:border-b-0">
                                    <td className="text-center font-bold text-slate-300 text-[10px] border-r">{iIdx + 1}</td>
                                    <td className="px-6 border-r">
                                      <span className="text-[11px] font-bold text-slate-400 uppercase">{item.nameEn}</span>
                                    </td>
                                    <td className="px-6 border-r">
                                      <span className="text-[11px] font-bold text-slate-400">{item.nameMl}</span>
                                    </td>
                                    {isGstSection ? (
                                      <>
                                        <td className="w-24 text-center border-r text-slate-400 font-bold text-[11px]">{item.gstPercentage}%</td>
                                        <td className="px-6 border-r text-slate-400 text-[11px] italic">{item.conditions}</td>
                                      </>
                                    ) : (
                                      <td className="text-right pr-6 border-r">
                                        <span className="text-[11px] font-bold text-slate-400">₹{item.rate?.toLocaleString('en-IN')}</span>
                                      </td>
                                    )}
                                    <td className="border-r px-2">
                                      {isAdmin ? (
                                        <Input 
                                          type="date" 
                                          value={item.dateFrom || ''} 
                                          onChange={(e) => updateItem(service.id, item.id, 'dateFrom', e.target.value)} 
                                          className="h-8 text-[9px] px-1 border-slate-200 bg-white" 
                                        />
                                      ) : (
                                        <span className="text-center block text-[9px] font-medium text-slate-400">{item.dateFrom}</span>
                                      )}
                                    </td>
                                    <td className="border-r px-2">
                                      {isAdmin ? (
                                        <Input 
                                          type="date" 
                                          value={item.dateTo || ''} 
                                          onChange={(e) => updateItem(service.id, item.id, 'dateTo', e.target.value)} 
                                          className="h-8 text-[9px] px-1 border-slate-200 bg-white" 
                                        />
                                      ) : (
                                        <span className="text-center block text-[9px] font-medium text-slate-400">{item.dateTo}</span>
                                      )}
                                    </td>
                                    {isAdmin && (
                                      <td className="px-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button onClick={() => copyItem(service.id, item)} variant="ghost" size="icon" className="size-7 text-blue-200 hover:text-blue-600 rounded-lg"><Copy className="size-3.5" /></Button>
                                          <Button onClick={() => deleteItem(service.id, item.id)} variant="ghost" size="icon" className="size-7 text-rose-200 hover:text-rose-600 rounded-lg"><Trash2 className="size-3.5" /></Button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center animate-in zoom-in duration-500">
              <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No results found</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">Adjust your query or check system technical configurations.</p>
            </div>
          )}
        </div>

        {/* PERSISTENT ACTION FOOTER (Admin Only) */}
        {isAdmin && isDirty && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in slide-in-from-bottom-8 duration-500">
            <Card className="rounded-[28px] border-none shadow-2xl ring-2 ring-[#1e3a8a] bg-white p-4">
               <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-4 pl-4">
                    <div className="p-2 bg-blue-50 rounded-xl"><Settings className="size-5 text-blue-600 animate-spin-slow" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Global Sync Required</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Pending modifications detected in the technical rates matrix.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => { setLocalServices(cloudSettings?.services || INITIAL_SERVICES_DATA); setIsDirty(false); }} className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400">DISCARD ALL</Button>
                    <Button onClick={handleSaveChanges} disabled={isPending} className="h-12 px-10 rounded-2xl bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95">
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      SYNCHRONIZE TO CLOUD
                    </Button>
                  </div>
               </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function useLsgdData() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'global_data');
  }, [firestore]);
  const { data: settings } = useDoc(settingsRef);
  return { lsgs: settings?.lsgs || [], lsgMappings: settings?.lsgMappings || [] };
}
