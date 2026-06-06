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
  Construction,
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
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
  government: ["Local Bodies", "Institutional", "Others"],
  institutional: ["Project Support", "Grant-in-Aid"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "DEPARTMENT VEHICLE"
];

function UnifiedARSDugwellContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lsgs, lsgMappings } = useLsgdData();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return true;
    const role = (userProfile?.role || '').toLowerCase();
    return (role === 'admin' || role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

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
    return cloudReport.uploadedBy === user.uid;
  }, [cloudReport, user]);

  const canModify = isAllowed && (isOwner || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL || userProfile?.role?.toLowerCase() === 'admin');

  const [formData, setFormData] = useState<any>({
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    sector: 'government',
    category: 'Local Bodies',
    fileNo: '',
    nameOfSite: '',
    address: '',
    lsgd: '',
    ward: '',
    applicantName: '',
    nameOfContractor: '',
    implementationYear: '2024-25',
    landType: 'Private',
    village: '',
    block: '',
    diameterOfWell: '',
    depthOfWell: '',
    swlBefore: '',
    swlAfter: '',
    soilType: '',
    nearestLandmark: '',
    rechargeEffectiveness: 'Good',
    remarks: '',
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
    if (!employees) return { assistantExecutiveEngineer: [], assistantEngineer: [], supervisor: [], otherStaff: [] };
    const aeeList = employees.filter(e => e.designation.toLowerCase().includes('assistant executive engineer'));
    const aeList = employees.filter(e => e.designation.toLowerCase().includes('assistant engineer'));
    const supList = employees.filter(e => ['Master Driller', 'Senior Driller', 'Driller', 'Driller Mechanic', 'Surveyor', 'Drilling Assistant'].includes(e.designation));
    const specialIds = [...aeeList, ...aeList, ...supList].map(e => e.id);
    const otherList = employees.filter(e => !specialIds.includes(e.id));
    return { 
      assistantExecutiveEngineer: aeeList, 
      assistantEngineer: aeList, 
      supervisor: supList, 
      otherStaff: otherList 
    };
  }, [employees]);

  const detectedLac = useMemo(() => {
    const mapping = lsgMappings?.find(m => m.lsg === formData.lsgd);
    return mapping?.constituency || '';
  }, [formData.lsgd, lsgMappings]);

  const handleSave = (goToPage2: boolean = false) => {
    if (!user || !firestore || !canModify) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const reportData = {
        ...formData,
        id: reportId,
        arsSubType: 'ARS_DUG_WELL_RECHARGE',
        applicantName: formData.nameOfSite,
        status: 'Published' as const,
        purpose: "Supervision / ARS Dugwell",
        category: "Supervision / ARS Dugwell",
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

      const operation = isUpdate ? updateDocumentNonBlocking(reportDocRef, reportData) : setDocumentNonBlocking(reportDocRef, reportData, { merge: true });
      
      toast({ title: 'Technical Draft Saved', description: 'Site information and staff assignments synchronized.' });

      if (goToPage2) {
        const nextPath = `/supervision/ars/dugwell-recharge/page-2?id=${reportId}`;
        router.push(nextPath);
      } else {
        router.push('/supervision');
      }
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing ARS Dugwell Node...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">ARS Dugwell Recharge</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Technical Oversight | District Office, Malappuram</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 text-left">
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
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Sector</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('sector', v)} value={formData.sector || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><SearchCode className="size-3" /> Sub Category</Label>
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

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3">
             <MapPin className="size-4" /> BASIC SITE & ADMIN DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File No</Label>
              <Input disabled={!canModify} value={formData.fileNo || ''} onChange={(e) => updateField('fileNo', e.target.value)} className="h-11 border-slate-200 font-black text-primary focus:bg-white" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheme/Site Name</Label>
              <Input disabled={!canModify} value={formData.nameOfSite || ''} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="LOCATION NAME" />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</Label>
              <Input disabled={!canModify} value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)} className="h-11 border-slate-200" placeholder="Street/Area" />
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contractor Name</Label>
              <Input disabled={!canModify} value={formData.nameOfContractor || ''} onChange={(e) => updateField('nameOfContractor', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
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
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Implementation Year</Label>
              <Input disabled={!canModify} value={formData.implementationYear || ''} onChange={(e) => updateField('implementationYear', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Application Date</Label>
              <Input disabled={!canModify} type="date" value={formData.applicationDate || ''} onChange={(e) => updateField('applicationDate', e.target.value)} className="h-11 border-slate-200" />
            </div>
             <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name of Beneficiary</Label>
              <Input disabled={!canModify} value={formData.applicantName || ''} onChange={(e) => updateField('applicantName', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Land Type</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('landType', v)} value={formData.landType || ''}>
                <SelectTrigger className="h-11 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Private">Private</SelectItem><SelectItem value="Government">Government</SelectItem><SelectItem value="Public/Community">Public/Community</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Revenue Village</Label>
              <Input disabled={!canModify} value={formData.village || ''} onChange={(e) => updateField('village', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Block Panchayath</Label>
              <Input disabled={!canModify} value={formData.block || ''} onChange={(e) => updateField('block', e.target.value)} className="h-11 border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
             <Construction className="size-4" /> TECHNICAL SPECIFICATIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diameter of Well (m)</Label>
              <Input disabled={!canModify} value={formData.diameterOfWell || ''} onChange={(e) => updateField('diameterOfWell', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Depth (m)</Label>
              <Input disabled={!canModify} type="text" value={formData.depthOfWell || ''} onChange={(e) => updateField('depthOfWell', e.target.value)} className="h-11 border-slate-200 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WL Before (mbgl)</Label>
              <Input disabled={!canModify} type="text" value={formData.swlBefore || ''} onChange={(e) => updateField('swlBefore', e.target.value)} className="h-11 bg-rose-50/50 border-rose-100 font-black text-rose-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WL After (mbgl)</Label>
              <Input disabled={!canModify} type="text" value={formData.swlAfter || ''} onChange={(e) => updateField('swlAfter', e.target.value)} className="h-11 bg-blue-50/50 border-blue-100 font-black text-blue-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Soil Type</Label>
              <Input disabled={!canModify} value={formData.soilType || ''} onChange={(e) => updateField('soilType', e.target.value)} className="h-11 border-slate-200" placeholder="e.g. Lateritic" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nearest Landmark</Label>
              <Input disabled={!canModify} value={formData.nearestLandmark || ''} onChange={(e) => updateField('nearestLandmark', e.target.value)} className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Recharge Effectiveness</Label>
                <Select disabled={!canModify} onValueChange={(v) => updateField('rechargeEffectiveness', v)} value={formData.rechargeEffectiveness || ''}>
                  <SelectTrigger className="h-11 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Technical Remarks</Label>
            <Textarea disabled={!canModify} value={formData.remarks || ''} onChange={(e) => updateField('remarks', e.target.value)} rows={3} className="rounded-2xl border-slate-200 italic text-[11px] uppercase font-bold" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
             <Users className="size-4" /> 4. STAFF DETAILS (TEAM ASSIGNMENT)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StaffMultiSelect label="Asst. Exec. Engineer" options={filteredStaff.assistantExecutiveEngineer} selected={formData.staffAssignment.assistantExecutiveEngineer} onChange={(names) => updateStaff('assistantExecutiveEngineer', names)} max={1} disabled={!canModify} />
           <StaffMultiSelect label="Assistant Engineer" options={filteredStaff.assistantEngineer} selected={formData.staffAssignment.assistantEngineer} onChange={(names) => updateStaff('assistantEngineer', names)} max={1} disabled={!canModify} />
           <StaffMultiSelect label="Site Supervisor" options={filteredStaff.supervisor} selected={formData.staffAssignment.supervisor} onChange={(names) => updateStaff('supervisor', names)} max={1} disabled={!canModify} />
           <StaffMultiSelect label="Other Staff" options={filteredStaff.otherStaff} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={10} disabled={!canModify} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-12 pb-24">
        <div className="flex items-center gap-4">
            <Button onClick={() => handleSave(false)} disabled={isPending || !canModify} variant="ghost" className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors">
              SAVE DRAFT
            </Button>
            <Button 
              onClick={() => handleSave(true)} 
              disabled={isPending || !canModify} 
              className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95 gap-3"
            >
              {isPending ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />} 
              {canModify ? 'FINALIZE & CONTINUE' : 'ACCESS RESTRICTED'}
            </Button>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedARSDugwellEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing ARS Dugwell Node...</div>}>
            <UnifiedARSDugwellContent />
        </Suspense>
    )
}
