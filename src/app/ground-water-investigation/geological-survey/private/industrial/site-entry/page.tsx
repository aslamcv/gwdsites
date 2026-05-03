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
  "Areekode — Safe",
  "Perumpadappu — Safe",
  "Kalikavu — Safe",
  "Kondotty — Semi-Critical",
  "Kuttippuram — Semi-Critical",
  "Malappuram — Semi-Critical",
  "Mankada — Semi-Critical",
  "Nilambur — Safe",
  "Perinthalmanna — Safe",
  "Ponnani — Safe",
  "Tanur — Semi-Critical",
  "Tirur — Semi-Critical",
  "Tirurangadi — Semi-Critical",
  "Vengara — Semi-Critical",
  "Wandoor — Safe"
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

export default function IndustrialSiteEntryPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const id = searchParams.get('id');
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(id);

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const { lsgs } = useLsgdData();
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      nameOfSite: '', address: '', latitude: '', longitude: '', fileNo: '', applicantNameAddress: '', applicationDate: '', village: '', ward: '', altitude: '', lsgd: '', assembly: '', block: '', typeAppliedFor: 'borewell', dateOfFeasibility: '', noOfBeneficiaries: '', toposheet: '', surveyNoArea: '', microWatershed: '', hydrogeology: 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.', nearbyBorewell1Depth: '', nearbyBorewell1Diameter: '', nearbyBorewell1Zones: '', nearbyBorewell2Depth: '', nearbyBorewell2Diameter: '', nearbyBorewell2Zones: '', nearbyBorewell3Depth: '', nearbyBorewell3Diameter: '', nearbyBorewell3Zones: '', noNearbyBorewells: false, nearbyOpenwell1Depth: '', nearbyOpenwell1WaterLevel: '', nearbyOpenwell1ParapetHeight: '', nearbyOpenwell1Type: 'Perennial', nearbyOpenwell2Depth: '', nearbyOpenwell2WaterLevel: '', nearbyOpenwell2ParapetHeight: '', nearbyOpenwell2Type: 'Perennial', nearbyOpenwell3Depth: '', nearbyOpenwell3WaterLevel: '', nearbyOpenwell3ParapetHeight: '', nearbyOpenwell3Type: 'Perennial', noNearbyOpenwells: false, recommendationType: '', recommendationBorewell: '', recommendationOpenwell: '', recBorewellTotalDepth: '', recBorewellDiameter: '', expectedOverburden: '', recOpenwellTotalDepth: '', recOpenwellDiameter: '',
    },
  });

  useEffect(() => {
    if (report) {
      form.reset(report as any);
    }
  }, [report, form]);

  const onSubmit = (values: ReportFormValues) => {
    if (!user || !firestore || !generatedReportId) return;

    startTransition(() => {
      const reportDocRef = doc(firestore, 'groundwaterReports', generatedReportId);
      const reportData = {
        ...values,
        updatedAt: new Date().toISOString(),
        status: 'Published' as const,
      };

      updateDoc(reportDocRef, reportData)
        .then(() => {
          toast({ title: 'Report Updated', description: 'Technical records synchronized.' });
          router.push('/ground-water-investigation');
        })
        .catch((error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: 'update', requestResourceData: reportData }));
        });
    });
  };

  if (isLoading && id) return <div className="p-12 text-center animate-pulse">Loading technical node...</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/ground-water-investigation"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1"><PageHeader title="Edit Industrial Groundwater Report" /></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem> <FormLabel>1. Name of Site</FormLabel> <FormControl><Input {...field} /></FormControl> </FormItem> )} />
                <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem> <FormLabel>5. File No</FormLabel> <FormControl><Input {...field} /></FormControl> </FormItem> )} />
                <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>11. LSGD</FormLabel> 
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select LSGD" /></SelectTrigger></FormControl>
                      <SelectContent>{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="village" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>8. Village</FormLabel> 
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[300px]">{villageOptions.map(g => <SelectGroup key={g.label}><SelectLabel>{g.label}</SelectLabel>{g.options.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectGroup>)}</SelectContent>
                    </Select> 
                  </FormItem> 
                )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Technical Evaluation</CardTitle></CardHeader>
            <CardContent className="space-y-6">
               <FormField control={form.control} name="hydrogeology" render={({ field }) => ( <FormItem><FormLabel>Hydrogeology</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem> )} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <FormField control={form.control} name="recommendationType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendation Type</FormLabel>
                      <Select onValueChange={val => { form.setValue('recommendationType', val); setIsRecommendationDialogOpen(true); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{recommendationTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => setIsRecommendationDialogOpen(true)}><ClipboardList className="size-4"/> Edit Parameters</Button>
               </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4"><Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Records</Button></div>
        </form>
      </Form>

      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 space-y-6">
          <DialogHeader><DialogTitle>Technical Parameters</DialogTitle></DialogHeader>
          <div className="space-y-6">
            {(form.getValues('recommendationType') === 'borewell' || form.getValues('recommendationType') === 'tubewell') && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Total depth (m)</Label><Input {...form.register('recBorewellTotalDepth')} /></div>
                <div className="space-y-2"><Label>Diameter</Label><Select onValueChange={(val) => form.setValue('recBorewellDiameter', val)} value={form.getValues('recBorewellDiameter')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{borewellDiameterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
            )}
            {form.getValues('recommendationType') === 'openwell' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Total depth (m)</Label><Input {...form.register('recOpenwellTotalDepth')} /></div>
                <div className="space-y-2"><Label>Diameter (m)</Label><Select onValueChange={(val) => form.setValue('recOpenwellDiameter', val)} value={form.getValues('recOpenwellDiameter')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{openwellDiameterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
            )}
            <div className="space-y-2"><Label>Recommendation Text</Label><Textarea {...form.register(form.getValues('recommendationType') === 'openwell' ? 'recommendationOpenwell' : 'recommendationBorewell')} rows={4} /></div>
          </div>
          <DialogFooter><Button onClick={() => setIsRecommendationDialogOpen(false)}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}