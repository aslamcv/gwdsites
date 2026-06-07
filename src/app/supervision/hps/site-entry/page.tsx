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
  User,
  ShieldCheck,
  Users,
  SearchCode,
  Lock,
  Wrench,
  Zap,
  Waves,
  ArrowRight
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
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { Logo } from '@/components/logo';

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

const handPumpOptions = ["India Mark II", "India Mark III", "Afridev", "Tara Pump", "Others"];

function UnifiedHPSSupervisionContent() {
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

  const canModify = isAllowed && (
    !id || 
    isOwner || 
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL || 
    userProfile?.role?.toLowerCase() === 'admin'
  );

  const [formData, setFormData] = useState<any>({
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    sector: 'government',
    category: 'Local Bodies',
    nameOfPlace: '',
    panchayathName: '',
    wellSize: '',
    typeOfHandPump: 'India Mark II',
    staticWaterLevel: '',
    depthOfPumpInstalled: '',
    platformSize: '',
    contractorName: '',
    measurementTakenBy: '',
    checkMeasurementBy: '',
    supervisorSignature: '',
    remarks: 'Installation completed successfully',
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
    const mapping = lsgMappings?.find(m => m.lsg === formData.panchayathName);
    return mapping?.constituency || '';
  }, [formData.panchayathName, lsgMappings]);

  const handleSave = () => {
    if (!user || !firestore || !canModify) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const reportData = {
        ...formData,
        id: reportId,
        applicantName: formData.nameOfPlace,
        lsgd: formData.panchayathName,
        status: 'Published' as const,
        purpose: "Supervision / HPS",
        category: "Supervision / HPS",
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
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'HPS technical record synchronized.' });
        router.push('/supervision');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: reportDocRef.path, 
          operation: isUpdate ? 'update' : 'create', 
          requestResourceData: reportData 
        }));
      });
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing HPS Node...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">HPS Installation Entry</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Technical Oversight | District Office, Malappuram</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-5">
              <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/supervision"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto text-left">
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
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 text-left">
             <MapPin className="size-4" /> BASIC SITE & ADMIN DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Place</Label>
              <Input disabled={!canModify} value={formData.nameOfPlace} onChange={(e) => updateField('nameOfPlace', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="LOCATION NAME" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Panchayath Name</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('panchayathName', v)} value={formData.panchayathName}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (LAC)</Label>
              <Input disabled value={detectedLac} className="h-11 border-slate-200 bg-slate-50 font-black text-blue-600 uppercase" placeholder="Auto-detected" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-600 flex items-center gap-3">
             <Wrench className="size-4" /> TECHNICAL INSTALLATION DATA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Well Size (mm)</Label>
              <Input disabled={!canModify} value={formData.wellSize} onChange={(e) => updateField('wellSize', e.target.value)} className="h-11 border-slate-200" placeholder="e.g. 150mm" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type of Hand Pump</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('typeOfHandPump', v)} value={formData.typeOfHandPump}>
                <SelectTrigger className="h-11 border-slate-200 font-black text-primary"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">{handPumpOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Static Water Level (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.staticWaterLevel} onChange={(e) => updateField('staticWaterLevel', e.target.value)} className="h-11 border-slate-200 font-bold text-blue-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Depth of Pump Installed (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.depthOfPumpInstalled} onChange={(e) => updateField('depthOfPumpInstalled', e.target.value)} className="h-11 border-slate-200 font-black text-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Size of Platform Constructed</Label>
              <Input disabled={!canModify} value={formData.platformSize} onChange={(e) => updateField('platformSize', e.target.value)} className="h-11 border-slate-200" placeholder="e.g. 1.2 x 1.2m" />
            </div>
             <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Measurement Taken By</Label>
              <Input disabled={!canModify} value={formData.measurementTakenBy} onChange={(e) => updateField('measurementTakenBy', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Check Measurement By</Label>
              <Input disabled={!canModify} value={formData.checkMeasurementBy} onChange={(e) => updateField('checkMeasurementBy', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Signature of Supervisor</Label>
              <Input disabled={!canModify} value={formData.supervisorSignature} onChange={(e) => updateField('supervisorSignature', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Remarks</Label>
              <Textarea disabled={!canModify} value={formData.remarks} onChange={(e) => updateField('remarks', e.target.value)} rows={3} className="rounded-2xl border-slate-200 italic" />
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
        <Button 
          onClick={handleSave} 
          disabled={isPending || !canModify} 
          className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 gap-3"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 
          {canModify ? (id ? 'UPDATE' : 'SAVE') + ' INSTALLATION RECORD' : 'ACCESS RESTRICTED'}
        </Button>
      </div>
    </div>
  );
}

export default function UnifiedHPSSupervisionPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing HPS Node...</div>}>
            <UnifiedHPSSupervisionContent />
        </Suspense>
    )
}