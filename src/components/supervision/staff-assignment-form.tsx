
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
  AlertCircle,
  Truck,
  Wrench,
  ShieldCheck,
  Loader2,
  UserPlus,
  ChevronDown,
  Lock
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

interface SupervisionStaffAssignmentProps {
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

export function SupervisionStaffAssignment({ title, backUrl, nextUrl }: SupervisionStaffAssignmentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [conveyanceMode, setConveyanceMode] = useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // FIX: Access profile using email as ID for accurate role check
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email === 'gwdmpm@gmail.com') return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const showViewOnly = !isUserLoading && !isProfileLoading && !isAllowed;

  const employeesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesCollection);

  const [assignments, setAssignments] = useState<Record<string, string[]>>({
    assistantExecutiveEngineer: [],
    assistantEngineer: [],
    supervisor: [],
    otherStaff: [],
    drivers: [],
    slr: [],
    clr: [],
  });

  const [otherDistrictStaff, setOtherDistrictStaff] = useState(
    Array(5).fill({ name: '', designation: '', district: '' })
  );

  const staffConfigs = [
    { 
      key: 'assistantExecutiveEngineer', 
      label: 'ASSISTANT EXECUTIVE ENGINEER', 
      max: 1, 
      icon: UserCheck,
      designations: ['Assistant Executive Engineer'] 
    },
    { 
      key: 'assistantEngineer', 
      label: 'ASSISTANT ENGINEER', 
      max: 1, 
      icon: Users,
      designations: ['Assistant Engineer'] 
    },
    { 
      key: 'supervisor', 
      label: 'SUPERVISOR', 
      max: 1, 
      icon: UserCheck,
      designations: ['Master Driller', 'Senior Driller', 'Driller', 'Driller Mechanic', 'Surveyor', 'Drilling Assistant'] 
    },
    { 
      key: 'otherStaff', 
      label: 'OTHER STAFF', 
      max: 2, 
      icon: Users,
      designations: ['Master Driller', 'Senior Driller', 'Driller', 'Driller Mechanic', 'Surveyor', 'Drilling Assistant'] 
    },
    { 
      key: 'drivers', 
      label: 'DRIVERS', 
      max: 5, 
      icon: Truck,
      designations: ['Compressor Driver', 'HDV Driver', 'LDV Driver', 'SLR', 'CLR', 'CLR (Employment)'] 
    },
    { 
      key: 'slr', 
      label: 'SLR', 
      max: 7, 
      icon: Wrench,
      designations: ['SLR'] 
    },
    { 
      key: 'clr', 
      label: 'CLR', 
      max: 15, 
      icon: Wrench,
      designations: ['CLR', 'CLR (Employment)'] 
    },
  ];

  const isAssignedElsewhere = (name: string, currentKey: string) => {
    return Object.entries(assignments).some(([key, list]) => key !== currentKey && list.includes(name));
  };

  const handleToggle = (key: string, name: string, max: number) => {
    if (!isAllowed) return;
    if (!assignments[key].includes(name) && isAssignedElsewhere(name, key)) {
      toast({
        variant: "destructive",
        title: "Staff Conflict",
        description: `${name} is already assigned to another role in this session.`,
      });
      return;
    }

    setAssignments(prev => {
      const current = prev[key] || [];
      if (current.includes(name)) {
        return { ...prev, [key]: current.filter(n => n !== name) };
      }
      if (current.length < max) {
        return { ...prev, [key]: [...current, name] };
      }
      return prev;
    });
  };

  const updateOtherStaff = (index: number, field: string, value: string) => {
    if (!isAllowed) return;
    const updated = [...otherDistrictStaff];
    updated[index] = { ...updated[index], [field]: value };
    setOtherDistrictStaff(updated);
  };

  const handleContinue = () => {
    if (!user || !firestore || !isAllowed) return;

    startTransition(() => {
      const reportRef = doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportRef.id;

      const staffAssignment: any = {};
      Object.entries(assignments).forEach(([key, list]) => {
        if (list.length > 0) staffAssignment[key] = list.join(', ');
      });

      const reportData = {
        id: reportId,
        status: 'Draft' as const,
        purpose: "Supervision",
        category: title.replace('Staff Assignment - ', ''),
        reportDate: startDate,
        dateOfInvestigation: `${startDate}${endDate ? ' - ' + endDate : ''}`,
        conveyance: conveyanceMode,
        staffAssignment,
        otherDistrictStaff: otherDistrictStaff.filter(s => s.name),
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(reportRef, reportData, { merge: true });
      
      const queryParams = new URLSearchParams();
      queryParams.append('id', reportId);
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      queryParams.append('conveyance', conveyanceMode);
      
      Object.entries(staffAssignment).forEach(([key, val]) => {
        queryParams.append(key, val as string);
      });

      router.push(`${nextUrl}?${queryParams.toString()}`);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader title={title} />
        </div>
        {showViewOnly && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black">
            <Lock className="size-3.5" />
            VIEW ONLY ACCESS
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Start Date
          </Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!isAllowed} className="h-11 border-primary/20 bg-white rounded-xl shadow-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3 w-3" /> End Date (Opt)
          </Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={!isAllowed} className="h-11 border-primary/20 bg-white rounded-xl shadow-sm" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Truck className="h-3 w-3" /> Conveyance
          </Label>
          <Select onValueChange={setConveyanceMode} value={conveyanceMode} disabled={!isAllowed}>
            <SelectTrigger className="bg-white border-primary/20 h-11 rounded-xl shadow-sm">
              <SelectValue placeholder="Select Mode" />
            </SelectTrigger>
            <SelectContent>
              {conveyanceOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staffConfigs.map((config) => {
          const filteredEmployees = employees?.filter(emp => config.designations.includes(emp.designation)) || [];
          const currentCount = assignments[config.key]?.length || 0;
          const isAtLimit = currentCount >= config.max;

          return (
            <Card key={config.key} className="border-none shadow-sm bg-slate-50 ring-1 ring-slate-200 rounded-2xl overflow-hidden h-[220px] flex flex-col transition-all hover:ring-primary/20">
              <CardHeader className="bg-white py-2.5 px-4 border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-700">{config.label}</CardTitle>
                </div>
                <Badge variant={isAtLimit ? "default" : "secondary"} className={cn("text-[9px] px-1.5 h-5", isAtLimit && "bg-primary")}>
                   {config.max > 7 ? "MULTI" : `${currentCount} / ${config.max}`}
                </Badge>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {filteredEmployees.map((emp) => {
                      const isAssignedSelected = assignments[config.key]?.includes(emp.name);
                      const isAssignedElse = !isAssignedSelected && isAssignedElsewhere(emp.name, config.key);
                      const disabled = (!isAssignedSelected && isAtLimit) || isAssignedElse || !isAllowed;

                      return (
                        <div 
                          key={emp.id} 
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-xl transition-all border border-transparent",
                            isAssignedSelected ? "bg-white border-primary/20 shadow-sm" : "hover:bg-white/50 cursor-pointer",
                            disabled && "opacity-40 grayscale cursor-not-allowed"
                          )}
                          onClick={() => !disabled && handleToggle(config.key, emp.name, config.max)}
                        >
                          <Checkbox checked={isAssignedSelected} disabled={disabled} onCheckedChange={() => handleToggle(config.key, emp.name, config.max)} />
                          <div className="flex flex-col min-w-0">
                            <span className={cn("text-xs font-bold truncate", isAssignedElse ? "text-slate-400 line-through" : "text-slate-800")}>{emp.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-medium">{isAssignedElse ? 'ALREADY ASSIGNED' : emp.designation}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button 
          onClick={handleContinue} 
          disabled={isPending || !isAllowed} 
          className="px-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest gap-3 h-14 rounded-2xl shadow-xl shadow-primary/20 inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {showViewOnly && <Lock className="size-4 mr-2" />}
          {isPending ? <Loader2 className="animate-spin size-5" /> : null}
          {isAllowed ? 'Next Step' : 'Access Restricted'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
