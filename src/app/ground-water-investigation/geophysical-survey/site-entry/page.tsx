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
  Activity, 
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Truck,
  Building,
  Users,
  Settings,
  Calculator,
  SearchCode,
  Lock,
  Waves,
  X
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee, VesRow } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const sectorOptions = [
  { id: 'private', label: 'Private' },
  { id: 'government', label: 'Government' },
  { id: 'local_bodies', label: 'Local Bodies' },
  { id: 'others', label: 'Others' },
];

const categoryMappings: Record<string, string[]> = {
  private: ["Domestic", "Irrigation", "Industrial", "Infrastructure", "Others"],
  government: ["Institutional", "Infrastructure", "Industrial", "Others"],
  local_bodies: ["Scheme", "Institutional"],
  others: ["Miscellaneous", "Emergency Work", "Special Survey"]
};

const conveyanceOptions = [
  "TATA SUMO GOLD (KL01CE7618)",
  "RENTED VEHICLE",
  "PERSONAL VEHICLE",
  "GENERAL TRANSPORT",
  "SKE DTH RIG VEHICLE",
  "PT UNIT VEHICLE"
];

const staticVesData = [
  { sNo: '1', ab2: 1.5, mn2: 0.5, k: 6.3 },
  { sNo: '2', ab2: 2, mn2: 0.5, k: 11.8 },
  { sNo: '3', ab2: 2.5, mn2: 0.5, k: 18.8 },
  { sNo: '4', ab2: 3, mn2: 0.5, k: 27.5 },
  { sNo: '5', ab2: 4, mn2: 0.5, k: 49.5 },
  { sNo: '6', ab2: 6, mn2: 0.5, k: 112.3 },
  { sNo: '7', ab2: 8, mn2: 0.5, k: 200.3 },
  { sNo: '7A', ab2: 8, mn2: 2, k: 47.1 },
  { sNo: '8', ab2: 10, mn2: 0.5, k: 313.4 },
  { sNo: '8A', ab2: 10, mn2: 2, k: 75.4 },
  { sNo: '9', ab2: 15, mn2: 2, k: 173.6 },
  { sNo: '10', ab2: 20, mn2: 2, k: 311.0 },
  { sNo: '11', ab2: 25, mn2: 2, k: 487.7 },
  { sNo: '11A', ab2: 25, mn2: 6, k: 154.2 },
  { sNo: '12', ab2: 30, mn2: 2, k: 703.7 },
  { sNo: '12A', ab2: 30, mn2: 6, k: 226.2 },
  { sNo: '13', ab2: 35, mn2: 6, k: 311.3 },
  { sNo: '14', ab2: 40, mn2: 6, k: 409.5 },
  { sNo: '15', ab2: 45, mn2: 6, k: 520.7 },
  { sNo: '16', ab2: 50, mn2: 6, k: 645.1 },
  { sNo: '18', ab2: 60, mn2: 6, k: 933.1 },
  { sNo: '20', ab2: 70, mn2: 6, k: 1273.4 },
  { sNo: '20A', ab2: 70, mn2: 20, k: 353.4 },
  { sNo: '22', ab2: 80, mn2: 6, k: 1666.1 },
  { sNo: '22A', ab2: 80, mn2: 20, k: 471.2 },
  { sNo: '24', ab2: 90, mn2: 20, k: 604.8 },
  { sNo: '26', ab2: 100, mn2: 20, k: 754.0 },
  { sNo: '27', ab2: 125, mn2: 20, k: 1195.8 },
  { sNo: '28', ab2: 150, mn2: 20, k: 1735.7 },
];

const recommendationTypeOptions = [
  { value: 'borewell', label: 'Bore well' },
  { value: 'openwell', label: 'Open well' },
  { value: 'filterpoint', label: 'Filter point well' },
  { value: 'tubewell', label: 'Tube well' },
  { value: 'not_feasible', label: 'Not feasible for Open well & Bore well' },
];

const borewellDiameterOptions = [
  { value: '110mm', label: '110mm (4.5")' },
  { value: '150mm', label: '150mm (6")' },
  { value: '200mm', label: '200mm (8")' },
];

const openwellDiameterOptions = Array.from({ length: 11 }, (_, i) => {
  const val = (1 + i * 0.5).toString();
  return { value: val, label: `${val}m` };
});

function UnifiedGeophysicalSurveyContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lsgs, lsgMappings } = useLsgdData();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');

  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [isNearbyDialogOpen, setIsNearbyDialogOpen] = useState(false);
  const [selectedNearbyStructure, setSelectedNearbyStructure] = useState<string | null>(null);

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
    return (role === 'admin' || role === 'scientist') && isApproved;
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
    category: 'Domestic',
    fileNo: '',
    location: '',
    latitude: '',
    longitude: '',
    lsgd: '',
    spreadingDirection: 'NE-SW',
    vesArea: '',
    vesRecommendation: 'Lateritic terrain with Overburden thickness of approximately 20m inferred from VES data followed by bedrock with indication of Minor Fracture at approx 80m depth. A low yielding borewell may be feasible at the location. OB-20m TD-110m',
    recommendationType: '',
    recBorewellTotalDepth: '',
    recBorewellDiameter: '',
    expectedOverburden: '',
    recommendationBorewell: '',
    recOpenwellTotalDepth: '',
    recOpenwellDiameter: '',
    recommendationOpenwell: '',
    nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '',
    nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '',
    nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '',
    noNearbyBorewells: false,
    nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial',
    nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial',
    nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial',
    noNearbyOpenwells: false,
    vesData: staticVesData.map((row) => ({
      ...row,
      ves1_r: '',
      ves1_ra: '',
      ves2_r: '',
      ves2_ra: '',
    })),
    staffAssignment: {
        geophysicist: [],
        juniorGeophysicist: [],
        geophysicalAssistant: [],
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
          geophysicist: Array.isArray(SaData.geophysicist) ? SaData.geophysicist : (SaData.geophysicist ? (SaData.geophysicist as string).split(', ') : []),
          juniorGeophysicist: Array.isArray(SaData.juniorGeophysicist) ? SaData.juniorGeophysicist : (SaData.juniorGeophysicist ? (SaData.juniorGeophysicist as string).split(', ') : []),
          geophysicalAssistant: Array.isArray(SaData.geophysicalAssistant) ? SaData.geophysicalAssistant : (SaData.geophysicalAssistant ? (SaData.geophysicalAssistant as string).split(', ') : []),
          otherStaff: Array.isArray(SaData.otherStaff) ? SaData.otherStaff : (SaData.otherStaff ? (SaData.otherStaff as string).split(', ') : [])
        }
      }));
    }
  }, [cloudReport]);

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateVesRow = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newVes = [...prev.vesData];
      const k = staticVesData[index].k;
      newVes[index] = { ...newVes[index], [field]: value };
      if (field === 'ves1_r') {
        const r = parseFloat(value);
        if (!isNaN(r)) newVes[index].ves1_ra = (r * k).toFixed(2);
      }
      return { ...prev, vesData: newVes };
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
    if (!employees) return { hg: [], jhg: [], ga: [], other: [] };
    const hgList = employees.filter(e => e.designation.toLowerCase() === 'geophysicist');
    const jhgList = employees.filter(e => e.designation.toLowerCase() === 'junior geophysicist');
    const gaList = employees.filter(e => e.designation.toLowerCase() === 'geophysical assistant');
    const specialIds = [...hgList, ...jhgList, ...gaList].map(e => e.id);
    const otherList = employees.filter(e => !specialIds.includes(e.id));
    return { hg: hgList, jhg: jhgList, ga: gaList, other: otherList };
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

      const dateOfInvestigation = `${formData.startDate}${formData.endDate ? ' - ' + formData.endDate : ''}`;

      const reportData = {
        ...formData,
        id: reportId,
        reportDate: formData.startDate,
        applicantName: formData.location,
        status: 'Published' as const,
        purpose: "Ground Water Investigation / Geophysical Survey",
        category: "Geophysical Survey",
        dateOfInvestigation,
        updatedAt: new Date().toISOString(),
        uploadedBy: cloudReport?.uploadedBy || user.uid,
        assembly: detectedLac,
        staffAssignment: {
            geophysicist: formData.staffAssignment.geophysicist.join(', '),
            juniorGeophysicist: formData.staffAssignment.juniorGeophysicist.join(', '),
            geophysicalAssistant: formData.staffAssignment.geophysicalAssistant.join(', '),
            otherStaff: formData.staffAssignment.otherStaff.join(', ')
        }
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: isUpdate ? 'Record Updated' : 'Record Saved', description: 'VES technical record synchronized.' });
        router.push('/ground-water-investigation');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: reportDocRef.path, 
          operation: isUpdate ? 'update' : 'create', 
          requestResourceData: reportData 
        }));
      });
    });
  };

  const handleNearbyTypeSelect = (type: string, value: string) => {
    if (value === 'none') {
        if(type === 'borewell') {
          const current = formData.noNearbyBorewells;
          updateField('noNearbyBorewells', !current);
          if (!current) setSelectedNearbyStructure(null);
        }
        if(type === 'openwell') {
          const current = formData.noNearbyOpenwells;
          updateField('noNearbyOpenwells', !current);
          if (!current) setSelectedNearbyStructure(null);
        }
    } else {
        if(type === 'borewell') updateField('noNearbyBorewells', false);
        if(type === 'openwell') updateField('noNearbyOpenwells', false);
        setSelectedNearbyStructure(value);
        setIsNearbyDialogOpen(true);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50 text-left">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">Vertical Electrical Sounding (VES)</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Technical Operations | District Office, Malappuram</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 text-left text-left">
            <div className="flex items-center gap-5 text-left text-left">
              <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/ground-water-investigation"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full lg:w-auto text-left text-left">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                  <CalendarIcon className="size-3 pointer-events-none" /> Start Date
                </Label>
                <Input disabled={!isAllowed} type="date" value={formData.startDate || ''} onChange={(e) => updateField('startDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><CalendarIcon className="size-3 pointer-events-none" /> End Date</Label>
                <Input disabled={!isAllowed} type="date" value={formData.endDate || ''} onChange={(e) => updateField('endDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Truck className="size-3" /> Conveyance</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">{conveyanceOptions.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Sector</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateField('sector', v)} value={formData.sector || ''}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><SearchCode className="size-3" /> Sub Category</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateField('category', v)} value={formData.category || ''}>
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

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 text-left text-left">
             <MapPin className="size-4" /> BASIC SITE DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left text-left text-left">
            <div className="space-y-2 text-left text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File No</Label>
              <Input disabled={!canModify} value={formData.fileNo || ''} onChange={(e) => updateField('fileNo', e.target.value)} className="h-11 border-slate-200 font-black text-primary focus:bg-white" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2 lg:col-span-1 text-left text-left">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location (Site Name)</Label>
              <Input disabled={!canModify} value={formData.location || ''} onChange={(e) => updateField('location', e.target.value)} className="h-11 border-slate-200 uppercase font-bold text-primary" placeholder="LOCATION NAME" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</Label>
              <Input disabled={!canModify} value={formData.latitude || ''} onChange={(e) => updateField('latitude', e.target.value)} className="h-11 border-slate-200 font-mono" placeholder={`00°00'00" N`} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</Label>
              <Input disabled={!canModify} value={formData.longitude || ''} onChange={(e) => updateField('longitude', e.target.value)} className="h-11 border-slate-200 font-mono" placeholder={`00°00'00" E`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left text-left text-left text-left">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LSGD (Panchayath)</Label>
              <Select disabled={!canModify} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd || ''}>
                <SelectTrigger className="h-11 border-slate-200 font-bold"><SelectValue placeholder="Select LSGD" /></SelectTrigger>
                <SelectContent className="max-h-[400px] rounded-2xl text-left">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Constituency (LAC)</Label>
              <Input disabled value={detectedLac} className="h-11 border-slate-200 bg-slate-50 font-black text-blue-600 uppercase" placeholder="Auto-populated" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Orientation</Label>
              <Input disabled={!canModify} value={formData.spreadingDirection || ''} onChange={(e) => updateField('spreadingDirection', e.target.value)} className="h-11 border-slate-200 uppercase font-black" placeholder="e.g. NE-SW" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Details</Label>
              <Input disabled={!canModify} value={formData.vesArea || ''} onChange={(e) => updateField('vesArea', e.target.value)} className="h-11 border-slate-200 italic" placeholder="e.g. 6M towards East" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center justify-between text-left text-left">
             <div className="flex items-center gap-3 text-left text-left text-left"><Calculator className="size-4" /> VES MEASUREMENT DATA (Auto-Calculating)</div>
             <Badge className="bg-slate-900 text-[8px] font-black h-5 uppercase tracking-tighter">Schlumberger Configuration</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto text-left text-left">
          <ScrollArea className="h-[600px] w-full text-left text-left">
            <Table>
                <TableHeader className="bg-slate-100/50 sticky top-0 z-20">
                  <TableRow className="h-10 text-left text-left">
                    <TableHead className="w-24 text-center border-r">Sl No</TableHead>
                    <TableHead className="text-center border-r" colSpan={3}>Measuring Point / Spreading Direction</TableHead>
                    <TableHead className="text-center" colSpan={2}>VES Data</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-center border-r font-black text-[9px] uppercase">AB/2 (m)</TableHead>
                    <TableHead className="text-center border-r font-black text-[9px] uppercase">MN/2 (m)</TableHead>
                    <TableHead className="text-center border-r bg-primary/5 font-black text-[9px] uppercase">K (Factor)</TableHead>
                    <TableHead className="text-center border-r font-black text-[9px] uppercase">R (Ohms)</TableHead>
                    <TableHead className="text-center font-black text-[9px] uppercase">ρa (Ohm meter)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.vesData.map((row: any, i: number) => (
                    <TableRow key={`ves-row-${row.sNo}-${i}`} className={cn("h-11 border-slate-100 transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                      <TableCell className="text-center font-bold text-slate-300 text-[10px] border-r text-left">{row.sNo}</TableCell>
                      <TableCell className="text-center border-r text-xs font-bold bg-slate-50/20">{row.ab2}</TableCell>
                      <TableCell className="text-center border-r text-xs font-bold bg-slate-50/20">{row.mn2}</TableCell>
                      <TableCell className="text-center border-r text-xs font-mono text-primary bg-primary/5">{row.k}</TableCell>
                      <TableCell className="border-r p-1">
                        <Input 
                          disabled={!canModify}
                          value={row.ves1_r || ''} 
                          onChange={(e) => updateVesRow(i, 'ves1_r', e.target.value)} 
                          className="h-8 text-center text-xs border-transparent bg-transparent focus:bg-white shadow-none font-bold" 
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="p-1 bg-primary/5">
                        <Input 
                          readOnly 
                          value={row.ves1_ra || ''} 
                          className="h-8 text-center text-xs border-transparent bg-transparent font-black text-blue-700 shadow-none" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 text-left text-left">4. REPORT & RECOMMENDATION</CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-10 text-left text-left">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Technical Assessment & Recommendation</Label>
            <Textarea 
              disabled={!canModify}
              value={formData.vesRecommendation || ''} 
              onChange={(e) => updateField('vesRecommendation', e.target.value)} 
              rows={4}
              className="border-slate-200 rounded-2xl p-6 italic text-slate-700 leading-relaxed font-medium" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-left text-left">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1 text-left">Structure Recommendation Type</Label>
              <Select disabled={!canModify} onValueChange={(val) => {updateField('recommendationType', val); setIsRecommendationDialogOpen(true);}} value={formData.recommendationType}>
                <SelectTrigger className="h-14 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm text-left">
                  <SelectValue placeholder="ENTER THE DETAILS" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                  {recommendationTypeOptions.map(o => (
                    <SelectItem key={o.value} value={o.value} className="py-3 font-bold text-xs uppercase cursor-pointer">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1 text-left">Nearby groundwater structures</Label>
               <div className="flex flex-col gap-6 text-left">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 text-left">Borewell Status</Label>
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                      {['borewell1', 'borewell2', 'borewell3'].map((val, idx) => (
                        <Button 
                          key={val}
                          type="button" 
                          variant={formData[`nearbyBorewell${idx+1}Depth`] && !formData.noNearbyBorewells ? 'default' : 'ghost'}
                          className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData[`nearbyBorewell${idx+1}Depth`] && !formData.noNearbyBorewells ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-500")}
                          onClick={() => handleNearbyTypeSelect('borewell', val)}
                          disabled={!canModify}
                        >
                          BW-{idx + 1}
                        </Button>
                      ))}
                      <Button 
                        type="button" 
                        variant={formData.noNearbyBorewells ? 'destructive' : 'ghost'}
                        className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData.noNearbyBorewells ? "bg-rose-600 text-white shadow-md" : "text-slate-500")}
                        onClick={() => handleNearbyTypeSelect('borewell', 'none')}
                        disabled={!canModify}
                      >
                        NO BOREWELL
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 text-left">Openwell Status</Label>
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                      {['openwell1', 'openwell2', 'openwell3'].map((val, idx) => (
                        <Button 
                          key={val}
                          type="button" 
                          variant={formData[`nearbyOpenwell${idx+1}Depth`] && !formData.noNearbyOpenwells ? 'default' : 'ghost'}
                          className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData[`nearbyOpenwell${idx+1}Depth`] && !formData.noNearbyOpenwells ? "bg-emerald-600 text-white shadow-md" : "text-slate-500")}
                          onClick={() => handleNearbyTypeSelect('openwell', val)}
                          disabled={!canModify}
                        >
                          OW-{idx + 1}
                        </Button>
                      ))}
                      <Button 
                        type="button" 
                        variant={formData.noNearbyOpenwells ? 'destructive' : 'ghost'}
                        className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData.noNearbyOpenwells ? "bg-rose-600 text-white shadow-md" : "text-slate-500")}
                        onClick={() => handleNearbyTypeSelect('openwell', 'none')}
                        disabled={!canModify}
                      >
                        NO OPENWELL
                      </Button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white text-left text-left">
        <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3 text-left text-left">
             <Users className="size-4" /> 5. STAFF DETAILS (TEAM ASSIGNMENT)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left text-left">
           <StaffMultiSelect label="Geophysicist" options={filteredStaff.hg} selected={formData.staffAssignment.geophysicist} onChange={(names) => updateStaff('geophysicist', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Junior Geophysicist" options={filteredStaff.jhg} selected={formData.staffAssignment.juniorGeophysicist} onChange={(names) => updateStaff('juniorGeophysicist', names)} max={1} disabled={!isAllowed} />
           <StaffMultiSelect label="Geophysical Assistant" options={filteredStaff.ga} selected={formData.staffAssignment.geophysicalAssistant} onChange={(names) => updateStaff('geophysicalAssistant', names)} max={2} disabled={!isAllowed} />
           <StaffMultiSelect label="Other Staff" options={filteredStaff.other} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={5} disabled={!isAllowed} />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-12 pb-24 text-left text-left">
        <Button 
          type="button"
          onClick={handleSave} 
          disabled={isPending || !canModify} 
          className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 gap-3 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
          {canModify ? (id ? 'UPDATE SURVEY RECORD' : 'SAVE SURVEY RECORD') : 'ACCESS RESTRICTED'}
        </Button>
      </div>

      <RecommendationDialog
        isOpen={isRecommendationDialogOpen}
        onOpenChange={setIsRecommendationDialogOpen}
        formData={formData}
        updateField={updateField}
      />

      <NearbyStructureDialog 
        isOpen={isNearbyDialogOpen}
        onOpenChange={setIsNearbyDialogOpen}
        structureType={selectedNearbyStructure}
        formData={formData}
        updateField={updateField}
      />
    </div>
  );
}

const FormFieldItem = ({ label, id, children, className }: {label:string, id:string, children: React.ReactNode, className?:string}) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={id} className="text-[10px] font-black uppercase text-slate-500">{label}</Label>
    {children}
  </div>
);

const RecommendationDialog = ({isOpen, onOpenChange, formData, updateField}: any) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
      <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-center">TECHNICAL RECOMMENDATION</DialogTitle></DialogHeader>
      {(formData.recommendationType === 'borewell' || formData.recommendationType === 'tubewell' || formData.recommendationType === 'filterpoint') && (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <FormFieldItem label="Total Depth (m)" id="recBorewellTotalDepth"><Input value={formData.recBorewellTotalDepth} onChange={e => updateField('recBorewellTotalDepth', e.target.value)}/></FormFieldItem>
            <FormFieldItem label="Diameter" id="recBorewellDiameter">
               <Select onValueChange={v=>updateField('recBorewellDiameter', v)} value={formData.recBorewellDiameter}>
                 <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-xl border-slate-200">
                    {borewellDiameterOptions.map(o=><SelectItem key={o.value} value={o.value} className="text-xs font-bold">{o.label}</SelectItem>)}
                 </SelectContent>
               </Select>
            </FormFieldItem>
          </div>
          <FormFieldItem label="Expected Overburden (m)" id="expectedOverburden"><Input value={formData.expectedOverburden} onChange={e => updateField('expectedOverburden', e.target.value)}/></FormFieldItem>
          <FormFieldItem label="Details" id="recommendationBorewell"><Textarea value={formData.recommendationBorewell} onChange={e => updateField('recommendationBorewell', e.target.value)} className="min-h-[100px] text-xs font-bold uppercase"/></FormFieldItem>
        </div>
      )}
      {formData.recommendationType === 'openwell' && (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <FormFieldItem label="Total Depth (m)" id="recOpenwellTotalDepth"><Input value={formData.recOpenwellTotalDepth} onChange={e => updateField('recOpenwellTotalDepth', e.target.value)}/></FormFieldItem>
            <FormFieldItem label="Diameter (m)" id="recOpenwellDiameter">
              <Select onValueChange={v=>updateField('recOpenwellDiameter', v)} value={formData.recOpenwellDiameter}>
                 <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200"><SelectValue /></SelectTrigger>
                 <SelectContent className="rounded-xl border-slate-200">
                    {openwellDiameterOptions.map(o=><SelectItem key={o.value} value={o.value} className="text-xs font-bold">{o.label}</SelectItem>)}
                 </SelectContent>
               </Select>
            </FormFieldItem>
          </div>
          <FormFieldItem label="Details" id="recommendationOpenwell"><Textarea value={formData.recommendationOpenwell} onChange={e => updateField('recommendationOpenwell', e.target.value)} className="min-h-[100px] text-xs font-bold uppercase"/></FormFieldItem>
        </div>
      )}
      {(!formData.recommendationType || formData.recommendationType === 'not_feasible') && (
        <div className="py-12 text-center opacity-30 uppercase font-black tracking-widest text-left">
           No specific parameters required.
        </div>
      )}
      <DialogFooter className="pt-4"><Button type="button" onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg bg-[#1e3a8a] text-white hover:bg-blue-900">Confirm Parameters</Button></DialogFooter>
    </DialogContent>
  </Dialog>
);

const NearbyStructureDialog = ({isOpen, onOpenChange, structureType, formData, updateField}: any) => {
  const isBorewell = structureType?.startsWith('borewell');
  const index = structureType ? parseInt(structureType.slice(-1)) : 1;
  
  return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl text-left text-left">
      <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-left">DETAILS FOR {structureType?.toUpperCase()}</DialogTitle></DialogHeader>
      {isBorewell ? (
        <div className="space-y-6 py-4 text-left text-left">
          <FormFieldItem label="Total Depth (m)" id={`nbd${index}`}><Input value={formData[`nearbyBorewell${index}Depth`]} onChange={e=>updateField(`nearbyBorewell${index}Depth`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Diameter" id={`nbd_dia${index}`}><Input value={formData[`nearbyBorewell${index}Diameter`]} onChange={e=>updateField(`nearbyBorewell${index}Diameter`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Fracture Zones" id={`nbd_zones${index}`}><Input value={formData[`nearbyBorewell${index}Zones`]} onChange={e=>updateField(`nearbyBorewell${index}Zones`, e.target.value)} /></FormFieldItem>
        </div>
      ) : (
         <div className="space-y-6 py-4 text-left text-left">
          <FormFieldItem label="Total Depth (m)" id={`nod${index}`}><Input value={formData[`nearbyOpenwell${index}Depth`]} onChange={e=>updateField(`nearbyOpenwell${index}Depth`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Water Level (m)" id={`nod_wl${index}`}><Input value={formData[`nearbyOpenwell${index}WaterLevel`]} onChange={e=>updateField(`nearbyOpenwell${index}WaterLevel`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Parapet (m)" id={`nod_ph${index}`}><Input value={formData[`nearbyOpenwell${index}ParapetHeight`]} onChange={e=>updateField(`nearbyOpenwell${index}ParapetHeight`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Type" id={`nod_type${index}`}>
            <Select onValueChange={v=>updateField(`nearbyOpenwell${index}Type`, v)} value={formData[`nearbyOpenwell${index}Type`]}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200"><SelectValue placeholder="SELECT" /></SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 text-left">
                    <SelectItem value="Perennial" className="text-xs font-bold uppercase">Perennial</SelectItem>
                    <SelectItem value="Seasonal" className="text-xs font-bold uppercase">Seasonal</SelectItem>
                </SelectContent>
            </Select>
          </FormFieldItem>
        </div>
      )}
      <DialogFooter className="pt-4"><Button type="button" onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg bg-[#1e3a8a] text-white hover:bg-blue-900">Save Details</Button></DialogFooter>
    </DialogContent>
  </Dialog>
)};

export default function UnifiedGeophysicalSurveyPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>}>
            <UnifiedGeophysicalSurveyContent />
        </Suspense>
    )
}