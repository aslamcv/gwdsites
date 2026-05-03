
'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Calendar, 
  UserCheck, 
  Settings,
  Truck,
  Wrench,
  ShieldCheck,
  UserPlus,
  Loader2,
  ChevronDown,
  Lock,
  Building2,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCollection, useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GeologicalStaffAssignmentProps {
  title: string;
  backUrl: string;
  nextUrl: string;
}

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "SKE DTH RIG VEHICLE",
  "PT UNIT VEHICLE"
];

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export function GeologicalStaffAssignment({ title, backUrl, nextUrl }: GeologicalStaffAssignmentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workStartDate, setWorkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [workEndDate, setWorkEndDate] = useState('');
  const [conveyanceMode, setConveyanceMode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [selectedLsgd, setSelectedLsgd] = useState('');
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { lsgs } = useLsgdData();

  // Role detection using email indexing
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false; 
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    
    const hasTechnicalRole = userProfile?.role === 'admin' || userProfile?.role === 'scientist' || userProfile?.role === 'engineer';
    return hasTechnicalRole && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const showViewOnly = !isUserLoading && !isProfileLoading && !isAllowed;

  const employeesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesCollection);

  const [assignments, setAssignments] = useState<Record<string, string[]>>({
    hydrogeologist: [],
    juniorHydrogeologist: [],
    geologicalAssistant: [],
    lascar: [],
    otherStaffs: [],
    drivers: [],
    slr: [],
    clr: [],
  });

  const staffConfigs = [
    { key: 'hydrogeologist', label: 'HYDROGEOLOGIST', max: 1, icon: UserCheck, designations: ['Hydrogeologist'] },
    { key: 'juniorHydrogeologist', label: 'JUNIOR HYDROGEOLOGIST', max: 1, icon: Users, designations: ['Junior Hydrogeologist'] },
    { key: 'geologicalAssistant', label: 'GEOLOGICAL ASSISTANT', max: 2, icon: ShieldCheck, designations: ['Geological Assistant'] },
    { key: 'lascar', label: 'LASCAR', max: 3, icon: Wrench, designations: ['Lascar'] },
    { key: 'otherStaffs', label: 'OTHER STAFFS', max: 5, icon: Settings, designations: 'all' },
    { key: 'drivers', label: 'DRIVERS', max: 2, icon: Truck, designations: ['Compressor Driver', 'HDV Driver', 'LDV Driver', 'SLR', 'CLR', 'CLR (Employment)'] },
    { key: 'slr', label: 'SLR', max: 4, icon: Wrench, designations: ['SLR'] },
    { key: 'clr', label: 'CLR', max: 4, icon: Wrench, designations: ['CLR', 'CLR (Employment)'] },
  ];

  const isAssignedElsewhere = (name: string, currentKey: string) => {
    return Object.entries(assignments).some(([key, list]) => key !== currentKey && list.includes(name));
  };

  const handleToggle = (key: string, name: string, max: number) => {
    if (!isAllowed) return;
    if (!assignments[key].includes(name) && isAssignedElsewhere(name, key)) {
      toast({ variant: "destructive", title: "Staff Conflict", description: `${name} is already assigned to another role.` });
      return;
    }
    setAssignments(prev => {
      const current = prev[key] || [];
      if (current.includes(name)) return { ...prev, [key]: current.filter(n => n !== name) };
      if (current.length < max) return { ...prev, [key]: [...current, name] };
      return prev;
    });
  };

  const handleContinue = () => {
    if (!user || !firestore || !isAllowed) return;
    if (!siteName || !selectedLsgd) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please enter Site Name and LSGD before proceeding." });
      return;
    }

    startTransition(() => {
      const reportRef = doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportRef.id;

      const staffAssignment: any = {};
      const staffArray: any[] = [];

      Object.entries(assignments).forEach(([key, list]) => {
        if (list.length > 0) {
          staffAssignment[key] = list.join(', ');
          const config = staffConfigs.find(c => c.key === key);
          list.forEach(name => {
            staffArray.push({ name, designation: config?.label || key });
          });
        }
      });

      const reportData = {
        id: reportId,
        status: 'Draft' as const,
        purpose: "Ground Water Investigation",
        category: title,
        nameOfSite: siteName,
        lsgd: selectedLsgd,
        reportDate: workStartDate,
        dateOfInvestigation: `${workStartDate}${workEndDate ? ' - ' + workEndDate : ''}`,
        conveyance: conveyanceMode,
        staffAssignment,
        staff: staffArray,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(reportRef, reportData, { merge: true });
      
      const queryParams = new URLSearchParams();
      queryParams.append('id', reportId);
      queryParams.append('startDate', workStartDate);
      queryParams.append('endDate', workEndDate);
      router.push(`${nextUrl}?${queryParams.toString()}`);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href={backUrl}><ArrowLeft className="h-5 w-5" /></Link></Button>
          <PageHeader title={title} />
        </div>
        {showViewOnly && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 font-black uppercase text-[10px]"><Lock className="size-3.5 mr-2" /> READ ONLY</Badge>}
      </div>
      
      <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><MapPin className="size-4" /> SITE CONTEXT</CardTitle>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Project / Site Name</Label>
            <Input disabled={!isAllowed} value={siteName} onChange={(e) => setSiteName(e.target.value)} className="h-11 border-slate-200 uppercase font-bold" placeholder="ENTER LOCATION NAME" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">LSGD</Label>
            <Select disabled={!isAllowed} onValueChange={setSelectedLsgd} value={selectedLsgd}>
              <SelectTrigger className="h-11 border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Conveyance</Label>
            <Select disabled={!isAllowed} onValueChange={setConveyanceMode} value={conveyanceMode}>
              <SelectTrigger className="h-11 border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{conveyanceOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Start Date</Label>
            <Input disabled={!isAllowed} type="date" value={workStartDate} onChange={(e) => setWorkStartDate(e.target.value)} className="h-11 border-slate-200" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">End Date (Optional)</Label>
            <Input disabled={!isAllowed} type="date" value={workEndDate} onChange={(e) => setWorkEndDate(e.target.value)} className="h-11 border-slate-200" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staffConfigs.map((config) => (
          <Card key={config.key} className="border-none shadow-sm bg-white ring-1 ring-slate-200 rounded-2xl overflow-hidden h-[220px] flex flex-col">
            <CardHeader className="bg-slate-50 py-2.5 px-4 border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2"><config.icon className="h-3.5 w-3.5 text-primary" /><CardTitle className="text-[9px] font-black uppercase tracking-tight text-slate-700">{config.label}</CardTitle></div>
              <Badge variant="secondary" className="text-[8px] h-4">{assignments[config.key]?.length || 0} / {config.max}</Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {(employees?.filter(e => config.designations === 'all' || config.designations.includes(e.designation)) || []).map((emp) => {
                    const isSel = assignments[config.key]?.includes(emp.name);
                    const isElse = !isSel && isAssignedElsewhere(emp.name, config.key);
                    const dsbl = (!isSel && (assignments[config.key]?.length || 0) >= config.max) || isElse || !isAllowed;
                    return (
                      <div key={emp.id} className={cn("flex items-center space-x-2 p-1.5 rounded-lg transition-all", isSel ? "bg-primary/5 border border-primary/20" : "hover:bg-slate-50", dsbl && "opacity-40 grayscale cursor-not-allowed")} onClick={() => !dsbl && handleToggle(config.key, emp.name, config.max)}>
                        <Checkbox checked={isSel} disabled={dsbl} />
                        <div className="flex flex-col min-w-0"><span className={cn("text-[10px] font-bold truncate", isElse && "line-through")}>{emp.name}</span><span className="text-[8px] text-slate-400 uppercase">{emp.designation}</span></div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <Button onClick={handleContinue} disabled={isPending || !isAllowed} className="h-14 px-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] gap-3 shadow-xl shadow-primary/20">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
          CONTINUE TO TECHNICAL ENTRY
        </Button>
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
