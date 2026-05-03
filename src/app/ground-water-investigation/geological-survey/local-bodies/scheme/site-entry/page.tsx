'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ClipboardList, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { useState, useTransition } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

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
});

type ReportFormValues = z.infer<typeof reportSchema>;

const borewellDiameterOptions = [
  { value: '110mm', label: '110mm (4.5")' },
  { value: '150mm', label: '150mm (6")' },
  { value: '200mm', label: '200mm (8")' },
];

const openwellDiameterOptions = Array.from({ length: 11 }, (_, i) => {
  const val = (1 + i * 0.5).toString();
  return { value: val, label: `${val}m` };
});

const recommendationTypeOptions = [
  { value: 'borewell', label: 'Bore well' },
  { value: 'openwell', label: 'Open well' },
  { value: 'filterpoint', label: 'Filter point well' },
  { value: 'tubewell', label: 'Tube well' },
  { value: 'not_feasible', label: 'Not feasible for Open well & Bore well' },
];

const blockOptions = [
  "Areekode — Safe (68.15%)",
  "Perumpadappu Block — Safe(68.88%)",
  "Kalikavu — Safe(60.31%)",
  "Kondotty — Semi-Critical(88.45%)",
  "Kuttippuram— Semi-Critical(84.68%)",
  "Malappuram— Semi-Critical(79.54%)",
  "Mankada— Semi-Critical(75.36%)",
  "Nilambur— Safe(56.59%)",
  "Perinthalmanna— Safe(65.38%)",
  "Ponnani— Safe(64.14%)",
  "Tanur— Semi-Critical(88.61%)",
  "Tirur— Semi-Critical(86.75%)",
  "Tirurangadi— Semi-Critical(85.41%)",
  "Vengara Block— Semi-Critical(86.12%)",
  "Wandoor— Safe(61.04%)"
];

const villageOptions = [
  { label: "Eranad Taluk", options: ["Anakkayam", "Areacode", "Chembrasseri", "Cheekode", "Edavanna", "Elankur", "Karakunnu", "Kavanur", "Keezhuparamba", "Kizhuparamba", "Kodur", "Malappuram", "Manjeri", "Melmuri", "Narukara", "Panakkad", "Pandikkad", "Payyanad", "Perakamanna", "Pookkottur", "Pulpatta", "Trikkalangode", "Urangattiri", "Vettilappara", "Vettikattiri"] },
  { label: "Nilambur Taluk", options: ["Akampadam", "Amarambalam", "Chungathara", "Edakkara", "Karulai", "Karuvarakundu", "Kalikavu", "Mampad", "Moothedam", "Nilambur", "Pothukal", "Vazhikkadavu", "Chokkad"] },
  { label: "Perinthalmanna Taluk", options: ["Aliparamba", "Angadippuram", "Anamangad", "Arakkuparamba", "Edappatta", "Elamkulam", "Keezhattur", "Koottilangadi", "Kuruva", "Kuruvambalam", "Makkaraparamba", "Mankada", "Melattur", "Moorkkanad", "Nenmini", "Puzhakkattiri", "Thazhekkode", "Vadakkangara", "Valambur", "Vettathur"] },
  { label: "Tirur Taluk", options: ["Ananthavoor", "Athavanad", "Cheriyamundam", "Edayur", "Irimbiliyam", "Kalady", "Kalpakanchery", "Kattipparuthi", "Kurumbathur", "Kuttippuram", "Mangalam", "Marakkara", "Naduvattom", "Ponmala", "Thirunavaya", "Triprangode", "Valavannur"] },
  { label: "Tirurangadi Taluk", options: ["Thenhipalam", "Chelembra", "Cherukavu", "Moonniyur", "Nannambra", "Neduva", "Oorakam", "Parappanangadi", "Parappur", "Peruvallur", "Vallikkunnu", "Vengara", "Velimukku", "Ponmundam", "Tanalur", "Tirurangadi", "Kottakkal"] },
  { label: "Ponnani Taluk", options: ["Alamkode", "Edappal", "Marancheri", "Nannammukku", "Perumpadappa", "Ponnani Nagaram", "Tavanur", "Vattamkulam", "Veliyankode"] },
  { label: "Kondotty Taluk", options: ["Edarikkode", "Kizhisseri", "Kondotty", "Kuzhimanna", "Morayur", "Muthuvallur", "Nediyiruppu", "Pallikkal", "Pulikkal", "Vazhakkad", "Vazhayur"] }
];

