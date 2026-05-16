'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ClipboardList, Calendar, Loader2, ShieldCheck } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  recommendedToGpSurvey: z.boolean().default(false),
  gpSurveyLocation: z.string().optional(),
  recommendedToPumpingTest: z.boolean().default(false),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const recommendationTypeOptions = [
  { value: 'borewell', label: 'Bore well' },
  { value: 'openwell', label: 'Open well' },
  { value: 'filterpoint', label: 'Filter point well' },
  { value: 'tubewell', label: 'Tube well' },
  { value: 'not_feasible', label: 'Not feasible for Open well & Bore well' },
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

const blockOptions = [
  "Areekode — Safe", "Perumpadappu — Safe", "Kalikavu — Safe",
  "Kondotty — Semi-Critical", "Kuttippuram — Semi-Critical", "Malappuram — Semi-Critical",
  "Mankada — Semi-Critical", "Nilambur — Safe", "Perinthalmanna — Safe",
  "Ponnani — Safe", "Tanur — Semi-Critical", "Tirur — Semi-Critical",
  "Tirurangadi — Semi-Critical", "Vengara — Semi-Critical", "Wandoor — Safe"
];

export default function EditReportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const { lsgs, constituencies } = useLsgdData();
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);

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
    nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '',
    nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '',
    nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '',
    noNearbyBorewells: false,
    nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial',
    nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial',
    nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial',
    noNearbyOpenwells: false,
    recommendationType: '',
    recommendationBorewell: '',
    recommendationOpenwell: '',
    recBorewellTotalDepth: '',
    recBorewellDiameter: '',
    expectedOverburden: '',
    recOpenwellTotalDepth: '',
    recOpenwellDiameter: '',
    recommendedToGpSurvey: false,
    gpSurveyLocation: '',
    recommendedToPumpingTest: false,
  }), []);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues
  });

  useEffect(() => {
    if (report) {
      const mergedData = { ...defaultValues, ...report };
      form.reset(mergedData);
    }
  }, [report, form, defaultValues]);

  const onSubmit = (values: ReportFormValues) => {
    if (!user || !firestore || !report) return;

    startTransition(() => {
      const reportDocRef = doc(firestore, 'groundwaterReports', report.id);
      const updatedReportData = {
        ...values,
        updatedAt: new Date().toISOString(),
      };

      updateDoc(reportDocRef, updatedReportData)
        .then(() => {
          toast({ title: 'Report Updated', description: 'The report data has been successfully updated.' });
          router.push('/downloads');
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: reportDocRef.path,
            operation: 'update',
            requestResourceData: updatedReportData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  const handleRecommendationTypeSelect = (type: string) => {
    form.setValue('recommendationType', type);
    setIsRecommendationDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h1 className="text-xl font-bold">Report not found</h1>
        <Button asChild className="mt-4"><Link href="/downloads">Back to Downloads</Link></Button>
      </div>
    );
  }

  const isRecommendedToGp = form.watch('recommendedToGpSurvey');

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/downloads"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1"><PageHeader title="Edit Groundwater Investigation Report" /></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem> <FormLabel>1. Name of Site</FormLabel> <FormControl><Input {...field} /></FormControl> </FormItem> )} />
                <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem> <FormLabel>5. File No</FormLabel> <FormControl><Input {...field} /></FormControl> </FormItem> )} />
                <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>11. LSGD</FormLabel> 
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select LSGD" /></SelectTrigger></FormControl>
                      <SelectContent>{lsgs.map((lsg) => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}</SelectContent>
                    </Select> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="village" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>8. Village</FormLabel> 
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[300px]">{villageOptions.map(g => <SelectGroup key={g.label}><SelectLabel>{g.label}</SelectLabel>{g.options.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectGroup>)}</SelectContent>
                    </Select> 
                  </FormItem> 
                )} />
              </div>
            </CardContent>
          </Card>

          <Card> 
            <CardHeader><CardTitle>Technical Data</CardTitle></CardHeader> 
            <CardContent className="space-y-6"> 
              <FormField control={form.control} name="hydrogeology" render={({ field }) => ( <FormItem><FormLabel>Hydrogeology</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <FormField control={form.control} name="recommendationType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendation Type</FormLabel>
                      <Select onValueChange={handleRecommendationTypeSelect} value={field.value}>
                        <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select recommendation"/></SelectTrigger></FormControl>
                        <SelectContent>{recommendationTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  
                  <div className="space-y-4 pt-6">
                    <FormField control={form.control} name="recommendedToGpSurvey" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) form.setValue('recommendedToPumpingTest', false);
                            }} 
                          />
                        </FormControl>
                        <Label className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">RECCOMENDED TO GP SURVEY</Label>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="recommendedToPumpingTest" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue('recommendedToGpSurvey', false);
                                form.setValue('gpSurveyLocation', '');
                              }
                            }} 
                          />
                        </FormControl>
                        <Label className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">RECCOMENDED TO PUMPING TEST</Label>
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="gpSurveyLocation" render={({ field }) => (
                      <FormItem className={cn("space-y-1.5 transition-all", !isRecommendedToGp && "opacity-20 pointer-events-none")}>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Location Details for GP Survey</FormLabel>
                        <FormControl><Input placeholder="Enter details for the recommended GP survey..." {...field} disabled={!isRecommendedToGp} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
              </div>
            </CardContent> 
          </Card>

          <div className="flex justify-end pt-4"><Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Update technical record</Button></div>
        </form>
      </Form>
    </div>
  );
}
