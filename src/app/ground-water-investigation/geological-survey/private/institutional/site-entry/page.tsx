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
import { useState, useTransition, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const id = searchParams.get('id');
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(id);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const { lsgs, constituencies } = useLsgdData();
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [isNearbyDialogOpen, setIsNearbyDialogOpen] = useState(false);
  const [selectedNearbyStructure, setSelectedNearbyStructure] = useState<string | null>(null);

  const defaultValues: ReportFormValues = useMemo(() => ({
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
    nearbyBorewell1Depth: '',
    nearbyBorewell1Diameter: '',
    nearbyBorewell1Zones: '',
    nearbyBorewell2Depth: '',
    nearbyBorewell2Diameter: '',
    nearbyBorewell2Zones: '',
    nearbyBorewell3Depth: '',
    nearbyBorewell3Diameter: '',
    nearbyBorewell3Zones: '',
    noNearbyBorewells: false,
    nearbyOpenwell1Depth: '',
    nearbyOpenwell1WaterLevel: '',
    nearbyOpenwell1ParapetHeight: '',
    nearbyOpenwell1Type: 'Perennial',
    nearbyOpenwell2Depth: '',
    nearbyOpenwell2WaterLevel: '',
    nearbyOpenwell2ParapetHeight: '',
    nearbyOpenwell2Type: 'Perennial',
    nearbyOpenwell3Depth: '',
    nearbyOpenwell3WaterLevel: '',
    nearbyOpenwell3ParapetHeight: '',
    nearbyOpenwell3Type: 'Perennial',
    noNearbyOpenwells: false,
    recommendationType: '',
    recommendationBorewell: '',
    recommendationOpenwell: '',
    recBorewellTotalDepth: '',
    recBorewellDiameter: '',
    expectedOverburden: '',
    recOpenwellTotalDepth: '',
    recOpenwellDiameter: '',
  }), []);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues
  });

  useEffect(() => {
    if (cloudReport) {
      form.reset({
        ...defaultValues,
        ...cloudReport,
        hydrogeology: cloudReport.hydrogeology || defaultValues.hydrogeology
      });
    }
  }, [cloudReport, form, defaultValues]);

  const onSubmit = (values: ReportFormValues) => {
    if (!user || !firestore || !generatedReportId) return;

    startTransition(() => {
      const reportDocRef = doc(firestore, 'groundwaterReports', generatedReportId);
      
      const reportData = {
        ...values,
        reportDate: new Date().toISOString().split('T')[0],
        applicantName: values.applicantNameAddress?.split('\n')[0] || 'Unknown Applicant',
        applicantAddress: values.applicantNameAddress,
        status: 'Published' as const,
        category: "Geological Survey / Private / Institutional",
        updatedAt: new Date().toISOString(),
      };

      updateDoc(reportDocRef, reportData)
        .then(() => {
          toast({ title: 'Report Data Updated', description: 'Technical records and site details saved successfully.' });
          router.push('/downloads');
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: reportDocRef.path,
            operation: 'update',
            requestResourceData: reportData,
          }));
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

  if (isLoading && id) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ground-water-investigation/geological-survey/private/institutional">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={(val) => handleRecommendationTypeSelect(val)} value={field.value}>
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
              Save Record
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
