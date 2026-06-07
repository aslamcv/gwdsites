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
  MapPin,
  Calendar as CalendarIcon,
  Truck,
  Building,
  Users,
  SearchCode,
  Lock,
  Wind
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { cn } from '@/lib/utils';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const sectorOptions = [
  { id: 'private', label: 'Private' },
  { id: 'government', label: 'Government' },
  { id: 'other_district', label: 'Other District' },
];

const categoryMappings: Record<string, string[]> = {
  private: ["Drinking Water", "Agriculture", "Industrial", "Infrastructure", "Others"],
  government: ["Local Bodies", "Institutional", "GWBDWS", "Others"],
  other_district: ["Inter-District Project", "Emergency Support"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "PRIVATE RIG VEHICLE"
];

const borewellSizeOptions = ["110mm (4.5\")", "150mm (6\")", "200mm (8\")"];

function UnifiedFlushingEntryContent() {
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
    return (role === 'admin' || role === 'engineer') && isApproved;
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
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    conveyance: '',
    sector: 'private',
    category: 'Drinking Water',
    borewellSize: '150mm (6\")',
    fileNo: '',
    nameOfSite: '',
    address: '',
    lsgd: '',
    remittance: '',
    totalDepth: '',
    overburden: '',
    discharge: '',
    waterLevel: '',
    compressorWorkingHour: '2.5 hrs',
    remarks: 'Medium yield',
    observations: '',
    staffAssignment: {
        assistantExecutiveEngineer: [],
        assistantEngineer: [],
        supervisor: [],
        otherStaff: []
    }
  });

  useEffect(() => {
    if (cloudReport) {
      const SaData = cloudReport.staffAssignment || {};
      const dateParts = cloudReport.dateOfInvestigation?.split(' - ') || [];
      setFormData((prev: any) => ({
        ...prev,
        ...cloudReport,
        startDate: dateParts[0] || prev.startDate,
        endDate: dateParts[1] || prev.endDate,
        staffAssignment: {
          assistantExecutiveEngineer: Array.isArray(SaData.assistantExecutiveEngineer) ? SaData.assistantExecutiveEngineer : (SaData.assistantExecutiveEngineer ? (SaData.assistantExecutiveEngineer as string).split(', ') : []),
          assistantEngineer: Array.isArray(SaData.assistantEngineer) ? SaData.assistantEngineer : (SaData.assistantEngineer ? (SaData.assistantEngineer as string).split(', ') : []),
          supervisor: Array.isArray(SaData.supervisor) ? SaData.supervisor : (SaData.supervisor ? (SaData.supervisor as string).split(', ') : []),
          otherStaff: Array.isArray(SaData.otherStaff) ? SaData.otherStaff : (SaData.otherStaff ? (SaData.otherStaff as string).split(', ') : [])
        }
      }));
    }
  }, [cloudReport]);

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
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
    if (!user || !firestore || !canModify) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const dateOfInvestigation = `${formData.startDate}${formData.endDate ? ' - ' + formData.endDate : ''}`;

      const reportData = {
        ...formData,
        id: reportId,
        reportDate: formData.startDate,
        applicantName: formData.nameOfSite,
        status: 'Published' as const,
        purpose: `Supervision / Well Flushing / ${formData.sector} / ${formData.category}`,
        category: "Supervision / Well Flushing",
        workType: "FLUSHING",
        dateOfInvestigation,
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
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'Flushing technical supervision record synchronized.' });
        router.push('/supervision');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-5 text-left">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/supervision"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div>
              <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">Flushing supervision entry</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Well Development | District Office, Malappuram</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full lg:w-auto text-left">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                <CalendarIcon className="size-3 pointer-events-none" /> Start Date
              </Label>
              <Input disabled={!canModify} type="date" value={formData.startDate || ''} onChange={(e) => updateField('startDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><CalendarIcon className="size-3 pointer-events-none" /> End Date (Opt)</Label>
              <Input disabled={!canModify} type="date" value={formData.endDate || ''} onChange={(e) => updateField('endDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Truck className="size-3" /> Conveyance</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance || ''}>
                <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">{conveyanceOptions.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Sector</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('sector', v)} value={formData.sector || ''}>
                <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><SearchCode className="size-3" /> Category</Label>
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

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 text-left">
             <MapPin className="size-4" /> BASIC SITE & ADMIN DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File No</Label>
              <Input disabled={!canModify} value={formData.fileNo || ''} onChange={(e) => updateField('fileNo', e.target.value)} className="h-11 border-slate-200 font-black text-primary focus:bg-white" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Site</Label>
              <Input disabled={!canModify} value={formData.nameOfSite || ''} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="LOCATION NAME" />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</Label>
              <Input disabled={!canModify} value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)} className="h-11 border-slate-200" placeholder="Street/Area" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grama Panchayath / LSGD</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (LAC)</Label>
              <Input disabled value={detectedLac} className="h-11 border-slate-200 bg-slate-50 font-black text-blue-600 uppercase" placeholder="Auto-detected" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-3">
             <Wind className="size-4" /> TECHNICAL FLUSHING PARAMETERS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Borewell Size</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('borewellSize', v)} value={formData.borewellSize || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-black text-primary"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">{borewellSizeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Depth (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.totalDepth || ''} onChange={(e) => updateField('totalDepth', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Overburden (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.overburden || ''} onChange={(e) => updateField('overburden', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discharge (LPH)</Label>
              <Input disabled={!canModify} type="text" value={formData.discharge || ''} onChange={(e) => updateField('discharge', e.target.value)} className="h-11 border-slate-200 font-black text-blue-600" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Water Level (mbgl)</Label>
              <Input disabled={!canModify} type="text" value={formData.waterLevel || ''} onChange={(e) => updateField('waterLevel', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Compressor Working Hour</Label>
              <Input disabled={!canModify} value={formData.compressorWorkingHour} onChange={(e) => updateField('compressorWorkingHour', e.target.value)} placeholder="e.g. 2.5 hrs" className="h-11" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield Assessment</Label>
              <Select disabled={!canModify} onValueChange={(val) => updateField('remarks', val)} value={formData.remarks || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Low yield">Low Yield</SelectItem>
                  <SelectItem value="Medium yield">Medium Yield</SelectItem>
                  <SelectItem value="High yield">High Yield</SelectItem>
                  <SelectItem value="Dry well">Dry Well</SelectItem>
                  <SelectItem value="collapsed">Collapsed well</SelectItem>
                  <SelectItem value="damaged">Casing Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Field Observations (Post-Flushing)</Label>
            <Textarea disabled={!canModify} value={formData.observations || ''} onChange={(e) => updateField('observations', e.target.value)} rows={4} className="rounded-2xl border-slate-200 p-6 italic font-medium leading-relaxed" placeholder="Record yield recovery, water clarity or site specific technical notes here..." />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3 text-left">
             <Users className="size-4" /> 4. STAFF DETAILS (TEAM ASSIGNMENT)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StaffMultiSelect label="Asst. Exec. Engineer" options={filteredStaff.aee} selected={formData.staffAssignment.assistantExecutiveEngineer} onChange={(names) => updateStaff('assistantExecutiveEngineer', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Assistant Engineer" options={filteredStaff.ae} selected={formData.staffAssignment.assistantEngineer} onChange={(names) => updateStaff('assistantEngineer', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Site Supervisor" options={filteredStaff.sup} selected={formData.staffAssignment.supervisor} onChange={(names) => updateStaff('supervisor', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Other Staff (Max 10)" options={filteredStaff.other} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={10} disabled={!isAllowed} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-12 pb-24 text-left">
        <Button onClick={handleSave} disabled={isPending || !canModify} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 gap-3 hover:bg-blue-900 transition-all active:scale-95">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
          {canModify ? (id ? 'UPDATE TECHNICAL RECORD' : 'SAVE TECHNICAL RECORD') : 'Access Restricted'}
        </Button>
      </div>

    </div>
  );
}

export default function UnifiedFlushingEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>}>
            <UnifiedFlushingEntryContent />
        </Suspense>
    )
}