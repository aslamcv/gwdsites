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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, setDoc } from 'firebase/firestore';
import type { GroundwaterReport, Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StaffMultiSelect } from '@/components/investigation/staff-multi-select';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { ScrollArea } from '@/components/ui/scroll-area';

const reportSchema = z.object({
  nameOfSite: z.string().min(1, 'Name of site is required.'),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  fileNo: z.string().optional(),
  applicantNameAddress: z.string().optional(),
  applicationDate: z.string().optional(),
  village: z.string().optional(),
  ward: z.string().optional(),
  altitude: z.string().optional(),
  lsgd: z.string().optional(),
  assembly: z.string().optional(),
  block: z.string().optional(),
  typeAppliedFor: z.enum(['borewell', 'openwell', 'filterpoint', 'tubewell']).optional(),
  dateOfFeasibility: z.string().optional(),
  noOfBeneficiaries: z.string().optional(),
  toposheet: z.string().optional(),
  surveyNoArea: z.string().optional(),
  microWatershed: z.string().optional(),
  hydrogeology: z.string().optional(),
  nearbyBorewell1Depth: z.string().optional(),
  nearbyBorewell1Diameter: z.string().optional(),
  nearbyBorewell1Zones: z.string().optional(),
  nearbyBorewell2Depth: z.string().optional(),
  nearbyBorewell2Diameter: z.string().optional(),
  nearbyBorewell2Zones: z.string().optional(),
  nearbyBorewell3Depth: z.string().optional(),
  nearbyBorewell3Diameter: z.string().optional(),
  nearbyBorewell3Zones: z.string().optional(),
  noNearbyBorewells: z.boolean().default(false),
  nearbyOpenwell1Depth: z.string().optional(),
  nearbyOpenwell1WaterLevel: z.string().optional(),
  nearbyOpenwell1ParapetHeight: z.string().optional(),
  nearbyOpenwell1Type: z.string().optional(),
  nearbyOpenwell2Depth: z.string().optional(),
  nearbyOpenwell2WaterLevel: z.string().optional(),
  nearbyOpenwell2ParapetHeight: z.string().optional(),
  nearbyOpenwell2Type: z.string().optional(),
  nearbyOpenwell3Depth: z.string().optional(),
  nearbyOpenwell3WaterLevel: z.string().optional(),
  nearbyOpenwell3ParapetHeight: z.string().optional(),
  nearbyOpenwell3Type: z.string().optional(),
  noNearbyOpenwells: z.boolean().default(false),
  recommendationType: z.string().optional(),
  recommendationBorewell: z.string().optional(),
  recommendationOpenwell: z.string().optional(),
  recBorewellTotalDepth: z.string().optional(),
  recBorewellDiameter: z.string().optional(),
  expectedOverburden: z.string().optional(),
  recOpenwellTotalDepth: z.string().optional(),
  recOpenwellDiameter: z.string().optional(),
  recommendationOpenwellText: z.string().optional(),
  recommendedToGpSurvey: z.boolean().default(false),
  gpSurveyLocation: z.string().optional(),
  recommendedToPumpingTest: z.boolean().default(false),
});