export default function SiteEntryPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { lsgs, constituencies } = useLsgdData();
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [isNearbyDialogOpen, setIsNearbyDialogOpen] = useState(false);
  const [selectedNearbyStructure, setSelectedNearbyStructure] = useState<string | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      nameOfSite: '', address: '', latitude: '', longitude: '', fileNo: '', applicantNameAddress: '', applicationDate: '', village: '', ward: '', altitude: '', lsgd: '', assembly: '', block: '', typeAppliedFor: 'borewell', dateOfFeasibility: '', noOfBeneficiaries: '', toposheet: '', surveyNoArea: '', microWatershed: '', hydrogeology: 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.', nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '', nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '', nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '', noNearbyBorewells: false, nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial', nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial', nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial', noNearbyOpenwells: false, recommendationType: '', recommendationBorewell: '', recommendationOpenwell: '', recBorewellTotalDepth: '', recBorewellDiameter: '', expectedOverburden: '', recOpenwellTotalDepth: '', recOpenwellDiameter: '',
    },
  });

  const onSubmit = (values: ReportFormValues) => {
    if (!user || !firestore) return;

    startTransition(() => {
      const reportRef = doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportRef.id;
      
      let dateOfInvestigation = startDate;
      if (endDate) {
        dateOfInvestigation += ` – ${endDate}`;
      }

      const reportData = {
        ...values,
        id: reportId,
        reportDate: new Date().toISOString().split('T')[0],
        applicantName: values.applicantNameAddress?.split('\n')[0] || 'Unknown Applicant',
        applicantAddress: values.applicantNameAddress,
        reportTitle: `Groundwater Investigation at ${values.nameOfSite}`,
        status: 'Published' as const,
        purpose: "Ground Water Investigation / Geological Survey / Local Bodies / Scheme",
        dateOfInvestigation: dateOfInvestigation,
        category: "Geological Survey / Local Bodies / Scheme",
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDoc(reportRef, reportData)
        .then(() => {
          toast({ 
            title: 'Report Data Saved', 
            description: 'You can now generate the report documents.' 
          });
          setGeneratedReportId(reportId);
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: reportRef.path,
            operation: 'create',
            requestResourceData: reportData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  const handleRecommendationTypeSelect = (type: string) => {
    form.setValue('recommendationType', type);
    setIsRecommendationDialogOpen(true);
  };

  const handleNearbySelect = (type: string) => {
    setSelectedNearbyStructure(type);
    setIsNearbyDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ground-water-investigation/geological-survey/local-bodies/scheme">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
            <h1 className="font-headline text-xl font-bold tracking-tight text-foreground uppercase">Groundwater Investigation Report</h1>
            <p className="text-sm text-muted-foreground">Groundwater Department, Malappuram</p>
        </div>
      </div>

      <div className="mt-6 bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Investigation Context
          </p>
          <p className="text-sm font-semibold">Work Period: {startDate || 'N/A'} {endDate ? ` to ${endDate}` : ''}</p>
        </div>
        <Badge variant="outline" className="bg-white text-primary border-primary/20">Technical Record</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem> <FormLabel>1. Name of Site</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>2. Address</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel>3. Latitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel>4. Longitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem> <FormLabel>5. File No</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="applicantNameAddress" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>6. Applicant Name & Address</FormLabel> <FormControl><Textarea rows={1} {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="applicationDate" render={({ field }) => ( <FormItem> <FormLabel>7. Date of application</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="village" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>8. Village</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Village" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[400px]">
                        {villageOptions.map((group, groupIdx) => (
                          <SelectGroup key={`vgroup-${group.label}-${groupIdx}`}>
                            <SelectLabel className="text-primary font-bold">{group.label}</SelectLabel>
                            {group.options.map((v, i) => (<SelectItem key={`village-${group.label}-${v}-${i}`} value={v}>{v}</SelectItem>))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="ward" render={({ field }) => ( <FormItem> <FormLabel>9. Ward</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="altitude" render={({ field }) => ( <FormItem> <FormLabel>10. Altitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>11. LSGD</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={lsgs.length > 0 ? "Select LSGD" : "Import in Settings"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {lsgs.map((lsg) => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="assembly" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>12. Constituency (LAC)</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={constituencies.length > 0 ? "Select Constituency" : "Import in Settings"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {constituencies.map((lac) => (<SelectItem key={lac} value={lac}>{lac}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="block" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>13. Block</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Block" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {blockOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="typeAppliedFor" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>14. Type Applied For</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#e0fbfc] border-cyan-100 h-12 focus:ring-[#00aeef]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="borewell">Bore well</SelectItem>
                        <SelectItem value="openwell">Open well</SelectItem>
                        <SelectItem value="filterpoint">Filter point well</SelectItem>
                        <SelectItem value="tubewell">Tube well</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="dateOfFeasibility" render={({ field }) => ( <FormItem> <FormLabel>15. Date of Feasibility</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="noOfBeneficiaries" render={({ field }) => ( <FormItem> <FormLabel>16. No. of Beneficiaries</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="toposheet" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>17. Toposheet/GW Prospect Map</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="surveyNoArea" render={({ field }) => ( <FormItem> <FormLabel>18. Survey No. & Area</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="microWatershed" render={({ field }) => ( <FormItem> <FormLabel>19. Micro water shed</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
            </CardContent>
          </Card>

          <Card> 
            <CardHeader><CardTitle>20. Hydrogeology & Geology of the area</CardTitle></CardHeader> 
            <CardContent> 
              <FormField control={form.control} name="hydrogeology" render={({ field }) => ( 
                <FormItem><FormControl><Textarea rows={5} {...field} /></FormControl> <FormMessage /> </FormItem> 
              )} /> 
            </CardContent> 
          </Card>

          <Card> 
            <CardHeader><CardTitle>21. Details of nearby groundwater structures</CardTitle></CardHeader> 
            <CardContent className="space-y-6"> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">a) Borewell</Label>
                  <Select onValueChange={(val) => handleNearbySelect(val)}>
                    <SelectTrigger className="bg-[#e0fbfc] border-cyan-100 h-12 focus:ring-[#00aeef]">
                      <SelectValue placeholder="Select Borewell Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borewell1">Bore well-1</SelectItem>
                      <SelectItem value="borewell2">Bore well-2</SelectItem>
                      <SelectItem value="borewell3">Bore well-3</SelectItem>
                      <SelectItem value="no_borewell">There is no nearby borewells</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">b) Open well</Label>
                  <Select onValueChange={(val) => handleNearbySelect(val)}>
                    <SelectTrigger className="bg-[#e0fbfc] border-cyan-100 h-12 focus:ring-[#00aeef]">
                      <SelectValue placeholder="Select Open well Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openwell1">open well-1</SelectItem>
                      <SelectItem value="openwell2">open well-2</SelectItem>
                      <SelectItem value="openwell3">open well-3</SelectItem>
                      <SelectItem value="no_openwell">There is no nearby open wells</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(form.getValues('nearbyBorewell1Depth') || form.getValues('nearbyBorewell2Depth') || form.getValues('nearbyBorewell3Depth') || form.getValues('noNearbyBorewells')) && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider border-b pb-1">Borewell Details</h4>
                    {form.getValues('noNearbyBorewells') ? (
                      <Badge variant="outline" className="text-destructive border-destructive/30">No nearby borewells</Badge>
                    ) : (
                      <div className="space-y-4 text-sm">
                        {form.getValues('nearbyBorewell1Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Borewell 1:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyBorewell1Depth')}m</li>
                              <li>Diameter: {form.getValues('nearbyBorewell1Diameter')}</li>
                              <li>Zones: {form.getValues('nearbyBorewell1Zones')}</li>
                            </ul>
                          </div>
                        )}
                        {form.getValues('nearbyBorewell2Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Borewell 2:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyBorewell2Depth')}m</li>
                              <li>Diameter: {form.getValues('nearbyBorewell2Diameter')}</li>
                              <li>Zones: {form.getValues('nearbyBorewell2Zones')}</li>
                            </ul>
                          </div>
                        )}
                        {form.getValues('nearbyBorewell3Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Borewell 3:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyBorewell3Depth')}m</li>
                              <li>Diameter: {form.getValues('nearbyBorewell3Diameter')}</li>
                              <li>Zones: {form.getValues('nearbyBorewell3Zones')}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(form.getValues('nearbyOpenwell1Depth') || form.getValues('nearbyOpenwell2Depth') || form.getValues('nearbyOpenwell3Depth') || form.getValues('noNearbyOpenwells')) && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider border-b pb-1">Openwell Details</h4>
                    {form.getValues('noNearbyOpenwells') ? (
                      <Badge variant="outline" className="text-destructive border-destructive/30">No nearby open wells</Badge>
                    ) : (
                      <div className="space-y-4 text-sm">
                        {form.getValues('nearbyOpenwell1Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Openwell 1:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyOpenwell1Depth')}m</li>
                              <li>Water Level: {form.getValues('nearbyOpenwell1WaterLevel')}m</li>
                              <li>Parapet: {form.getValues('nearbyOpenwell1ParapetHeight')}m</li>
                              <li>Type: {form.getValues('nearbyOpenwell1Type')}</li>
                            </ul>
                          </div>
                        )}
                        {form.getValues('nearbyOpenwell2Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Openwell 2:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyOpenwell2Depth')}m</li>
                              <li>Water Level: {form.getValues('nearbyOpenwell2WaterLevel')}m</li>
                              <li>Parapet: {form.getValues('nearbyOpenwell2ParapetHeight')}m</li>
                              <li>Type: {form.getValues('nearbyOpenwell2Type')}</li>
                            </ul>
                          </div>
                        )}
                        {form.getValues('nearbyOpenwell3Depth') && (
                          <div>
                            <p className="font-semibold mb-1 underline">Openwell 3:</p>
                            <ul className="list-disc list-inside pl-2 text-xs space-y-0.5">
                              <li>Depth: {form.getValues('nearbyOpenwell3Depth')}m</li>
                              <li>Water Level: {form.getValues('nearbyOpenwell3WaterLevel')}m</li>
                              <li>Parapet: {form.getValues('nearbyOpenwell3ParapetHeight')}m</li>
                              <li>Type: {form.getValues('nearbyOpenwell3Type')}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent> 
          </Card>

          <Card> 
            <CardHeader><CardTitle>22. Recommendation</CardTitle></CardHeader> 
            <CardContent className="space-y-8">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="recommendationType"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-md">
                      <FormLabel>Recommendation Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={(val) => handleRecommendationTypeSelect(val)} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#e0fbfc] border-cyan-100 h-12 focus:ring-[#00aeef]">
                              <SelectValue placeholder="Select recommendation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recommendationTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.getValues('recommendationType') && (
                  <Button type="button" variant="outline" className="mt-8 gap-2" onClick={() => setIsRecommendationDialogOpen(true)}>
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Technical Details
                  </Button>
                )}
              </div>
            </CardContent> 
          </Card>
          <div className="flex justify-end items-center gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <div className="flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" disabled={!generatedReportId}>
                    <Link href={`/report/${generatedReportId}`} target="_blank">Investigation Report</Link>
                </Button>
                <Button asChild variant="outline" size="sm" disabled={!generatedReportId || (form.getValues('recommendationType') !== 'openwell' && form.getValues('recommendationType') !== 'borewell' && form.getValues('recommendationType') !== 'tubewell' && form.getValues('recommendationType') !== 'filterpoint')}>
                    {form.getValues('recommendationType') === 'openwell' ? (
                      <Link href={`/report/${generatedReportId}/feasibility-open-well`} target="_blank">Feasibility Report</Link>
                    ) : (
                      <Link href={`/report/${generatedReportId}/feasibility-bore-well`} target="_blank">Feasibility Report</Link>
                    )}
                </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Recommendation Dialog */}
      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#e0fbfc] p-6 space-y-6">
            <DialogHeader className="border-b border-cyan-200 pb-4">
              <DialogTitle className="text-[#00aeef] text-2xl font-bold uppercase tracking-tight">
                For {recommendationTypeOptions.find(o => o.value === form.getValues('recommendationType'))?.label || 'Well'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {(form.getValues('recommendationType') === 'borewell' || form.getValues('recommendationType') === 'tubewell' || form.getValues('recommendationType') === 'filterpoint') && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Recommended total depth (m)</Label>
                      <Input 
                        {...form.register('recBorewellTotalDepth')} 
                        className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Recommended diameter</Label>
                      <Select 
                        onValueChange={(val) => form.setValue('recBorewellDiameter', val)} 
                        defaultValue={form.getValues('recBorewellDiameter')}
                      >
                        <SelectTrigger className="bg-white border-cyan-100 h-12">
                          <SelectValue placeholder="Select diameter" />
                        </SelectTrigger>
                        <SelectContent>
                          {borewellDiameterOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Expected Overburden Thickness (m)</Label>
                    <Input 
                      {...form.register('expectedOverburden')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Additional Borewell Details & Location</Label>
                    <Textarea 
                      {...form.register('recommendationBorewell')} 
                      rows={4} 
                      className="bg-white border-cyan-100 focus:ring-[#00aeef] resize-none" 
                    />
                  </div>
                </>
              )}

              {form.getValues('recommendationType') === 'openwell' && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Recommended total depth (m)</Label>
                      <Input 
                        {...form.register('recOpenwellTotalDepth')} 
                        className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Recommended diameter</Label>
                      <Select 
                        onValueChange={(val) => form.setValue('recOpenwellDiameter', val)} 
                        defaultValue={form.getValues('recOpenwellDiameter')}
                      >
                        <SelectTrigger className="bg-white border-cyan-100 h-12">
                          <SelectValue placeholder="Select diameter" />
                        </SelectTrigger>
                        <SelectContent>
                          {openwellDiameterOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Additional Open Well Details & Location</Label>
                    <Textarea 
                      {...form.register('recommendationOpenwell')} 
                      rows={4} 
                      className="bg-white border-cyan-100 focus:ring-[#00aeef] resize-none" 
                    />
                  </div>
                </>
              )}

              {form.getValues('recommendationType') === 'not_feasible' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Reason for Non-Feasibility</Label>
                  <Textarea 
                    rows={6} 
                    placeholder="Enter detailed reasons why the site is not feasible for any structures..."
                    className="bg-white border-cyan-100 focus:ring-[#00aeef] resize-none" 
                  />
                </div>
              )}
            </div>

            <DialogFooter className="bg-white/50 p-4 -mx-6 -mb-6 border-t border-cyan-100">
              <Button 
                type="button" 
                onClick={() => setIsRecommendationDialogOpen(false)} 
                className="bg-[#00aeef] hover:bg-[#00aeef]/90 w-full h-12 font-bold uppercase tracking-widest shadow-lg text-white"
              >
                Submit Recommendation
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nearby Structure Dialog */}
      <Dialog open={isNearbyDialogOpen} onOpenChange={setIsNearbyDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#e0fbfc] p-6 space-y-6">
            <DialogHeader className="border-b border-cyan-200 pb-4">
              <DialogTitle className="text-[#00aeef] text-2xl font-bold uppercase tracking-tight">
                {selectedNearbyStructure?.includes('no_') ? "Confirm Selection" : `Details for ${selectedNearbyStructure}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedNearbyStructure?.startsWith('borewell') && !selectedNearbyStructure.includes('no_') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">1) Total Depth (m)</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'borewell1' ? 'nearbyBorewell1Depth' : selectedNearbyStructure === 'borewell2' ? 'nearbyBorewell2Depth' : 'nearbyBorewell3Depth')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                      placeholder="Enter depth"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">2) Diameter of well</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'borewell1' ? 'nearbyBorewell1Diameter' : selectedNearbyStructure === 'borewell2' ? 'nearbyBorewell2Diameter' : 'nearbyBorewell3Diameter')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                      placeholder="e.g. 150mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">3) Zone Details</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'borewell1' ? 'nearbyBorewell1Zones' : selectedNearbyStructure === 'borewell2' ? 'nearbyBorewell2Zones' : 'nearbyBorewell3Zones')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                      placeholder="e.g. Fractured zones at 60m"
                    />
                  </div>
                </div>
              )}

              {selectedNearbyStructure?.startsWith('openwell') && !selectedNearbyStructure.includes('no_') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">1) Total Depth (m)</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'openwell1' ? 'nearbyOpenwell1Depth' : selectedNearbyStructure === 'openwell2' ? 'nearbyOpenwell2Depth' : 'nearbyOpenwell3Depth')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">2) Water level (m)</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'openwell1' ? 'nearbyOpenwell1WaterLevel' : selectedNearbyStructure === 'openwell2' ? 'nearbyOpenwell2WaterLevel' : 'nearbyOpenwell3WaterLevel')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">3) Parappette Height (m)</Label>
                    <Input 
                      {...form.register(selectedNearbyStructure === 'openwell1' ? 'nearbyOpenwell1ParapetHeight' : selectedNearbyStructure === 'openwell2' ? 'nearbyOpenwell2ParapetHeight' : 'nearbyOpenwell3ParapetHeight')} 
                      className="bg-white border-cyan-100 h-12 focus:ring-[#00aeef]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">4) Perennial / Seasonal</Label>
                    <Select 
                      onValueChange={(val) => {
                        const fieldName = selectedNearbyStructure === 'openwell1' ? 'nearbyOpenwell1Type' : selectedNearbyStructure === 'openwell2' ? 'nearbyOpenwell2Type' : 'nearbyOpenwell3Type';
                        form.setValue(fieldName as any, val);
                      }}
                      defaultValue={form.getValues(selectedNearbyStructure === 'openwell1' ? 'nearbyOpenwell1Type' : selectedNearbyStructure === 'openwell2' ? 'nearbyOpenwell2Type' : 'nearbyOpenwell3Type')}
                    >
                      <SelectTrigger className="bg-white border-cyan-100 h-12">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perennial">Perennial</SelectItem>
                        <SelectItem value="Seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedNearbyStructure?.includes('no_') && (
                <div className="p-4 bg-white/50 rounded-lg text-center">
                  <p className="text-slate-700 font-medium">Are you sure there are no nearby {selectedNearbyStructure.includes('borewell') ? 'borewells' : 'open wells'} at this site?</p>
                </div>
              )}
            </div>

            <DialogFooter className="bg-white/50 p-4 -mx-6 -mb-6 border-t border-cyan-100">
              <Button 
                type="button" 
                onClick={() => {
                  if (selectedNearbyStructure === 'no_borewell') {
                    form.setValue('noNearbyBorewells', true);
                    form.setValue('nearbyBorewell1Depth', '');
                    form.setValue('nearbyBorewell2Depth', '');
                    form.setValue('nearbyBorewell3Depth', '');
                  } else if (selectedNearbyStructure === 'no_openwell') {
                    form.setValue('noNearbyOpenwells', true);
                    form.setValue('nearbyOpenwell1Depth', '');
                    form.setValue('nearbyOpenwell2Depth', '');
                    form.setValue('nearbyOpenwell3Depth', '');
                  } else if (selectedNearbyStructure?.startsWith('borewell')) {
                    form.setValue('noNearbyBorewells', false);
                  } else if (selectedNearbyStructure?.startsWith('openwell')) {
                    form.setValue('noNearbyOpenwells', false);
                  }
                  setIsNearbyDialogOpen(false);
                }} 
                className="bg-[#00aeef] hover:bg-[#00aeef]/90 w-full h-12 font-bold uppercase tracking-widest shadow-lg text-white"
              >
                {selectedNearbyStructure?.includes('no_') ? "Confirm Status" : "Save Details"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}