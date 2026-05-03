'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Calculator, 
  Calendar, 
  ClipboardList, 
  Loader2, 
  MapPin,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const vesRowSchema = z.object({
  sNo: z.string(),
  ab2: z.number(),
  mn2: z.number(),
  k: z.number(),
  ves1_r: z.string().optional(),
  ves1_ra: z.string().optional(),
  ves2_r: z.string().optional(),
  ves2_ra: z.string().optional(),
});

const reportSchema = z.object({
  fileNo: z.string().min(1, 'File No. is required.'),
  location: z.string().min(1, 'Location is required.'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  spreadingDirection: z.string().optional(),
  vesArea: z.string().optional(),
  vesData: z.array(vesRowSchema),
  recommendationType: z.string().optional(),
  vesRecommendation: z.string().optional(),
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

export default function InstitutionalGeophysicalSurveySiteEntryPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const hgName = searchParams.get('geophysicist');
  const jhgName = searchParams.get('juniorGeophysicist');
  const gaName = searchParams.get('geophysicalAssistant');

  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      fileNo: '',
      location: '',
      latitude: '',
      longitude: '',
      spreadingDirection: 'NE-SW',
      vesArea: '',
      vesData: staticVesData.map((row) => ({
        ...row,
        ves1_r: '',
        ves1_ra: '',
        ves2_r: '',
        ves2_ra: '',
      })),
      recommendationType: '',
      vesRecommendation: 'Lateritic terrain with Overburden thickness of approximately 20m inferred from VES data followed by bedrock with indication of Minor Fracture at approx 80m depth. A low yielding borewell may be feasible at the location. OB-20m TD-110m',
      recommendationBorewell: '',
      recommendationOpenwell: '',
      recBorewellTotalDepth: '',
      recBorewellDiameter: '',
      expectedOverburden: '',
      recOpenwellTotalDepth: '',
      recOpenwellDiameter: '',
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'vesData',
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('vesData') && (name.endsWith('ves1_r') || name.endsWith('ves2_r'))) {
        const index = parseInt(name.split('.')[1]);
        const row = value.vesData?.[index];
        if (!row) return;

        const k = staticVesData[index].k;

        if (name.endsWith('ves1_r')) {
          const r = parseFloat(row.ves1_r || '0');
          if (!isNaN(r)) {
            const ra = (r * k).toFixed(2);
            form.setValue(`vesData.${index}.ves1_ra`, ra);
          }
        }

        if (name.endsWith('ves2_r')) {
          const r = parseFloat(row.ves2_r || '0');
          if (!isNaN(r)) {
            const ra = (r * k).toFixed(2);
            form.setValue(`vesData.${index}.ves1_ra`, ra);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleRecommendationTypeSelect = (type: string) => {
    form.setValue('recommendationType', type);
    setIsRecommendationDialogOpen(true);
  };

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
        applicantName: values.location,
        reportTitle: `Geophysical Survey at ${values.location}`,
        status: 'Published' as const,
        purpose: "Ground Water Investigation / Geophysical Survey / Government / Institutional",
        dateOfInvestigation: dateOfInvestigation,
        category: "Geophysical Survey / Government / Institutional",
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
        staffAssignment: {
          geophysicalAssistant: gaName || "",
          juniorGeophysicist: jhgName || "",
          geophysicist: hgName || ""
        }
      };

      setDoc(reportRef, reportData)
        .then(() => {
          toast({ 
            title: 'VES Report Saved', 
            description: 'Technical data and recommendations have been recorded.' 
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

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ground-water-investigation/geophysical-survey/government/institutional">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground uppercase">
              Vertical Electrical Sounding
            </h1>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Electrode Configuration: Schlumberger | Instrument: Aquameter CRM 20
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedReportId && (
            <Button asChild variant="outline" size="sm" className="bg-primary text-white hover:bg-primary/90 gap-2 h-10 px-6 rounded-xl font-bold uppercase tracking-wider">
              <Link href={`/report/${generatedReportId}/ves`} target="_blank"><FileText className="size-4" /> Save Final Report</Link>
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending} className="w-full md:w-auto h-10 px-6 rounded-xl font-bold uppercase tracking-wider">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Data
          </Button>
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="fileNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-slate-500">File No:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter File Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-black uppercase text-slate-500">Location:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Investigation Site Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-slate-500 flex items-center gap-1"><MapPin className="size-3" /> Latitude:</FormLabel>
                      <FormControl>
                        <Input placeholder={`e.g. 11°3'50" N`} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-slate-500 flex items-center gap-1"><MapPin className="size-3" /> Longitude:</FormLabel>
                      <FormControl>
                        <Input placeholder={`e.g. 76°17'44" E`} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spreadingDirection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-slate-500">Spreading Direction:</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NE-SW" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vesArea"
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel className="text-xs font-black uppercase text-slate-500">VES area:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter VES Area Details" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                VES Measurement Data (Auto-Calculating)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="border-collapse min-w-[1000px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px] border-r text-center" rowSpan={2}>S. No.</TableHead>
                    <TableHead className="text-center border-r" colSpan={3}>Measuring Point / Spreading Direction</TableHead>
                    <TableHead className="text-center border-r" colSpan={2}>VES Data</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-center border-r">AB/2 (m)</TableHead>
                    <TableHead className="text-center border-r">MN/2 (m)</TableHead>
                    <TableHead className="text-center border-r bg-primary/5">K (Factor)</TableHead>
                    <TableHead className="text-center border-r">R (Ohms)</TableHead>
                    <TableHead className="text-center">Ra (Ohm meter)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-bold border-r text-xs py-2">{field.sNo}</TableCell>
                      <TableCell className="text-center border-r text-xs py-2 bg-muted/5">{field.ab2}</TableCell>
                      <TableCell className="text-center border-r text-xs py-2 bg-muted/5">{field.mn2}</TableCell>
                      <TableCell className="text-center border-r text-xs py-2 font-mono text-primary bg-primary/5">{field.k}</TableCell>
                      <TableCell className="border-r p-1">
                        <FormField control={form.control} name={`vesData.${index}.ves1_r`} render={({ field }) => (
                          <FormItem className="space-y-0"><FormControl><Input className="h-8 text-xs border-transparent focus:border-primary focus:ring-0 text-center" placeholder="0.00" {...field} /></FormControl></FormItem>
                        )} />
                      </TableCell>
                      <TableCell className="p-1 bg-primary/5">
                        <FormField control={form.control} name={`vesData.${index}.ves1_ra`} render={({ field }) => (
                          <FormItem className="space-y-0"><FormControl><Input readOnly className="h-8 text-xs border-transparent bg-transparent text-center font-bold text-primary" {...field} /></FormControl></FormItem>
                        )} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card> 
            <CardHeader><CardTitle className="text-lg font-bold text-primary">Report & Recommendations</CardTitle></CardHeader> 
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="vesRecommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-slate-500">Technical Assessment & Recommendation:</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4} 
                        placeholder="Lateritic terrain with Overburden thickness of approximately 20m..." 
                        className="bg-white border-cyan-100 focus:ring-[#00aeef] resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="recommendationType"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-md">
                      <FormLabel className="text-xs font-black uppercase text-slate-500">Structure Recommendation Type</FormLabel>
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
                  <Button type="button" variant="outline" className="mt-8 gap-2 border-primary/20 text-primary" onClick={() => setIsRecommendationDialogOpen(true)}>
                    <ClipboardList className="h-4 w-4" />
                    Recommendation Parameters
                  </Button>
                )}
              </div>
            </CardContent> 
          </Card>
          
          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-[10px] text-muted-foreground italic uppercase">
              Confidential technical record of Ground Water Department Kerala. 
            </p>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Survey Record
            </Button>
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
                        value={form.getValues('recBorewellDiameter')}
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
                        value={form.getValues('recOpenwellDiameter')}
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
                Confirm Recommendation
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
