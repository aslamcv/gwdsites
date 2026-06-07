'use client';

import { Suspense, useState, useTransition, useEffect, useMemo } from 'react';
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
  Zap,
  Waves,
  Settings,
  Wind,
  Hammer
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
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const sectorOptions = [
  { id: 'private', label: 'Private' },
  { id: 'government', label: 'Government' },
  { id: 'institutional', label: 'Institutional' },
  { id: 'others', label: 'Others' },
];

const categoryMappings: Record<string, string[]> = {
  private: ["Domestic", "Agriculture", "Others"],
  government: ["Local Bodies", "Institutional", "GWBDWS", "Others"],
  institutional: ["Project Support", "Grant-in-Aid"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "DEPARTMENT VEHICLE"
];

function UnifiedMWSSSupervisionContent() {
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
    const role = (userProfile?.role || '').toLowerCase();
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
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    sector: 'government',
    category: 'Local Bodies',
    fileNo: '',
    nameOfSite: '',
    address: '',
    lsgd: '',
    nameOfContractor: '',
    pump3hp: '',
    cable4mm: '',
    upvc50mm: '',
    rope14mm: '',
    union40mm: '',
    nrv40mm: '',
    bend40mm: '',
    socket40mm: '',
    hexNipple: '',
    erection: '',
    panelBoard: '',
    ssAdaptor40mm: '',
    tank: '',
    structureTankPumpHouse: '',
    pvcBallValve50mm: '',
    distLine32mmTrench: '',
    distLine40mmTrench: '',
    distLine50mmTrench: '',
    demolishingConcrete: '',
    pccCoverDemolished: '',
    wellProtectionCover: '',
    remarks: '',
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
      setFormData((prev: any) => ({
        ...prev,
        ...cloudReport,
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

      const reportData = {
        ...formData,
        id: reportId,
        applicantName: formData.nameOfSite,
        status: 'Published' as const,
        purpose: "Supervision / MWSS",
        category: "Supervision / MWSS",
        updatedAt: new Date().toISOString(),
        uploadedBy: cloudReport?.uploadedBy || user.uid,
        staffAssignment: {
            assistantExecutiveEngineer: formData.staffAssignment.assistantExecutiveEngineer.join(', '),
            assistantEngineer: formData.staffAssignment.assistantEngineer.join(', '),
            supervisor: formData.staffAssignment.supervisor.join(', '),
            otherStaff: formData.staffAssignment.otherStaff.join(', ')
        }
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'MWSS technical record synchronized.' });
        router.push('/supervision');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing MWSS Node...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8 text-left">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">MWSS Supervision Entry</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Mini Water Supply Scheme | District Office, Malappuram</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-5">
              <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/supervision"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                  <CalendarIcon className="size-3 pointer-events-none" /> Completion Date
                </Label>
                <Input disabled={!canModify} type="date" value={formData.reportDate} onChange={(e) => updateField('reportDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Truck className="size-3" /> Conveyance</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">{conveyanceOptions.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Sector</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('sector', v)} value={formData.sector}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><SearchCode className="size-3" /> Sub Category</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('category', v)} value={formData.category}>
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
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3">
             <MapPin className="size-4" /> BASIC SITE & ADMIN DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File No</Label>
              <Input disabled={!canModify} value={formData.fileNo} onChange={(e) => updateField('fileNo', e.target.value)} className="h-11 border-slate-200 font-black text-primary focus:bg-white" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Site</Label>
              <Input disabled={!canModify} value={formData.nameOfSite} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="SCHEME NAME" />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</Label>
              <Input disabled={!canModify} value={formData.address} onChange={(e) => updateField('address', e.target.value)} className="h-11 border-slate-200" placeholder="Location Details" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contractor Name</Label>
              <Input disabled={!canModify} value={formData.nameOfContractor} onChange={(e) => updateField('nameOfContractor', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grama Panchayath / LSGD</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd}>
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
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
             <Settings className="size-4" /> TECHNICAL PARAMETERS (MWSS COMPLIANCE)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-12">
           <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">1. Pumping Unit & Power</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Submersible Pump (3HP)</Label><Input disabled={!canModify} value={formData.pump3hp || ''} onChange={(e) => updateField('pump3hp', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Cable 4mm (m)</Label><Input disabled={!canModify} value={formData.cable4mm || ''} onChange={(e) => updateField('cable4mm', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Panel Board</Label><Input disabled={!canModify} value={formData.panelBoard || ''} onChange={(e) => updateField('panelBoard', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Erection Charge</Label><Input disabled={!canModify} value={formData.erection || ''} onChange={(e) => updateField('erection', e.target.value)} className="h-10" /></div>
                </div>
           </div>

           <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Wind className="h-4 w-4 text-blue-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">2. Pipes & Technical Fittings</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">UPVC Pipe 50mm (m)</Label><Input disabled={!canModify} value={formData.upvc50mm || ''} onChange={(e) => updateField('upvc50mm', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Nylon Rope 14mm (m)</Label><Input disabled={!canModify} value={formData.rope14mm || ''} onChange={(e) => updateField('rope14mm', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">SS Adaptor 40mm</Label><Input disabled={!canModify} value={formData.ssAdaptor40mm || ''} onChange={(e) => updateField('ssAdaptor40mm', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">NRV 40mm</Label><Input disabled={!canModify} value={formData.nrv40mm || ''} onChange={(e) => updateField('nrv40mm', e.target.value)} className="h-10" /></div>
                </div>
           </div>

           <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Waves className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">3. Storage & Components</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Water Tank (Ltrs)</Label><Input disabled={!canModify} value={formData.tank || ''} onChange={(e) => updateField('tank', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Tank Platform & House</Label><Input disabled={!canModify} value={formData.structureTankPumpHouse || ''} onChange={(e) => updateField('structureTankPumpHouse', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Well Protection Cover</Label><Input disabled={!canModify} value={formData.wellProtectionCover || ''} onChange={(e) => updateField('wellProtectionCover', e.target.value)} className="h-10" /></div>
                </div>
           </div>

           <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Hammer className="h-4 w-4 text-slate-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">4. Civil & Distribution Lines</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">32mm Line (Trench) m</Label><Input disabled={!canModify} value={formData.distLine32mmTrench || ''} onChange={(e) => updateField('distLine32mmTrench', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">40mm Line (Trench) m</Label><Input disabled={!canModify} value={formData.distLine40mmTrench || ''} onChange={(e) => updateField('distLine40mmTrench', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">50mm Line (Trench) m</Label><Input disabled={!canModify} value={formData.distLine50mmTrench || ''} onChange={(e) => updateField('distLine50mmTrench', e.target.value)} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-bold text-slate-400 uppercase">Demolishing Concrete m³</Label><Input disabled={!canModify} value={formData.demolishingConcrete || ''} onChange={(e) => updateField('demolishingConcrete', e.target.value)} className="h-10" /></div>
                </div>
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
           <StaffMultiSelect label="Other Staff" options={filteredStaff.other} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={10} disabled={!isAllowed} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-12 pb-24 text-left">
        <Button onClick={handleSave} disabled={isPending || !canModify} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 gap-3 hover:bg-blue-900 transition-all active:scale-95"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 
          {canModify ? (id ? 'UPDATE SUPERVISION RECORD' : 'SAVE SUPERVISION RECORD') : 'ACCESS RESTRICTED'}
        </Button>
      </div>
    </div>
  );
}

export default function UnifiedMWSSSupervisionPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing MWSS Node...</div>}>
            <UnifiedMWSSSupervisionContent />
        </Suspense>
    )
}
