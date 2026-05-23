'use client';

import { useState, useTransition, useEffect, useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Activity,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Truck,
  Building,
  User,
  ShieldCheck,
  Users,
  Settings,
  ClipboardList,
  Lock,
  SearchCode,
  Calculator,
  ArrowRight,
  ChevronDown,
  PlusCircle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { ScrollArea } from '@/components/ui/scroll-area';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const sectorOptions = [
  { id: 'private', label: 'Private' },
  { id: 'government', label: 'Government' },
  { id: 'local_bodies', label: 'Local Bodies' },
  { id: 'others', label: 'Others' },
];

const categoryMappings: Record<string, string[]> = {
  private: ["Domestic", "Agriculture", "Industrial", "Infrastructure", "Institutional", "Others"],
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

const villageOptions = [
  { label: "Eranad Taluk", options: ["Anakkayam", "Areacode", "Chembrasseri", "Cheekode", "Edavanna", "Elankur", "Karakunnu", "Kavanur", "Keezhuparamba", "Kizhuparamba", "Kodur", "Malappuram", "Manjeri", "Melmuri", "Narukara", "Panakkad", "Pandikkad", "Payyanad", "Perakamanna", "Pookkottur", "Pulpatta", "Trikkalangode", "Urangattiri", "Vettilappara", "Vettikattiri"] },
  { label: "Nilambur Taluk", options: ["Akampadam", "Amarambalam", "Chungathara", "Edakkara", "Karulai", "Karuvarakundu", "Kalikavu", "Mampad", "Moothedam", "Nilambur", "Pothukal", "Vazhikkadavu", "Chokkad"] },
  { label: "Perinthalmanna Taluk", options: ["Aliparamba", "Angadippuram", "Anamangad", "Arakkuparamba", "Edappatta", "Elamkulam", "Keezhattur", "Koottilangadi", "Kuruva", "Kuruvambalam", "Makkaraparamba", "Mankada", "Melattur", "Moorkkanad", "Nenmini", "Puzhakkattiri", "Thazhekkode", "Vadakkangara", "Valambur", "Vettathur"] },
  { label: "Tirur Taluk", options: ["Ananthavoor", "Athavanad", "Cheriyamundam", "Edayur", "Irimbiliyam", "Kalady", "Kalpakanchery", "Kattipparuthi", "Kurumbathur", "Kuttippuram", "Mangalam", "Marakkara", "Naduvattom", "Ponmala", "Thirunavaya", "Triprangode", "Valavannur"] },
  { label: "Tirurangadi Taluk", options: ["Thenhipalam", "Chelembra", "Cherukavu", "Moonniyur", "Nannambra", "Neduva", "Oorakam", "Parappanangadi", "Parappur", "Peruvallur", "Vallikkunnu", "Vengara", "Velimukku", "Ponmundam", "Tanalur", "Tirurangadi", "Kottakkal"] },
  { label: "Ponnani Taluk", options: ["Alamkode", "Edappal", "Marancheri", "Nannammukku", "Perumpadappa", "Ponnani Nagaram", "Tavanur", "Vattamകുളം", "Veliyankode"] },
  { label: "Kondotty Taluk", options: ["Edarikkode", "Kizhisseri", "Kondotty", "Kuzhimanna", "Morayur", "Muthുവല്ലൂർ", "Nediyiruppu", "Pallikkal", "Pulikkal", "Vazhakkad", "Vazhayur"] }
];

const blockOptions = [
  "Areekode — Safe", "Perumpadappu — Safe", "Kalikavu — Safe",
  "Kondotty — Semi-Critical", "Kuttippuram — Semi-Critical", "Malappuram — Semi-Critical",
  "Mankada — Semi-Critical", "Nilambur — Safe", "Perinthalmanna — Safe",
  "Ponnani — Safe", "Tanur — Semi-Critical", "Tirur — Semi-Critical",
  "Tirurangadi — Semi-Critical", "Vengara — Semi-Critical", "Wandoor — Safe"
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

function SiteEntryContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lsgs, lsgMappings } = useLsgdData();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');

  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [isNearbyDialogOpen, setIsNearbyDialogOpen] = useState(false);
  const [selectedNearbyStructure, setSelectedNearbyStructure] = useState<string | null>(null);
  const [isManualVillageOpen, setIsManualVillageOpen] = useState(false);
  const [manualVillageName, setManualVillageName] = useState('');

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'scientist') && userProfile?.isApproved === true;
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

  const [formData, setFormData] = useState<any>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    conveyance: '',
    sector: 'private',
    category: 'Domestic',
    nameOfSite: '',
    address: '',
    latitude: '',
    longitude: '',
    fileNo: '',
    applicantNameAddress: '',
    applicationDate: '',
    village: '',
    ward: '',
    altitude: '',
    lsgd: '',
    assembly: '',
    block: '',
    typeAppliedFor: 'borewell',
    dateOfFeasibility: '',
    noOfBeneficiaries: '',
    toposheet: '',
    surveyNoArea: '',
    microWatershed: '',
    hydrogeology: 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.',
    remittance: '',
    totalDepth: '',
    noNearbyBorewells: false,
    noNearbyOpenwells: false,
    nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '',
    nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '',
    nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '',
    nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial',
    nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial',
    nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial',
    noNearbyOpenwells: false,
    recommendationType: '',
    recBorewellTotalDepth: '',
    recBorewellDiameter: '',
    expectedOverburden: '',
    recommendationBorewell: '',
    recOpenwellTotalDepth: '',
    recOpenwellDiameter: '',
    recommendationOpenwell: '',
    recommendedToGpSurvey: false,
    gpSurveyLocation: '',
    recommendedToPumpingTest: false,
    staffAssignment: {
        hydrogeologist: [],
        juniorHydrogeologist: [],
        geologicalAssistant: [],
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
          hydrogeologist: Array.isArray(SaData.hydrogeologist) ? SaData.hydrogeologist : (SaData.hydrogeologist ? (SaData.hydrogeologist as string).split(', ') : []),
          juniorHydrogeologist: Array.isArray(SaData.juniorHydrogeologist) ? SaData.juniorHydrogeologist : (SaData.juniorHydrogeologist ? (SaData.juniorHydrogeologist as string).split(', ') : []),
          geologicalAssistant: Array.isArray(SaData.geologicalAssistant) ? SaData.geologicalAssistant : (SaData.geologicalAssistant ? (SaData.geologicalAssistant as string).split(', ') : []),
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
    if (!employees) return { hg: [], jhg: [], ga: [], other: [] };
    const hgList = employees.filter(e => e.designation.toLowerCase().includes('hydrogeologist') && !e.designation.toLowerCase().includes('junior'));
    const jhgList = employees.filter(e => e.designation.toLowerCase().includes('junior hydrogeologist'));
    const gaList = employees.filter(e => e.designation.toLowerCase().includes('assistant') && e.designation.toLowerCase().includes('geological'));
    const specialIds = [...hgList, ...jhgList, ...gaList].map(e => e.id);
    const otherList = employees.filter(e => !specialIds.includes(e.id));
    return { hg: hgList, jhg: jhgList, ga: gaList, other: otherList };
  }, [employees]);

  const detectedLac = useMemo(() => {
    if (!formData.lsgd || !lsgMappings || lsgMappings.length === 0) return '';
    const searchLsg = formData.lsgd.toLowerCase().trim();
    const mapping = lsgMappings.find(m => m.lsg.toLowerCase().trim() === searchLsg);
    return mapping?.constituency || '';
  }, [formData.lsgd, lsgMappings]);

  const handleSave = () => {
    if (!user || !firestore || !isAllowed) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const dateOfInvestigation = `${formData.startDate}${formData.endDate ? ' - ' + formData.endDate : ''}`;

      const reportData = {
        ...formData,
        id: reportId,
        reportDate: formData.startDate,
        applicantName: formData.applicantNameAddress?.split('\n')[0] || formData.nameOfSite,
        status: 'Published' as const,
        purpose: "Ground Water Investigation / Geological Survey",
        dateOfInvestigation,
        updatedAt: new Date().toISOString(),
        assembly: detectedLac,
        staffAssignment: {
            hydrogeologist: formData.staffAssignment.hydrogeologist.join(', '),
            juniorHydrogeologist: formData.staffAssignment.juniorHydrogeologist.join(', '),
            geologicalAssistant: formData.staffAssignment.geologicalAssistant.join(', '),
            otherStaff: formData.staffAssignment.otherStaff.join(', ')
        }
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: 'Record Updated', description: 'Geological survey record synchronized.' });
        router.push('/ground-water-investigation');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
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

  const handleManualVillageSave = () => {
    if (manualVillageName.trim()) {
      updateField('village', manualVillageName.trim().toUpperCase());
      setIsManualVillageOpen(false);
      setManualVillageName('');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">Groundwater Investigation Report</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">DISTRICT OFFICE, MALAPPURAM</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-5">
              <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/ground-water-investigation"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full lg:w-auto">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                  <CalendarIcon className="size-3 pointer-events-none" /> Start Date
                </Label>
                <Input disabled={!isAllowed} type="date" value={formData.startDate || ''} onChange={(e) => updateField('startDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><CalendarIcon className="size-3 pointer-events-none" /> End Date (Opt)</Label>
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

      <div className='space-y-8'>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest"><MapPin className="size-4 text-primary" /> 1. Basic Site Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormFieldItem label="1. Name of Site" id="nameOfSite"><Input disabled={!isAllowed} value={formData.nameOfSite} onChange={(e) => updateField('nameOfSite', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="2. Address" id="address"><Input disabled={!isAllowed} value={formData.address} onChange={(e) => updateField('address', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="3. Latitude" id="latitude"><Input disabled={!isAllowed} value={formData.latitude} onChange={(e) => updateField('latitude', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="4. Longitude" id="longitude"><Input disabled={!isAllowed} value={formData.longitude} onChange={(e) => updateField('longitude', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="5. File No" id="fileNo"><Input disabled={!isAllowed} value={formData.fileNo} onChange={(e) => updateField('fileNo', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="6. Applicant Name & Address" id="applicantNameAddress" className="md:col-span-2"><Textarea disabled={!isAllowed} value={formData.applicantNameAddress} onChange={(e) => updateField('applicantNameAddress', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="7. Date of application" id="applicationDate"><Input disabled={!isAllowed} type="date" value={formData.applicationDate} onChange={(e) => updateField('applicationDate', e.target.value)} /></FormFieldItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
               <Building className="size-4" /> 2. Location & Admin Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <FormFieldItem label="8. Village" id="village">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="w-full h-10 justify-between border-slate-200 font-bold" disabled={!isAllowed}>
                        <span className="uppercase text-[11px] tracking-tight truncate">
                          {formData.village || "ENTER THE DETAILS"}
                        </span>
                        <ChevronDown className="size-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[320px] rounded-2xl p-2 bg-white shadow-2xl border-slate-200">
                      <ScrollArea className="h-[400px]">
                        <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase text-primary tracking-widest bg-slate-50">Select Revenue Village</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {villageOptions.map((group, groupIdx) => (
                          <div key={`${group.label}-${groupIdx}`}>
                            <div className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">{group.label}</div>
                            {group.options.map((v, i) => (
                              <DropdownMenuItem key={`${v}-${i}`} onClick={() => updateField('village', v)} className="rounded-xl py-2.5 px-6 font-bold text-xs uppercase cursor-pointer">
                                {v}
                              </DropdownMenuItem>
                            ))}
                          </div>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsManualVillageOpen(true)} className="rounded-xl py-3 px-6 font-black text-xs uppercase cursor-pointer text-blue-600 bg-blue-50 hover:bg-blue-100">
                          <PlusCircle className="size-4 mr-2" /> OTHER / MANUAL ENTRY
                        </DropdownMenuItem>
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormFieldItem>
                <FormFieldItem label="9. Ward" id="ward"><Input disabled={!isAllowed} value={formData.ward} onChange={(e) => updateField('ward', e.target.value)} /></FormFieldItem>
                <FormFieldItem label="10. Altitude" id="altitude"><Input disabled={!isAllowed} value={formData.altitude} onChange={(e) => updateField('altitude', e.target.value)} /></FormFieldItem>
                <FormFieldItem label="11. LSGD" id="lsgd">
                  <Select disabled={!isAllowed} onValueChange={(v) => updateField('lsgd', v)} value={formData.lsgd}>
                    <SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger>
                    <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </FormFieldItem>
                <FormFieldItem label="12. Constituency (LAC)" id="assembly">
                    <Input value={detectedLac} disabled className="bg-slate-50 font-black text-blue-600 uppercase h-10 text-xs" placeholder="Auto-populated" />
                </FormFieldItem>
                <FormFieldItem label="13. Block" id="block">
                  <Select disabled={!isAllowed} onValueChange={(v) => updateField('block', v)} value={formData.block}>
                    <SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger>
                    <SelectContent className="rounded-xl">{blockOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </FormFieldItem>
                <FormFieldItem label="14. Type Applied For" id="typeAppliedFor">
                  <Select disabled={!isAllowed} onValueChange={(v) => updateField('typeAppliedFor', v)} value={formData.typeAppliedFor}>
                    <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {recommendationTypeOptions.filter(o=>o.value !== 'not_feasible').map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormFieldItem>
                <FormFieldItem label="15. Date of Feasibility" id="dateOfFeasibility"><Input disabled={!isAllowed} type="date" value={formData.dateOfFeasibility} onChange={(e) => updateField('dateOfFeasibility', e.target.value)} /></FormFieldItem>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest"><Settings className="size-4 text-primary"/> 3. Technical Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormFieldItem label="16. beneficiaries" id="noOfBeneficiaries"><Input disabled={!isAllowed} type="text" value={formData.noOfBeneficiaries} onChange={(e) => updateField('noOfBeneficiaries', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="17. Toposheet/GW Prospect Map" id="toposheet" className="md:col-span-2"><Input disabled={!isAllowed} value={formData.toposheet} onChange={(e) => updateField('toposheet', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="18. Survey No. & Area" id="surveyNoArea"><Input disabled={!isAllowed} value={formData.surveyNoArea} onChange={(e) => updateField('surveyNoArea', e.target.value)} /></FormFieldItem>
            <FormFieldItem label="19. Micro water shed" id="microWatershed"><Input disabled={!isAllowed} value={formData.microWatershed} onChange={(e) => updateField('microWatershed', e.target.value)} /></FormFieldItem>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest"><FileText className="size-4 text-primary"/> 20. Hydrogeology & Geology of the area</CardTitle></CardHeader><CardContent><Textarea disabled={!isAllowed} value={formData.hydrogeology} onChange={(e) => updateField('hydrogeology', e.target.value)} rows={5} /></CardContent></Card>
        
        <Card>
          <CardHeader className="bg-slate-50 border-b py-5 px-10">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
              <Activity className="size-4" /> 21. Details of nearby groundwater structures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">a) Borewell Status</Label>
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'borewell1' && !formData.noNearbyBorewells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'borewell1' && !formData.noNearbyBorewells ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('borewell', 'borewell1')}
                  disabled={!isAllowed}
                >
                  BW-1
                </Button>
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'borewell2' && !formData.noNearbyBorewells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'borewell2' && !formData.noNearbyBorewells ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('borewell', 'borewell2')}
                  disabled={!isAllowed}
                >
                  BW-2
                </Button>
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'borewell3' && !formData.noNearbyBorewells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'borewell3' && !formData.noNearbyBorewells ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('borewell', 'borewell3')}
                  disabled={!isAllowed}
                >
                  BW-3
                </Button>
                <Button 
                  type="button" 
                  variant={formData.noNearbyBorewells ? 'destructive' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData.noNearbyBorewells ? "bg-rose-600 text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('borewell', 'none')}
                  disabled={!isAllowed}
                >
                  NO BOREWELL
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">b) Open well Status</Label>
              <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'openwell1' && !formData.noNearbyOpenwells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'openwell1' && !formData.noNearbyOpenwells ? "bg-emerald-600 text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('openwell', 'openwell1')}
                  disabled={!isAllowed}
                >
                  OW-1
                </Button>
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'openwell2' && !formData.noNearbyOpenwells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'openwell2' && !formData.noNearbyOpenwells ? "bg-emerald-600 text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('openwell', 'openwell2')}
                  disabled={!isAllowed}
                >
                  OW-2
                </Button>
                <Button 
                  type="button" 
                  variant={selectedNearbyStructure === 'openwell3' && !formData.noNearbyOpenwells ? 'default' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === 'openwell3' && !formData.noNearbyOpenwells ? "bg-emerald-600 text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('openwell', 'openwell3')}
                  disabled={!isAllowed}
                >
                  OW-3
                </Button>
                <Button 
                  type="button" 
                  variant={formData.noNearbyOpenwells ? 'destructive' : 'ghost'}
                  className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", formData.noNearbyOpenwells ? "bg-rose-600 text-white shadow-md" : "text-slate-500")}
                  onClick={() => handleNearbyTypeSelect('openwell', 'none')}
                  disabled={!isAllowed}
                >
                  NO OPENWELL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
               <ShieldCheck className="size-4 text-primary"/> 22. Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <FormFieldItem label="Recommendation Type" id="recommendationType" className="w-full">
                  <Select disabled={!isAllowed} onValueChange={(val) => {updateField('recommendationType', val); setIsRecommendationDialogOpen(true);}} value={formData.recommendationType}>
                    <SelectTrigger className="h-14 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm">
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
                </FormFieldItem>
                
                <div className="space-y-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="recommendedToGpSurvey" 
                      checked={formData.recommendedToGpSurvey || false} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev: any) => ({ ...prev, recommendedToGpSurvey: true, recommendedToPumpingTest: false }));
                        } else {
                          updateField('recommendedToGpSurvey', false);
                        }
                      }} 
                    />
                    <label
                      htmlFor="recommendedToGpSurvey"
                      className="text-[10px] font-black uppercase text-slate-700 leading-none cursor-pointer"
                    >
                      RECCOMENDED TO GP SURVEY
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="recommendedToPumpingTest" 
                      checked={formData.recommendedToPumpingTest || false} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev: any) => ({ ...prev, recommendedToPumpingTest: true, recommendedToGpSurvey: false, gpSurveyLocation: '' }));
                        } else {
                          updateField('recommendedToPumpingTest', false);
                        }
                      }} 
                    />
                    <label
                      htmlFor="recommendedToPumpingTest"
                      className="text-[10px] font-black uppercase text-slate-700 leading-none cursor-pointer"
                    >
                      RECCOMENDED TO PUMPING TEST
                    </label>
                  </div>
                  
                  <div className={cn("space-y-2 transition-all duration-300", !formData.recommendedToGpSurvey && "opacity-20 pointer-events-none")}>
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Location Details for GP Survey</Label>
                    <Input 
                      disabled={!isAllowed || !formData.recommendedToGpSurvey}
                      value={formData.gpSurveyLocation || ''} 
                      onChange={(e) => updateField('gpSurveyLocation', e.target.value)}
                      placeholder="Enter specific site coordinates or landmark for GP..." 
                      className="h-11 border-slate-200"
                    />
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm uppercase font-black tracking-widest"><Users className="size-4 text-primary"/> 23. Staff Details (Team Assignment)</CardTitle></CardHeader>
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StaffMultiSelect label="Hydrogeologist" options={filteredStaff.hg} selected={formData.staffAssignment.hydrogeologist} onChange={(names) => updateStaff('hydrogeologist', names)} max={1} disabled={!isAllowed} />
            <StaffMultiSelect label="Jr. Hydrogeologist" options={filteredStaff.jhg} selected={formData.staffAssignment.juniorHydrogeologist} onChange={(names) => updateStaff('juniorHydrogeologist', names)} max={1} disabled={!isAllowed} />
            <StaffMultiSelect label="Geological Assistant" options={filteredStaff.ga} selected={formData.staffAssignment.geologicalAssistant} onChange={(names) => updateStaff('geologicalAssistant', names)} max={2} disabled={!isAllowed} />
            <StaffMultiSelect label="Other Staff" options={filteredStaff.other} selected={formData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={5} disabled={!isAllowed} />
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] h-24">
        <div className="max-w-screen-2xl mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">GEOLOGICAL SURVEY</span>
              <span className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">
                {formData.fileNo || 'NEW TECHNICAL RECORD'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button type="button" variant="ghost" asChild className="font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-colors px-6 h-12 rounded-xl">
               <Link href="/ground-water-investigation">DISCARD</Link>
             </Button>
             <Button type="button" onClick={handleSave} disabled={isPending || !isAllowed} className="h-14 px-16 rounded-[20px] bg-[#1e3a8a] hover:bg-blue-900 text-white font-black uppercase tracking-widest text-[11px] gap-3 shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95">
               {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
               {isAllowed ? (id ? 'UPDATE' : 'SAVE') + ' TECHNICAL RECORD' : 'Access Restricted'}
             </Button>
          </div>
        </div>
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

      <Dialog open={isManualVillageOpen} onOpenChange={setIsManualVillageOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary tracking-tight">Manual Village Entry</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase text-slate-400">Enter revenue village name if not present in the master list.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Village Name</Label>
              <Input 
                value={manualVillageName}
                onChange={(e) => setManualVillageName(e.target.value)}
                placeholder="ENTER NAME"
                className="h-12 border-slate-200 font-bold uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleManualVillageSave} className="w-full h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-blue-900/20">
              Confirm Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-center">RECOMMENDATION FOR {formData.recommendationType}</DialogTitle></DialogHeader>
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
      <DialogFooter className="pt-4"><Button type="button" onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg bg-[#1e3a8a] text-white hover:bg-blue-900">Confirm Parameters</Button></DialogFooter>
    </DialogContent>
  </Dialog>
);

const NearbyStructureDialog = ({isOpen, onOpenChange, structureType, formData, updateField}: any) => {
  const isBorewell = structureType?.startsWith('borewell');
  const index = structureType ? parseInt(structureType.slice(-1)) : 1;
  
  return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
      <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight">DETAILS FOR {structureType}</DialogTitle></DialogHeader>
      {isBorewell ? (
        <div className="space-y-6 py-4">
          <FormFieldItem label="Total Depth (m)" id={`nbd${index}`}><Input value={formData[`nearbyBorewell${index}Depth`]} onChange={e=>updateField(`nearbyBorewell${index}Depth`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Diameter" id={`nbd_dia${index}`}><Input value={formData[`nearbyBorewell${index}Diameter`]} onChange={e=>updateField(`nearbyBorewell${index}Diameter`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Zones" id={`nbd_zones${index}`}><Input value={formData[`nearbyBorewell${index}Zones`]} onChange={e=>updateField(`nearbyBorewell${index}Zones`, e.target.value)} /></FormFieldItem>
        </div>
      ) : (
         <div className="space-y-6 py-4">
          <FormFieldItem label="Total Depth (m)" id={`nod${index}`}><Input value={formData[`nearbyOpenwell${index}Depth`]} onChange={e=>updateField(`nearbyOpenwell${index}Depth`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Water Level (m)" id={`nod_wl${index}`}><Input value={formData[`nearbyOpenwell${index}WaterLevel`]} onChange={e=>updateField(`nearbyOpenwell${index}WaterLevel`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Parapet (m)" id={`nod_ph${index}`}><Input value={formData[`nearbyOpenwell${index}ParapetHeight`]} onChange={e=>updateField(`nearbyOpenwell${index}ParapetHeight`, e.target.value)} /></FormFieldItem>
          <FormFieldItem label="Type" id={`nod_type${index}`}>
            <Select onValueChange={v=>updateField(`nearbyOpenwell${index}Type`, v)} value={formData[`nearbyOpenwell${index}Type`]}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="Perennial" className="text-xs font-bold">Perennial</SelectItem>
                    <SelectItem value="Seasonal" className="text-xs font-bold">Seasonal</SelectItem>
                </SelectContent>
            </Select>
          </FormFieldItem>
        </div>
      )}
      <DialogFooter className="pt-4"><Button type="button" onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg bg-[#1e3a8a] text-white hover:bg-blue-900">Save Details</Button></DialogFooter>
    </DialogContent>
  </Dialog>
)};

export default function GeologicalSurveySiteEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>}>
            <SiteEntryContent />
        </Suspense>
    )
}
