'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Search, FileText, Info, IndianRupee, PlusCircle, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const servicesData = [
  {
    title: "Groundwater Investigation",
    items: [
      { name: "Individual / Domestic", rate: 585 },
      { name: "Govt, LSGD, Institutions", rate: 1935 },
      { name: "Industrial / Commercial", rate: 3860 },
    ],
    description: [
      "Scientific assessment of groundwater availability using geophysical techniques.",
      "Site selection for Open Wells and Bore Wells based on hydrogeological data.",
      "Integration of GPS, GIS mapping, and resistivity meter (VES) findings.",
    ],
  },
  {
    title: "Drilling Services",
    items: [
      { name: "110 mm Borewell Drilling", rate: 390 },
      { name: "150 mm Borewell Drilling", rate: 665 },
      { name: "200 mm Tubewell Construction", rate: 2980 },
      { name: "Overburden Drilling (Casing)", rate: 450 },
    ],
    description: [
      "Construction of bore wells and tube wells using specialized departmental rigs.",
      "Installation of PVC/GI casing pipes as per site requirements.",
      "Suitable for Domestic, Agriculture, and Industrial deployments.",
    ],
  },
  {
    title: "Yield Testing (Pumping Test)",
    items: [
      { name: "Step Drawdown Test (SDT)", rate: 7490 },
      { name: "Constant Discharge Test (CDT)", rate: 12500 },
      { name: "Well Logging / Depth Profiling", rate: 14475 },
    ],
    description: [
      "Determining the sustainable yield and recovery parameters of the well.",
      "Analysis of drawdown data to recommend safe pumping rates.",
      "Mandatory for large-scale infrastructure and public water schemes.",
    ],
  },
  {
    title: "Water Quality Analysis",
    items: [
      { name: "Physical & Chemical Testing", rate: 1200 },
      { name: "Bacteriological (Microbial) Testing", rate: 900 },
      { name: "Heavy Metal Analysis", rate: 2500 },
    ],
    description: [
      "Comprehensive testing in regional departmental laboratories.",
      "Technical certification of potability and chemical compliance.",
      "Provides recommendations for water treatment if required.",
    ],
  },
  {
    title: "Permit & Regulation",
    items: [
      { name: "New Borewell Permit Application", rate: 500 },
      { name: "Well Conversion / Deepening Permit", rate: 750 },
      { name: "Industrial No-Objection Certificate (NOC)", rate: 5000 },
    ],
    description: [
      "Regulatory oversight to ensure sustainable groundwater usage.",
      "Mandatory processing for notified blocks and industrial zones.",
      "Verification of distance rules and local water security.",
    ],
  },
];

export default function ServicesRatesCatalog() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Role detection
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

  const filteredServices = servicesData.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* OFFICIAL HEADER */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
          <div className="bg-[#1e3a8a] p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase leading-none">
                  Services & Rates Catalog
                </h1>
                <div className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-none">GWD KERALA</Badge>
                  District Office, Malappuram
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button className="rounded-2xl h-14 px-8 bg-white text-[#1e3a8a] hover:bg-blue-50 shadow-xl font-black uppercase tracking-widest text-[11px] gap-3">
                    <PlusCircle className="size-5" />
                    PROVISION NEW RATE
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
            filteredServices.map((service, index) => (
              <div
                key={index}
                className="group bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* CATEGORY HEADER */}
                <div
                  className={cn(
                    "flex justify-between items-center p-6 cursor-pointer transition-colors",
                    openIndex === index ? "bg-slate-50" : "hover:bg-slate-50/50"
                  )}
                  onClick={() => toggle(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-all",
                      openIndex === index ? "bg-[#1e3a8a] text-white scale-110 shadow-lg shadow-blue-900/20" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <h2 className={cn(
                      "font-black text-lg uppercase tracking-tight",
                      openIndex === index ? "text-[#1e3a8a]" : "text-slate-700"
                    )}>
                      {service.title}
                    </h2>
                  </div>

                  <div className={cn(
                    "p-2 rounded-full transition-all",
                    openIndex === index ? "bg-blue-100 rotate-180" : "bg-slate-100"
                  )}>
                    <ChevronDown className={cn(
                      "h-4 w-4",
                      openIndex === index ? "text-[#1e3a8a]" : "text-slate-400"
                    )} />
                  </div>
                </div>

                {/* EXPANDABLE CONTENT */}
                {openIndex === index && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                    
                    {/* SCOPE DESCRIPTION */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scope of Work</span>
                      </div>
                      <ul className="space-y-1">
                        {service.description.map((d, i) => (
                          <li key={i} className="text-xs text-slate-600 font-medium leading-relaxed flex items-start gap-2">
                            <div className="mt-1.5 size-1 rounded-full bg-slate-300 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* RATES TABLE */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="h-10 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                            <th className="w-16 text-center border-r">Sl No</th>
                            <th className="px-6 text-left border-r">Technical Item / Category</th>
                            <th className="w-40 text-right pr-8">Official Rate (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {service.items.map((item, i) => (
                            <tr key={i} className="h-12 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                              <td className="text-center font-bold text-slate-300 text-xs border-r">{i + 1}</td>
                              <td className="px-6 text-slate-700 font-bold text-xs uppercase border-r">
                                {item.name}
                              </td>
                              <td className="text-right pr-8">
                                <span className="font-black text-[#1e3a8a] text-sm">
                                  ₹ {item.rate.toLocaleString('en-IN')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-center">
              <Search className="h-12 w-12 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No services found</h3>
              <p className="text-slate-500 text-sm uppercase font-black text-[10px] tracking-widest mt-2">Try searching for different keywords or categories.</p>
            </div>
          )}
        </div>

        {/* FOOTER NOTE */}
        <div className="p-6 bg-slate-100/50 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <Info className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
            Rates are subject to official government revisions as per Kerala Ground Water Department guidelines. All charges include technical supervision and documentation fees as per district policy.
          </p>
        </div>
      </div>
    </div>
  );
}
