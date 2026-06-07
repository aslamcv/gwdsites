'use client';

import { useState, useTransition, useEffect, useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Users, 
  X,
  Mountain,
  PlusCircle,
  Trash2,
  ClipboardList,
  MapPin,
  SearchCode,
  Lock,
  Droplets,
  Calculator,
  Settings,
  Calendar as CalendarIcon,
  Truck,
  Building2 as Building
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { cn } from '@/lib/utils';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const sectorOptions = [
  { id: 'private', label: 'Private' },
  { id: 'government', label: 'Government' },
  { id: 'other_district', label: 'Other District' },
];

const categoryMappings: Record<string, string[]> = {
  private: ["Agriculture", "Infrastructure", "Industrial", "Domestic"],
  government: ["Infrastructure", "GWBDWS", "Institutional", "Others"],
  other_district: ["Inter-District Project", "Emergency Support"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "SKE DTH RIG VEHICLE",
  "PT UNIT VEHICLE"
];

const timeIntervals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 120, 140, 160, 180, 210, 240, 270, 300];

function UnifiedBorewellPumpingEntryContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lsgs, lsgMappings } = useLsgdData();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    const role = (userProfile?.role || '').toLowerCase().trim();
    const isApproved = userProfile?.isApproved !== false;
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL || role === 'admin') return true;
    return (role === 'admin' || role === 'engineer' || role === 'scientist') && isApproved;
  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  const employeesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore]);
  const { data: employees } = useCollection<Employee>(employeesRef);

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport, isLoading: isReportLoading } = useDoc<GroundwaterReport>(reportRef);

  const isOwner = useMemo(() => {
    if (!cloudReport || !user) return false;
    const creator = (cloudReport.uploadedBy || '').trim();
    return creator === user.uid || creator === user.email?.toLowerCase().trim();
  }, [cloudReport, user]);

  const canModify = isAllowed && (!id || isOwner || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL || userProfile?.role?.toLowerCase() === 'admin');

  const [formData, setFormData] = useState<any>({
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    sector: 'private',
    category: 'Agriculture',
    nameOfSite: '',
    address: '',
    lsgd: '',
    district: 'Malappuram',
    latitude: '',
    longitude: '',
    pumpCapacity: '',
    typeOfWell: 'Bore Well',
    depthOfWell: '',
    diameterOfWell: '',
    staticWaterLevel: '',
    averageDischarge: '',
    remarks: '',
    recommendation: '',
    step1: timeIntervals.map(time => ({ time, waterLevel: '', drawdown: '' })),
    step2: timeIntervals.map(time => ({ time, waterLevel: '', drawdown: '' })),
    step3: timeIntervals.map(time => ({ time, waterLevel: '', drawdown: '' })),
    staffAssignment: {
        unitInCharge: [],
        assistantEngineer: [],
        assistantExecutiveEngineer: [],
        supervisor: [],
        otherStaff: []
    }
  });

  useEffect(() => {
    if (cloudReport) {
      const sa = cloudReport.staffAssignment || {};
      setFormData((prev: any) => ({
        ...prev,
        ...cloudReport,
        staffAssignment: {
          unitInCharge: Array.isArray(sa.unitInCharge) ? sa.unitInCharge : (sa.unitInCharge ? (sa.unitInCharge as string).split(', ') : []),
          assistantEngineer: Array.isArray(sa.assistantEngineer) ? sa.assistantEngineer : (sa.assistantEngineer ? (sa.assistantEngineer as string).split(', ') : []),
          assistantExecutiveEngineer: Array.isArray(sa.assistantExecutiveEngineer) ? sa.assistantExecutiveEngineer : (sa.assistantExecutiveEngineer ? (sa.assistantExecutiveEngineer as string).split(', ') : []),
          supervisor: Array.isArray(sa.supervisor) ? sa.supervisor : (sa.supervisor ? (sa.supervisor as string).split(', ') : []),
          otherStaff: Array.isArray(sa.otherStaff) ? sa.otherStaff : (sa.otherStaff ? (sa.otherStaff as string).split(', ') : [])
        }
      }));
    }
  }, [cloudReport]);

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateTableData = (tableKey: string, index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newTable = [...prev[tableKey]];
      newTable[index] = { ...newTable[index], [field]: value };
      return { ...prev, [tableKey]: newTable };
    });
  };

  const updateStaff = (role: string, names: string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      staffAssignment: {
        ...prev.staffAssignment,
        [role]: names
      }
    }));
  };

  const filteredStaff = useMemo(() => {
    if (!employees) return { aee: [], ae: [], sup: [], other: [] };
    const aeeList = employees.filter(e => e.designation.toLowerCase().includes('assistant executive engineer'));
    const aeList = employees.filter(e => e.designation.toLowerCase().includes('assistant engineer'));
    const supList = employees.filter(e => ['Master Driller', 'Senior Driller', 'Driller', 'Driller Mechanic', 'Surveyor', 'Drilling Assistant'].includes(e.designation));
    const specialIds = [...aeeList, ...aeList, ...supList].map(e => e.id);
    const otherList = employees.filter(e => !specialIds.includes(e.id));
    return { aee: aeeList, ae: aeList, sup: supList, other: otherList };
  }, [employees]);

  const detectedLac = useMemo(() => {
    const mapping = lsgMappings?.find(m => m.lsg === formData.lsgd);
    return mapping?.constituency || '';
  }, [formData.lsgd, lsgMappings]);

  const handleSave = () => {
    if (!user || !firestore || !isAllowed || !canModify) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const reportData = {
        ...formData,
        id: reportId,
        status: 'Published' as const,
        purpose: "Pumping Test / Bore Well",
        category: "Pumping Test / Bore Well",
        updatedAt: new Date().toISOString(),
        uploadedBy: cloudReport?.uploadedBy || user.uid,
        assembly: detectedLac,
        staffAssignment: {
            assistantExecutiveEngineer: formData.staffAssignment.assistantExecutiveEngineer.join(', '),
            assistantEngineer: formData.staffAssignment.assistantEngineer.join(', '),
            supervisor: formData.staffAssignment.supervisor.join(', '),
            otherStaff: formData.staffAssignment.otherStaff.join(', ')
        }
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'Borewell pumping test record synchronized.' });
        router.push('/pumping-test');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50 text-left">
        <div className="flex flex-col space-y-8 text-left">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">Borewell Pumping Test (SDT)</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Technical Operations | District Office, Malappuram</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 text-left">
            <div className="flex items-center gap-5 text-left">
              <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/pumping-test"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto text-left">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                  <CalendarIcon className="size-3 pointer-events-none" /> Test Date
                </Label>
                <Input disabled={!canModify} type="date" value={formData.reportDate || ''} onChange={(e) => updateField('reportDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Truck className="size-3" /> Conveyance</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">{conveyanceOptions.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Applied For</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('sector', v)} value={formData.sector || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                  <SearchCode className="size-3" /> Sub Category
                </Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('category', v)} value={formData.category || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {categoryMappings[formData.sector]?.map(c => <SelectItem key={c} value={c} className="text-[10px] font-black uppercase">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 text-left">
             <MapPin className="size-4" /> SITE & WELL SPECIFICATIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-10 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Site</Label>
              <Input disabled={!canModify} value={formData.nameOfSite || ''} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary focus:bg-white" />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</Label>
              <Input disabled={!canModify} value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LSGD</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (LAC)</Label>
              <Input disabled value={detectedLac} className="h-11 border-slate-200 bg-slate-50 font-black text-blue-600 uppercase" placeholder="Auto-detected" />
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Depth (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.depthOfWell || ''} onChange={(e) => updateField('depthOfWell', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diameter (m)</Label>
              <Input disabled={!canModify} value={formData.diameterOfWell || ''} onChange={(e) => updateField('diameterOfWell', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Static WL (mbmp)</Label>
              <Input disabled={!canModify} type="text" value={formData.staticWaterLevel || ''} onChange={(e) => updateField('staticWaterLevel', e.target.value)} className="h-11 border-slate-200 font-bold text-blue-600" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Avg Discharge (lpm)</Label>
              <Input disabled={!canModify} type="text" value={formData.averageDischarge || ''} onChange={(e) => updateField('averageDischarge', e.target.value)} className="h-11 border-slate-200 font-black text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center justify-between text-left">
             <div className="flex items-center gap-3 text-left"><Calculator className="size-4" /> STEP DRAWDOWN PUMPING DATA</div>
             <Badge className="bg-slate-900 text-[8px] font-black h-5 uppercase tracking-tighter">SDT TECHNICAL LOG</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto text-left">
          <div className="h-[500px] w-full text-left">
            <Table>
                <TableHeader className="bg-slate-100/50 sticky top-0 z-20">
                  <TableRow className="h-10 text-left text-left">
                    <TableHead className="w-24 text-center border-r">Time (min)</TableHead>
                    <TableHead colSpan={2} className="text-center border-r bg-blue-50/20">STEP-1</TableHead>
                    <TableHead colSpan={2} className="text-center border-r bg-emerald-50/20">STEP-2</TableHead>
                    <TableHead colSpan={2} className="text-center bg-amber-50/20">STEP-3</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50/50 text-[9px] uppercase font-black h-8 text-left">
                    <TableHead className="text-center border-r">WL (mbmp)</TableHead>
                    <TableHead className="text-center border-r">Drawdown (m)</TableHead>
                    <TableHead className="text-center border-r">WL (mbmp)</TableHead>
                    <TableHead className="text-center border-r">Drawdown (m)</TableHead>
                    <TableHead className="text-center border-r">WL (mbmp)</TableHead>
                    <TableHead className="text-center">Drawdown (m)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeIntervals.map((time, i) => (
                      <TableRow key={i} className={cn("h-11 border-slate-100", i % 2 === 0 ? "bg-white" : "bg-slate-50/20")}>
                          <TableCell className="text-center font-black text-slate-400 text-[10px] border-r">{time}</TableCell>
                          <TableCell className="p-1 border-r"><Input disabled={!canModify} value={formData.step1[i]?.waterLevel || ''} onChange={e => updateTableData('step1', i, 'waterLevel', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent focus:bg-white" /></TableCell>
                          <TableCell className="p-1 border-r bg-blue-50/10"><Input disabled={!canModify} value={formData.step1[i]?.drawdown || ''} onChange={e => updateTableData('step1', i, 'drawdown', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent font-bold text-blue-700 focus:bg-white" /></TableCell>
                          <TableCell className="p-1 border-r"><Input disabled={!canModify} value={formData.step2[i]?.waterLevel || ''} onChange={e => updateTableData('step2', i, 'waterLevel', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent focus:bg-white" /></TableCell>
                          <TableCell className="p-1 border-r bg-emerald-50/10"><Input disabled={!canModify} value={formData.step2[i]?.drawdown || ''} onChange={e => updateTableData('step2', i, 'drawdown', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent font-bold text-emerald-700 focus:bg-white" /></TableCell>
                          <TableCell className="p-1 border-r"><Input disabled={!canModify} value={formData.step3[i]?.waterLevel || ''} onChange={(e) => updateTableData('step3', i, 'waterLevel', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent focus:bg-white" /></TableCell>
                          <TableCell className="p-1 bg-amber-50/10"><Input disabled={!canModify} value={formData.step3[i]?.drawdown || ''} onChange={(e) => updateTableData('step3', i, 'drawdown', e.target.value)} className="h-8 text-center text-xs border-none bg-transparent font-bold text-amber-700 focus:bg-white" /></TableCell>
                      </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3 text-left">
             <Users className="size-4" /> 4. STAFF DETAILS (TEAM ASSIGNMENT)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
           <StaffMultiSelect label="Asst. Exec. Engineer" options={filteredStaff.aee} selected={formData.staffAssignment.assistantExecutiveEngineer} onChange={(names) => updateStaff('assistantExecutiveEngineer', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Assistant Engineer" options={filteredStaff.ae} selected={formData.staffAssignment.assistantEngineer} onChange={(names) => updateStaff('assistantEngineer', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Site Supervisor" options={filteredStaff.sup} selected={formData.staffAssignment.supervisor} onChange={(names) => updateStaff('supervisor', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Other Staff" options={filteredStaff.other} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={10} disabled={!isAllowed} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-12 pb-24 text-left text-left">
        <Button onClick={handleSave} disabled={isPending || !isAllowed || !canModify} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 gap-3 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
          {canModify ? (id ? 'UPDATE TECHNICAL LEDGER' : 'SYNCHRONIZE TO LEDGER') : 'ACCESS RESTRICTED'}
        </Button>
      </div>
    </div>
  );
}

export default function UnifiedBorewellPumpingEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>}>
            <UnifiedBorewellPumpingEntryContent />
        </Suspense>
    )
}