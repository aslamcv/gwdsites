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
  Wrench
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
  private: ["Domestic", "Agriculture", "Others"],
  government: ["Local Bodies", "Institutional", "GWBDWS", "Others"],
  other_district: ["Project Support", "Emergency"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "DEPARTMENT VEHICLE"
];

const SPARES_LIST = [
  { id: 'pullOutReerection', label: 'Pull out and reerection of India Mark II' },
  { id: 'headAssemblyComplete', label: 'Head assembly complete' },
  { id: 'headWeldedComponents', label: 'Head with welded components only w/o cover' },
  { id: 'handle', label: 'Handle' },
  { id: 'additionalPlate', label: 'Additional Plate' },
  { id: 'frontCover', label: 'Front cover' },
  { id: 'axle', label: 'Axle' },
  { id: 'ballBearing6204Z', label: 'Ball Bearing 6204 Z' },
  { id: 'chainWithCoupling', label: 'Chain with coupling' },
  { id: 'washerForAxilPin', label: 'washer for Axil pin' },
  { id: 'm12x20HexBolt', label: 'M 12 X 20 Hex Bolt' },
  { id: 'm12x40HexBolt', label: 'M 12 X 40 Hex Bolt' },
  { id: 'm12Nut', label: 'M 12 Nut' },
  { id: 'm12Washer', label: 'M 12 Washer' },
  { id: 'm10x40HtBolt', label: 'M 10 X 40 H t Bolt' },
  { id: 'm10NylocNut', label: 'M 10 Nyloc Nut' },
  { id: 'specialWasherForAxle', label: 'Special washer for axle' },
  { id: 'cylinderAssemblyComplete', label: 'Cylinder assembly complete' },
  { id: 'cylinderBodyWithLiner', label: 'Cylinder body with liner' },
  { id: 'plungerRoadSS', label: 'Plunger road S S' },
  { id: 'reducerCup', label: 'Reducer cup' },
  { id: 'plungerYokeBody', label: 'Plunger yoke body' },
  { id: 'spacerForAxilPin', label: 'Spacer for Axil pin' },
  { id: 'follower', label: 'follower' },
  { id: 'upperValve', label: 'upper valve' },
  { id: 'checkValveGuide', label: 'check valve guide' },
  { id: 'checkValveSeat', label: 'check valve seat' },
  { id: 'rubberSeatRetainer', label: 'Rubber seat retainer' },
  { id: 'sealingRing', label: 'Sealing ring' },
  { id: 'rubberSeatingUpperValve', label: 'Rubber seating upper valve' },
  { id: 'rubberSeatingChekValve', label: 'Rubber seating chek valve' },
  { id: 'pumpBucket', label: 'Pump bucket' },
  { id: 'upperValveAssembly', label: 'Upper valve assembly' },
  { id: 'lowerValveAssembly', label: 'Lower Valve assembly' },
  { id: 'waterTank', label: 'Water Tank' },
  { id: 'pipeSocket32mm', label: 'Pipe socket (32mm Dia.)' },
  { id: 'pedestal', label: 'Pedestal' },
  { id: 'connectingRod3m', label: '12mm dia X 1.75 X 3 M connecting rod' },
  { id: 'hexCoupler12x50', label: 'Hex. Coupler 12 X 50 mm' },
  { id: 'raiserPipe3m', label: '32 mm GI Raiser pipe 3M (one socket)' },
];

function UnifiedHPRSupervisionContent() {
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

  const [formData, setFormData] = useState<any>(() => {
    const initial: any = {
      reportDate: new Date().toISOString().split('T')[0],
      conveyance: '',
      sector: 'government',
      category: 'Local Bodies',
      fileNo: '',
      nameOfSite: '',
      address: '',
      lsgd: '',
      nameOfContractor: '',
      remarks: 'Repair completed successfully',
      observations: '',
      staffAssignment: {
          assistantExecutiveEngineer: [],
          assistantEngineer: [],
          supervisor: [],
          otherStaff: []
      }
    };
    SPARES_LIST.forEach(s => { initial[s.id] = ''; });
    return initial;
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
        status: 'Published' as const,
        purpose: "Supervision / HPR",
        category: "Supervision / HPR",
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
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'HPR technical record synchronized.' });
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
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing HPR Node...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">HPR Supervision Entry</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Hand Pump Repair | District Office, Malappuram</p>
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
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File No</Label>
              <Input disabled={!canModify} value={formData.fileNo || ''} onChange={(e) => updateField('fileNo', e.target.value)} className="h-11 border-slate-200 font-black text-primary focus:bg-white" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Site</Label>
              <Input disabled={!canModify} value={formData.nameOfSite || ''} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="LOCATION NAME" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grama Panchayath / LSGD</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-600 flex items-center gap-3">
             <Wrench className="size-4" /> SPARES & TECHNICAL REPAIR DATA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {SPARES_LIST.map(item => (
              <div key={item.id} className="space-y-1.5 text-left">
                <Label htmlFor={item.id} className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</Label>
                <Input 
                  id={item.id} 
                  disabled={!canModify}
                  value={formData[item.id] || ''} 
                  onChange={(e) => updateField(item.id, e.target.value)}
                  className="h-10 text-sm bg-slate-50/50 border-slate-200 rounded-lg"
                  placeholder="Qty/No"
                />
              </div>
            ))}
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
        <Button onClick={handleSave} disabled={isPending || !canModify} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 gap-3 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-95">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
          {canModify ? (id ? 'UPDATE REPAIR RECORD' : 'SAVE REPAIR RECORD') : 'ACCESS RESTRICTED'}
        </Button>
      </div>
    </div>
  );
}

export default function UnifiedHPRSupervisionPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing HPR Node...</div>}>
            <UnifiedHPRSupervisionContent />
        </Suspense>
    )
}