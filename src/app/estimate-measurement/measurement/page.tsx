'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Users, 
  Truck, 
  Calendar,
  Construction,
  Waves,
  Wrench,
  Droplets,
  Ruler,
  ShieldCheck,
  X,
  Mountain,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Employee } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Logo } from '@/components/logo';

export default function MeasurementEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  // Centralized employees list
  const employeesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'employees'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesQuery);

  const [formData, setFormData] = useState({
    fileNo: '',
    nameOfSite: '',
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    contractorName: '',
    ae: '',
    aee: '',
    otherStaff: [] as string[],
    slr: [] as string[],
    clr: [] as string[],
    driver: '',
    remarks: '',
    borewellSites: Array(5).fill(''),
    mwssSites: Array(5).fill(''),
    hpsSites: Array(5).fill(''),
    arsSites: Array(5).fill('')
  });

  const aes = useMemo(() => employees?.filter(e => e.designation === 'Assistant Engineer') || [], [employees]);
  const aees = useMemo(() => employees?.filter(e => e.designation === 'Assistant Executive Engineer') || [], [employees]);
  const slrs = useMemo(() => employees?.filter(e => e.designation === 'SLR') || [], [employees]);
  const clrs = useMemo(() => employees?.filter(e => e.designation === 'CLR' || e.designation === 'CLR (Employment)') || [], [employees]);
  const drivers = useMemo(() => employees?.filter(e => e.designation.includes('Driver')) || [], [employees]);

  // Specialized Filter for "Other Staff" dropdown
  const otherStaffOptions = useMemo(() => {
    if (!employees) return [];
    const excluded = [
      'Assistant Executive Engineer',
      'Assistant Engineer',
      'Compressor Driver',
      'HDV Driver',
      'LDV Driver',
      'SLR',
      'CLR',
      'CLR (Employment)'
    ];
    
    // Filter out people already selected in any field of the current form
    const currentlySelected = [
      formData.ae,
      formData.aee,
      formData.driver,
      ...formData.slr,
      ...formData.clr,
      ...formData.otherStaff
    ].filter(Boolean);

    return employees.filter(e => 
      !excluded.includes(e.designation) && 
      !currentlySelected.includes(e.name)
    );
  }, [employees, formData]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addStaff = (key: string, name: string) => {
    if (name === "none" || !name) return;
    setFormData(prev => {
      const current = (prev as any)[key] as string[];
      if (!current.includes(name)) {
        return { ...prev, [key]: [...current, name] };
      }
      return prev;
    });
  };

  const removeStaff = (key: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev as any)[key].filter((n: string) => n !== name)
    }));
  };

  const updateSiteData = (pillar: string, index: number, value: string) => {
    setFormData(prev => {
      const next = { ...prev };
      (next as any)[pillar][index] = value;
      return next;
    });
  };

  const pillars = [
    { id: 'borewellSites', label: 'Borewell Construction / Flushing', icon: Construction, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'mwssSites', label: 'MWSS / MWSS Renovation', icon: Waves, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'hpsSites', label: 'HPS / HPR (Repair)', icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'arsSites', label: 'ARS (Recharge)', icon: Droplets, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const currentReportData = useMemo(() => {
    const worksList: any[] = [];
    pillars.forEach(p => {
      (formData as any)[p.id].forEach((detail: string, idx: number) => {
        if (detail.trim()) {
          worksList.push({
            description: `${p.label} - Site ${idx + 1}: ${detail}`,
            qty: 1,
            unit: 'Job',
            rate: 0,
            amount: 0
          });
        }
      });
    });

    return {
      ...formData,
      category: "ESTIMATE_MEASUREMENT",
      reportType: "MEASUREMENT" as const,
      applicantName: formData.nameOfSite || formData.contractorName,
      reportTitle: `Measurement: ${formData.fileNo}`,
      nameOfContractor: formData.contractorName,
      works: worksList,
      totalAmount: 0,
      staffAssignment: {
        assistantEngineer: formData.ae,
        assistantExecutiveEngineer: formData.aee,
        supervisor: formData.otherStaff[0] || 'Unassigned',
        otherStaff: formData.otherStaff,
        slr: formData.slr,
        clr: formData.clr,
        drivers: formData.driver,
        conveyance: formData.conveyance
      }
    };
  }, [formData]);

  const handleSave = () => {
    if (!user || !firestore) return;
    startTransition(() => {
      const docRef = doc(collection(firestore, 'groundwaterReports'));
      const reportData = {
        ...currentReportData,
        id: docRef.id,
        status: "Published",
        purpose: "Estimate / Measurement",
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(docRef, reportData, { merge: true });
      toast({ title: 'Measurement Recorded', description: 'Technical field data and site staff synchronized.' });
      router.push('/estimate-measurement');
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen pb-32 text-black">
      
      {/* Header Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 shadow-sm text-black">
              <Link href="/estimate-measurement"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">MEASUREMENT PORTAL</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Ground Water Department, Malappuram</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Input type="date" value={formData.reportDate} onChange={(e) => updateField('reportDate', e.target.value)} className="h-12 w-44 rounded-xl font-bold bg-white text-black border-slate-200" />
            <Select onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance}>
              <SelectTrigger className="h-12 w-56 rounded-xl bg-slate-50 text-black border-slate-200"><SelectValue placeholder="Conveyance Mode" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-black">
                <SelectItem value="department">Department Vehicle</SelectItem>
                <SelectItem value="rented">Rented Vehicle</SelectItem>
                <SelectItem value="private">Private Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-blue-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Oversight
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Assistant Engineer (AE)</Label>
              <Select onValueChange={(v) => updateField('ae', v)} value={formData.ae}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                  <SelectValue placeholder="Select AE" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {aes.length > 0 ? aes.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>) : <SelectItem value="none" disabled>No AEs found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Asst. Executive Engineer (AEE)</Label>
              <Select onValueChange={(v) => updateField('aee', v)} value={formData.aee}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                  <SelectValue placeholder="Select AEE" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {aees.length > 0 ? aees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>) : <SelectItem value="none" disabled>No AEEs found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <Users className="h-4 w-4" /> Field Technical Team
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400">SLR</Label>
                <div className="space-y-2">
                  <Select onValueChange={(v) => addStaff('slr', v)}>
                    <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                      <SelectValue placeholder="Add" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-black">
                      {slrs.length > 0 ? slrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.slr.includes(e.name)}>{e.name}</SelectItem>) : <SelectItem value="none" disabled>None</SelectItem>}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {formData.slr.map(name => (
                      <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeStaff('slr', name)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400">CLR</Label>
                <div className="space-y-2">
                  <Select onValueChange={(v) => addStaff('clr', v)}>
                    <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                      <SelectValue placeholder="Add" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-black">
                      {clrs.length > 0 ? clrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.clr.includes(e.name)}>{e.name}</SelectItem>) : <SelectItem value="none" disabled>None</SelectItem>}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {formData.clr.map(name => (
                      <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeStaff('clr', name)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Other Staff</Label>
              <div className="space-y-2">
                <Select onValueChange={(v) => addStaff('otherStaff', v)}>
                  <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                    <SelectValue placeholder="Add Staff" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-black">
                    {otherStaffOptions.length > 0 ? otherStaffOptions.map(e => (
                      <SelectItem key={e.id} value={e.name}>{e.name} ({e.designation})</SelectItem>
                    )) : <SelectItem value="none" disabled>No available staff</SelectItem>}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {formData.otherStaff.map(name => (
                    <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeStaff('otherStaff', name)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Name of Site</Label>
              <div className="relative">
                <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-emerald-500" />
                <Input value={formData.nameOfSite} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-10 pl-9 border-emerald-200 bg-emerald-50/30 font-black uppercase text-emerald-700" placeholder="ENTER PRIMARY SITE NAME" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Driver Name</Label>
              <Select onValueChange={(v) => updateField('driver', v)} value={formData.driver}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {drivers.length > 0 ? drivers.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>) : <SelectItem value="none" disabled>No Drivers found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Name of Contractor</Label>
              <Input value={formData.contractorName} onChange={(e) => updateField('contractorName', e.target.value)} className="h-10 border-slate-200 bg-white font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">File Reference</Label>
              <Input value={formData.fileNo} onChange={(e) => updateField('fileNo', e.target.value)} className="h-10 bg-slate-50/50 border-slate-200" placeholder="MPM/GWD/..." />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">POST-CONSTRUCTION FIELD MEASUREMENT</h2>
          <Separator className="flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar) => (
             <Collapsible key={pillar.id} defaultOpen className="group">
              <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
                 <CollapsibleTrigger className="w-full">
                  <CardHeader className={cn("border-b py-4 px-8 flex flex-row items-center justify-between", pillar.bgColor)}>
                    <CardTitle className={cn("text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2", pillar.color)}>
                      <pillar.icon className="size-4" /> {pillar.label}
                    </CardTitle>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-8 space-y-4">
                    {(formData as any)[pillar.id].map((site: string, idx: number) => (
                      <div className="flex items-center gap-4" key={idx}>
                        <span className="text-[9px] font-black text-slate-300 w-12 shrink-0">SITE {idx + 1}</span>
                        <Input 
                          value={site} 
                          onChange={(e) => updateSiteData(pillar.id, idx, e.target.value)} 
                          className="h-10 text-[11px] bg-slate-50/50 border-slate-200 text-black"
                          placeholder="Enter actual field measurement values..."
                        />
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>

      <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-4 px-8"><CardTitle className="text-[10px] font-black uppercase text-slate-500">FIELD OBSERVATIONS & REMARKS</CardTitle></CardHeader>
        <CardContent className="p-8">
          <Textarea 
            value={formData.remarks} 
            onChange={(e) => updateField('remarks', e.target.value)} 
            className="min-h-[120px] font-medium text-black border-slate-200 bg-white" 
            placeholder="Record site-specific observations during measurement..." 
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isPending} className="h-14 px-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200 gap-2">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 
          SYNCHRONIZE RECORD
        </Button>
      </div>
    </div>
  );
}