type ReportFormValues = z.infer<typeof reportSchema>;

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

  const defaultValues: ReportFormValues = useMemo(() => ({
    nameOfSite: '', address: '', latitude: '', longitude: '', fileNo: '', applicantNameAddress: '', applicationDate: '', village: '', ward: '', altitude: '', lsgd: '', assembly: '', block: '', typeAppliedFor: 'borewell', dateOfFeasibility: '', noOfBeneficiaries: '', toposheet: '', surveyNoArea: '', microWatershed: '', hydrogeology: 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.', nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '', nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '', nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '', noNearbyBorewells: false, nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial', nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial', nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial', noNearbyOpenwells: false, recommendationType: '', recommendationBorewell: '', recommendationOpenwell: '', recBorewellTotalDepth: '', recBorewellDiameter: '', expectedOverburden: '', recOpenwellTotalDepth: '', recOpenwellDiameter: '', recommendedToGpSurvey: false, gpSurveyLocation: '', recommendedToPumpingTest: false,
  }), []);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues
  });

  useEffect(() => {
    if (cloudReport) {
      form.reset({ ...defaultValues, ...cloudReport });
    }
  }, [cloudReport, form, defaultValues]);

  // AUTO-POPULATE CONSTITUENCY (LAC) FROM LSGD
  const watchedLsgd = form.watch('lsgd');
  useEffect(() => {
    if (watchedLsgd && lsgMappings) {
      const mapping = lsgMappings.find(m => m.lsg === watchedLsgd);
      if (mapping) {
        form.setValue('assembly', mapping.constituency);
      }
    }
  }, [watchedLsgd, lsgMappings, form]);

  const [staffFormData, setStaffFormData] = useState<any>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    conveyance: '',
    sector: 'private',
    category: 'Domestic',
    staffAssignment: { hydrogeologist: [], juniorHydrogeologist: [], geologicalAssistant: [], otherStaff: [] }
  });

  const updateStaffField = (key: string, value: any) => setStaffFormData((p:any) => ({ ...p, [key]: value }));
  const updateStaff = (role: string, names: string[]) => setStaffFormData((p:any) => ({ ...p, staffAssignment: { ...p.staffAssignment, [role]: names } }));

  const filteredStaff = useMemo(() => {
    if (!employees) return { hg: [], jhg: [], ga: [], other: [] };
    const hgList = employees.filter(e => e.designation.toLowerCase().includes('hydrogeologist') && !e.designation.toLowerCase().includes('junior'));
    const jhgList = employees.filter(e => e.designation.toLowerCase().includes('junior hydrogeologist'));
    const gaList = employees.filter(e => e.designation.toLowerCase().includes('assistant') && e.designation.toLowerCase().includes('geological'));
    const specialIds = [...hgList, ...jhgList, ...gaList].map(e => e.id);
    const otherList = employees.filter(e => !specialIds.includes(e.id));
    return { hg: hgList, jhg: jhgList, ga: gaList, other: otherList };
  }, [employees]);

  const onSubmit = (values: ReportFormValues) => {
    if (!user || !firestore || !isAllowed) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const dateOfInvestigation = `${staffFormData.startDate}${staffFormData.endDate ? ' - ' + staffFormData.endDate : ''}`;

      const reportData = {
        ...values,
        ...staffFormData,
        id: reportId,
        reportDate: staffFormData.startDate,
        applicantName: values.applicantNameAddress?.split('\n')[0] || values.nameOfSite,
        status: 'Published' as const,
        purpose: "Ground Water Investigation / Geological Survey",
        dateOfInvestigation,
        updatedAt: new Date().toISOString(),
        staffAssignment: {
            hydrogeologist: staffFormData.staffAssignment.hydrogeologist.join(', '),
            juniorHydrogeologist: staffFormData.staffAssignment.juniorHydrogeologist.join(', '),
            geologicalAssistant: staffFormData.staffAssignment.geologicalAssistant.join(', '),
            otherStaff: staffFormData.staffAssignment.otherStaff.join(', ')
        }
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: 'Record Synchronized', description: 'Technical investigation record updated.' });
        router.push('/ground-water-investigation');
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  const handleNearbyTypeSelect = (type: string, value: string) => {
    if (value === 'none') {
        if(type === 'borewell') form.setValue('noNearbyBorewells', !form.getValues('noNearbyBorewells'));
        if(type === 'openwell') form.setValue('noNearbyOpenwells', !form.getValues('noNearbyOpenwells'));
        setSelectedNearbyStructure(null);
    } else {
        if(type === 'borewell') form.setValue('noNearbyBorewells', false);
        if(type === 'openwell') form.setValue('noNearbyOpenwells', false);
        setSelectedNearbyStructure(value);
        setIsNearbyDialogOpen(true);
    }
  };

  const handleManualVillageSave = () => {
    if (manualVillageName.trim()) {
      form.setValue('village', manualVillageName.trim().toUpperCase());
      setIsManualVillageOpen(false);
      setManualVillageName('');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-background min-h-screen pb-40 font-sans text-black text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col space-y-8">
          <div className="text-center">
            <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">Groundwater Investigation Report</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">DISTRICT OFFICE, MALAPPURAM</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-5">
              <Button type="button" variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 text-slate-600 hover:bg-slate-50">
                <Link href="/ground-water-investigation"><ArrowLeft className="size-5" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full lg:w-auto">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><CalendarIcon className="size-3 pointer-events-none" /> Start Date</Label>
                <Input disabled={!isAllowed} type="date" value={staffFormData.startDate || ''} onChange={(e) => updateStaffField('startDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><CalendarIcon className="size-3 pointer-events-none" /> End Date</Label>
                <Input disabled={!isAllowed} type="date" value={staffFormData.endDate || ''} onChange={(e) => updateStaffField('endDate', e.target.value)} className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Truck className="size-3" /> Conveyance</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateStaffField('conveyance', v)} value={staffFormData.conveyance}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">{conveyanceOptions.map(o => <SelectItem key={o} value={o} className="text-xs font-bold">{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><Building className="size-3" /> Sector</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateStaffField('sector', v)} value={staffFormData.sector}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {sectorOptions.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1"><SearchCode className="size-3" /> Category</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateStaffField('category', v)} value={staffFormData.category}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {categoryMappings[staffFormData.sector]?.map(c => <SelectItem key={c} value={c} className="text-[10px] font-black uppercase">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3">
                   <MapPin className="size-4" /> 1. SITE & LOCATION DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">1. Name of Site</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">2. Address</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">3. Latitude</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">4. Longitude</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">5. File No</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="applicantNameAddress" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel className="text-[10px] font-black uppercase text-slate-500">6. Applicant Details</FormLabel> <FormControl><Textarea disabled={!isAllowed} rows={1} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="applicationDate" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">7. Date of application</FormLabel> <FormControl><Input disabled={!isAllowed} type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="village" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">8. Village</FormLabel> 
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-full h-10 justify-between border-slate-200 font-bold" disabled={!isAllowed}>
                          <span className="uppercase text-[11px] tracking-tight truncate">{field.value || "SELECT VILLAGE"}</span>
                          <ChevronDown className="size-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[320px] rounded-2xl p-2 bg-white shadow-2xl border-slate-200">
                        <ScrollArea className="h-[400px]">
                          {villageOptions.map((group, groupIdx) => (
                            <div key={groupIdx}>
                              <div className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">{group.label}</div>
                              {group.options.map((v, i) => (
                                <DropdownMenuItem key={i} onClick={() => form.setValue('village', v)} className="rounded-xl py-2.5 px-6 font-bold text-xs uppercase cursor-pointer">{v}</DropdownMenuItem>
                              ))}
                            </div>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setIsManualVillageOpen(true)} className="rounded-xl py-3 px-6 font-black text-xs uppercase cursor-pointer text-blue-600 bg-blue-50 hover:bg-blue-100"><PlusCircle className="size-4 mr-2" /> MANUAL ENTRY</DropdownMenuItem>
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormItem> 
                )} />
                <FormField control={form.control} name="ward" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">9. Ward</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="altitude" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">10. Altitude</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">11. LSGD</FormLabel> 
                    <Select disabled={!isAllowed} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10 text-xs font-bold"><SelectValue placeholder="SELECT LSGD" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[400px] rounded-2xl">{lsgs.map(l => <SelectItem key={l} value={l} className="text-[10px] font-bold uppercase">{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem> 
                )} />
                <FormField control={form.control} name="assembly" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">12. Constituency (LAC)</FormLabel> 
                    <FormControl><Input {...field} disabled className="bg-slate-50 font-black text-blue-600 uppercase h-10 text-xs" /></FormControl>
                  </FormItem> 
                )} />
                <FormField control={form.control} name="block" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">13. Block</FormLabel> 
                    <Select disabled={!isAllowed} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent className="rounded-xl">{blockOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem> 
                )} />
                <FormField control={form.control} name="typeAppliedFor" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel className="text-[10px] font-black uppercase text-slate-500">14. Type Applied For</FormLabel> 
                    <Select disabled={!isAllowed} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="rounded-xl">{recommendationTypeOptions.filter(o=>o.value !== 'not_feasible').map(o => <SelectItem key={o} value={o}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem> 
                )} />
                <FormField control={form.control} name="dateOfFeasibility" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">15. Date of Feasibility</FormLabel> <FormControl><Input disabled={!isAllowed} type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50/50 border-b py-5 px-10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                   <Settings className="size-4" /> 2. TECHNICAL SPECIFICATIONS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <FormField control={form.control} name="noOfBeneficiaries" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">16. Beneficiaries</FormLabel> <FormControl><Input disabled={!isAllowed} type="text" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="toposheet" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel className="text-[10px] font-black uppercase text-slate-500">17. Toposheet/GW Prospect Map</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="surveyNoArea" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">18. Survey No. & Area</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="microWatershed" render={({ field }) => ( <FormItem> <FormLabel className="text-[10px] font-black uppercase text-slate-500">19. Micro water shed</FormLabel> <FormControl><Input disabled={!isAllowed} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="hydrogeology" render={({ field }) => ( <FormItem className="md:col-span-4"> <FormLabel className="text-[10px] font-black uppercase text-slate-500">20. Hydrogeology & Geology</FormLabel> <FormControl><Textarea disabled={!isAllowed} rows={5} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50 border-b py-5 px-10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                  <Activity className="size-4" /> 21. Details of nearby groundwater structures
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">a) Borewell Status</Label>
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    {['borewell1', 'borewell2', 'borewell3'].map((val, idx) => (
                      <Button key={val} type="button" variant={selectedNearbyStructure === val && !form.getValues('noNearbyBorewells') ? 'default' : 'ghost'} className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === val && !form.getValues('noNearbyBorewells') ? "bg-[#1e3a8a] text-white shadow-md" : "text-slate-500")} onClick={() => handleNearbyTypeSelect('borewell', val)} disabled={!isAllowed}>BW-{idx + 1}</Button>
                    ))}
                    <Button type="button" variant={form.watch('noNearbyBorewells') ? 'destructive' : 'ghost'} className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", form.watch('noNearbyBorewells') ? "bg-rose-600 text-white shadow-md" : "text-slate-500")} onClick={() => handleNearbyTypeSelect('borewell', 'none')} disabled={!isAllowed}>NO BOREWELL</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block ml-1">b) Open well Status</Label>
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    {['openwell1', 'openwell2', 'openwell3'].map((val, idx) => (
                      <Button key={val} type="button" variant={selectedNearbyStructure === val && !form.getValues('noNearbyOpenwells') ? 'default' : 'ghost'} className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", selectedNearbyStructure === val && !form.getValues('noNearbyOpenwells') ? "bg-emerald-600 text-white shadow-md" : "text-slate-500")} onClick={() => handleNearbyTypeSelect('openwell', val)} disabled={!isAllowed}>OW-{idx + 1}</Button>
                    ))}
                    <Button type="button" variant={form.watch('noNearbyOpenwells') ? 'destructive' : 'ghost'} className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase transition-all", form.watch('noNearbyOpenwells') ? "bg-rose-600 text-white shadow-md" : "text-slate-500")} onClick={() => handleNearbyTypeSelect('openwell', 'none')} disabled={!isAllowed}>NO OPENWELL</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50/50 border-b py-5 px-10"><CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3"><ShieldCheck className="size-4 text-primary"/> 22. Recommendation</CardTitle></CardHeader>
              <CardContent className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-left">
                    <FormField control={form.control} name="recommendationType" render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Recommendation Type</FormLabel>
                        <Select disabled={!isAllowed} onValueChange={(val) => {field.onChange(val); setIsRecommendationDialogOpen(true);}} value={field.value}>
                          <FormControl><SelectTrigger className="h-14 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm"><SelectValue placeholder="SELECT" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                            {recommendationTypeOptions.map(o => (
                              <SelectItem key={o.value} value={o.value} className="py-3 font-bold text-xs uppercase cursor-pointer">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="space-y-4 pt-6">
                      <FormField control={form.control} name="recommendedToGpSurvey" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={(c) => { field.onChange(c); if(c) form.setValue('recommendedToPumpingTest', false); }} disabled={!isAllowed}/></FormControl>
                          <Label className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">RECOMMENDED TO GP SURVEY</Label>
                        </FormItem>
                      )} />
                      {form.watch('recommendedToGpSurvey') && (
                        <FormField control={form.control} name="gpSurveyLocation" render={({ field }) => (<Input className="h-11 border-slate-200" placeholder="Location details for GP..." {...field} disabled={!isAllowed} />)} />
                      )}
                      <FormField control={form.control} name="recommendedToPumpingTest" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={(c) => { field.onChange(c); if(c) form.setValue('recommendedToGpSurvey', false); }} disabled={!isAllowed}/></FormControl>
                          <Label className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">RECOMMENDED TO PUMPING TEST</Label>
                        </FormItem>
                      )} />
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card><CardHeader className="bg-slate-50/50 border-b py-5 px-10"><CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3"><Users className="size-4 text-primary"/> 23. Staff Team Assignment</CardTitle></CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StaffMultiSelect label="Hydrogeologist" options={filteredStaff.hg} selected={staffFormData.staffAssignment.hydrogeologist} onChange={(names) => updateStaff('hydrogeologist', names)} max={1} disabled={!isAllowed} />
                <StaffMultiSelect label="Jr. Hydrogeologist" options={filteredStaff.jhg} selected={staffFormData.staffAssignment.juniorHydrogeologist} onChange={(names) => updateStaff('juniorHydrogeologist', names)} max={1} disabled={!isAllowed} />
                <StaffMultiSelect label="Geological Assistant" options={filteredStaff.ga} selected={staffFormData.staffAssignment.geologicalAssistant} onChange={(names) => updateStaff('geologicalAssistant', names)} max={2} disabled={!isAllowed} />
                <StaffMultiSelect label="Other Staff" options={filteredStaff.other} selected={staffFormData.staffAssignment.otherStaff} onChange={(names) => updateStaff('otherStaff', names)} max={5} disabled={!isAllowed} />
              </CardContent>
            </Card>

            <div className="flex justify-end pt-8 pb-32">
                <Button type="submit" disabled={isPending || !isAllowed} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02]">
                    {isPending ? <Loader2 className="size-5 animate-spin mr-2" /> : <Save className="size-5 mr-2" />}
                    {isAllowed ? (id ? 'UPDATE INVESTIGATION RECORD' : 'FINALIZE TECHNICAL RECORD') : 'ACCESS RESTRICTED'}
                </Button>
            </div>
        </form>
      </Form>

      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-center">TECHNICAL RECOMMENDATION</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4 text-left">
              {(form.watch('recommendationType') === 'borewell' || form.watch('recommendationType') === 'tubewell' || form.watch('recommendationType') === 'filterpoint') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Depth (m)</Label><Input {...form.register('recBorewellTotalDepth')}/></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Diameter</Label>
                      <Select onValueChange={v=>form.setValue('recBorewellDiameter', v)} value={form.watch('recBorewellDiameter')}>
                        <SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                           {borewellDiameterOptions.map(o=><SelectItem key={o.value} value={o.value} className="font-bold text-xs uppercase">{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Overburden (m)</Label><Input {...form.register('expectedOverburden')}/></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Technical Note</Label><Textarea {...form.register('recommendationBorewell')} className="min-h-[100px] uppercase font-bold text-xs"/></div>
                </div>
              )}
              {form.watch('recommendationType') === 'openwell' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Depth (m)</Label><Input {...form.register('recOpenwellTotalDepth')}/></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Diameter (m)</Label>
                      <Select onValueChange={v=>form.setValue('recOpenwellDiameter', v)} value={form.watch('recOpenwellDiameter')}>
                        <SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger>
                        <SelectContent className="rounded-xl">{openwellDiameterOptions.map(o=><SelectItem key={o.value} value={o.value} className="font-bold text-xs uppercase">{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Technical Note</Label><Textarea {...form.register('recommendationOpenwell')} className="min-h-[100px] uppercase font-bold text-xs"/></div>
                </div>
              )}
          </div>
          <DialogFooter><Button type="button" onClick={() => setIsRecommendationDialogOpen(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] bg-[#1e3a8a] text-white">Confirm Parameters</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNearbyDialogOpen} onOpenChange={setIsNearbyDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-left">DETAILS FOR {selectedNearbyStructure}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4 text-left">
            {selectedNearbyStructure?.startsWith('borewell') ? (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Total Depth (m)</Label><Input value={form.watch(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Depth` as any)} onChange={e=>form.setValue(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Depth` as any, e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Diameter</Label><Input value={form.watch(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Diameter` as any)} onChange={e=>form.setValue(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Diameter` as any, e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Fracture Zones</Label><Input value={form.watch(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Zones` as any)} onChange={e=>form.setValue(`nearbyBorewell${selectedNearbyStructure.slice(-1)}Zones` as any, e.target.value)} /></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Total Depth (m)</Label><Input value={form.watch(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}Depth` as any)} onChange={e=>form.setValue(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}Depth` as any, e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Water Level (m)</Label><Input value={form.watch(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}WaterLevel` as any)} onChange={e=>form.setValue(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}WaterLevel` as any, e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Parapet (m)</Label><Input value={form.watch(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}ParapetHeight` as any)} onChange={e=>form.setValue(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}ParapetHeight` as any, e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Type</Label>
                  <Select onValueChange={v => form.setValue(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}Type` as any, v)} value={form.watch(`nearbyOpenwell${selectedNearbyStructure?.slice(-1)}Type` as any)}>
                    <SelectTrigger className="h-10 text-xs font-bold"><SelectValue/></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Perennial" className="font-bold text-xs uppercase">Perennial</SelectItem><SelectItem value="Seasonal" className="font-bold text-xs uppercase">Seasonal</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button type="button" onClick={() => setIsNearbyDialogOpen(false)} className="w-full h-12 rounded-xl font-black uppercase text-[11px] bg-[#1e3a8a] text-white">Save Details</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManualVillageOpen} onOpenChange={setIsManualVillageOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase font-black text-primary tracking-tight text-center">MANUAL VILLAGE ENTRY</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-500">Village Name</Label>
              <Input value={manualVillageName} onChange={(e) => setManualVillageName(e.target.value)} placeholder="ENTER NAME" className="h-12 border-slate-200 font-bold uppercase" />
          </div>
          <DialogFooter><Button type="button" onClick={handleManualVillageSave} className="w-full h-12 rounded-xl font-black uppercase text-[11px] bg-primary text-white">Confirm Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function GeologicalSurveySiteEntryPage() {
    return <Suspense fallback={<div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Initializing Workspace...</div>}><SiteEntryContent /></Suspense>;
}
