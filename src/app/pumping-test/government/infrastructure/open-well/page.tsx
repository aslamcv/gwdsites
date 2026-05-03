'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, FileText, Activity, FileSpreadsheet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useTransition, useMemo, useEffect } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import type { GroundwaterReport } from '@/lib/types';
import { useLsgdData } from '@/hooks/use-lsgd-data';

const pumpingDataItemSchema = z.object({
  timeSincePumpingStarted: z.string(),
  date: z.string().optional(),
  timeHrMin: z.string().optional(),
  depthToWaterLevel: z.coerce.string().optional(),
  drawdown: z.coerce.string().optional(),
  obw1: z.coerce.string().optional(),
  obw2: z.coerce.string().optional(),
  remarks: z.string().optional(),
});

const recoveryDataItemSchema = z.object({
  date: z.string().optional(),
  timeHrMin: z.string().optional(),
  timeSincePumpingStarted: z.coerce.string().optional(),
  timeSincePumpingStopped: z.number(),
  t_t_prime: z.string().optional(),
  depthToWaterLevel: z.coerce.string().optional(),
  residualDrawdown: z.coerce.string().optional(),
  remarks: z.string().optional(),
});


const formSchema = z.object({
  nameOfSite: z.string().min(1, 'Name of Site is required'),
  address: z.string().min(1, 'Address is required'),
  lsgd: z.string().min(1, 'LSGD is required'),
  district: z.string().min(1, 'District is required'),
  nameOfObserver: z.string().optional(),
  pumpCapacity: z.coerce.string().optional(),
  measuringPointHt: z.coerce.string().optional(),
  lattitude: z.string().optional(),
  longitude: z.string().optional(),
  typeOfWell: z.string().optional(),
  depthOfWell: z.coerce.string().optional(),
  diameterOfWell: z.coerce.string().optional(),
  staticWaterLevel: z.coerce.string().optional(),
  majorZones: z.string().optional(),
  transmissivityPw: z.string().optional(),
  transmissivityOw1: z.string().optional(),
  transmissivityOw2: z.string().optional(),
  averageDischarge: z.coerce.string().optional(),
  maxDrawdown: z.coerce.string().optional(),
  depthOfPump: z.coerce.string().optional(),
  periodPumped: z.coerce.string().optional(),
  observationWellNo: z.string().optional(),
  periodOfRecovery: z.coerce.string().optional(),
  remarks: z.string().optional(),
  recommendation: z.string().optional(),
  pumpingData: z.array(pumpingDataItemSchema),
  recoveryData: z.array(recoveryDataItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

const timeIntervals = ['0*', '0.25', '0.5', '0.75', '1.00', '2.00', '3.00', '4', '5', '6', '7', '8', '9', '10*', '12', '14', '16', '18', '20*', '25', '30*', '35', '40*', '50*', '60*', '70*', '80*', '90*', '100*', '110', '120', '130', '140', '150*', '160', '170', '180', '190', '200*', '220', '240', '250*', '260', '280', '300*'];
const defaultPumpingData = timeIntervals.map(time => ({ timeSincePumpingStarted: time, date: '', timeHrMin: '', depthToWaterLevel: '', drawdown: '', obw1: '', obw2: '', remarks: '' }));
const recoveryDataTimeIntervals = [0.00, 0.25, 0.50, 0.75, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const defaultRecoveryData = recoveryDataTimeIntervals.map(time => ({
  timeSincePumpingStopped: time, date: '', timeHrMin: '', timeSincePumpingStarted: '', t_t_prime: '', depthToWaterLevel: '', residualDrawdown: '', remarks: '',
}));

export default function OpenWellPumpingTestPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const { lsgs } = useLsgdData();

  const id = searchParams.get('id');
  const districtOptions = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'];

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport } = useDoc<GroundwaterReport>(reportRef);

  const defaultValues: FormValues = useMemo(() => ({
    nameOfSite: '', address: '', lsgd: '', district: 'Malappuram', nameOfObserver: '', pumpCapacity: '', measuringPointHt: '', lattitude: '', longitude: '', typeOfWell: 'Open well', depthOfWell: '', diameterOfWell: '', staticWaterLevel: '', majorZones: '', transmissivityPw: '', transmissivityOw1: '', transmissivityOw2: '', averageDischarge: '', maxDrawdown: '', depthOfPump: '', periodPumped: '', observationWellNo: '', periodOfRecovery: '', remarks: '', recommendation: '', pumpingData: defaultPumpingData, recoveryData: defaultRecoveryData,
  }), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  useEffect(() => {
    if (id) setGeneratedReportId(id);
    if (cloudReport) {
      form.reset({ ...defaultValues, ...cloudReport });
    }
  }, [cloudReport, id, form, defaultValues]);

  const { fields: pumpingDataFields } = useFieldArray({ control: form.control, name: 'pumpingData' });
  const { fields: recoveryDataFields } = useFieldArray({ control: form.control, name: 'recoveryData' });

  const onSubmit = (values: FormValues) => {
    if (!user || !firestore) return;
    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const reportData = {
        ...values,
        id: reportId,
        reportDate: new Date().toISOString().split('T')[0],
        applicantName: values.nameOfSite,
        reportTitle: `Open Well Yield Test at ${values.nameOfSite}`,
        status: 'Published' as const,
        purpose: "Pumping Test / Government / Infrastructure / Open Well",
        category: "Pumping Test / Government / Infrastructure / Open Well",
        uploadedBy: user.uid,
        createdAt: cloudReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: 'Data Submitted', description: 'Open well pumping test data has been successfully saved.' });
        setGeneratedReportId(reportId);
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  return (
    <div className="p-4 sm:p-6">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pumping-test/government/infrastructure">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader title="Open Well/Pond Yield Test (PYT/WPT) Data" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site & Well Information</CardTitle>
              <CardDescription>Circular No. T1/469/16/DGW dated 3/11/2016</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-4">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem><FormLabel>Name of Site</FormLabel><FormControl><Input placeholder="Site Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Full Address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>LSGD</FormLabel> 
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={lsgs.length > 0 ? "Select LSGD" : "Import in Settings"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {lsgs.map((lsg) => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger></FormControl><SelectContent>{districtOptions.map((district) => (<SelectItem key={district} value={district}>{district}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="lattitude" render={({ field }) => ( <FormItem><FormLabel>Lattitude</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="nameOfObserver" render={({ field }) => ( <FormItem><FormLabel>Name of Observer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="pumpCapacity" render={({ field }) => ( <FormItem><FormLabel>Capacity of Pump (HP)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="measuringPointHt" render={({ field }) => ( <FormItem><FormLabel>Ht of Measuring Point (magl)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="space-y-4">
                <FormField control={form.control} name="typeOfWell" render={({ field }) => ( <FormItem><FormLabel>Type of well</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Open well">Open well</SelectItem><SelectItem value="Pond">Pond</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="depthOfWell" render={({ field }) => ( <FormItem><FormLabel>Depth of the well (m)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="diameterOfWell" render={({ field }) => ( <FormItem><FormLabel>Diameter of the well (m)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="staticWaterLevel" render={({ field }) => ( <FormItem><FormLabel>Static water level (mbmp)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="majorZones" render={({ field }) => ( <FormItem><FormLabel>Major zones (mbgl)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="space-y-2">
                  <FormLabel>Transmisivity (m²/day)</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField control={form.control} name="transmissivityPw" render={({ field }) => ( <FormItem><FormControl><Input placeholder="PW" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="transmissivityOw1" render={({ field }) => ( <FormItem><FormControl><Input placeholder="OW-1" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="transmissivityOw2" render={({ field }) => ( <FormItem><FormControl><Input placeholder="OW-2" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                </div>
                <FormField control={form.control} name="averageDischarge" render={({ field }) => ( <FormItem><FormLabel>Average Discharge (lph)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="maxDrawdown" render={({ field }) => ( <FormItem><FormLabel>Maximum Drawdown (m)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="depthOfPump" render={({ field }) => ( <FormItem><FormLabel>Depth of Pump (mbgl)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="periodPumped" render={({ field }) => ( <FormItem><FormLabel>Period Pumped (min)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="observationWellNo" render={({ field }) => ( <FormItem><FormLabel>Observation well No</FormLabel><FormControl><Input placeholder="Well No." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="periodOfRecovery" render={({ field }) => ( <FormItem><FormLabel>Period of recovery (min)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pumping Data</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time (hr:min)</TableHead><TableHead>Time since pumping started (min)</TableHead><TableHead>Depth to Water Level (mbmp)</TableHead><TableHead>Drawdown (m)</TableHead><TableHead>OBW-1 (mbmp)</TableHead><TableHead>OBW-2 (mbmp)</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pumpingDataFields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.date`} render={({ field }) => <FormItem><FormControl><Input type="date" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.timeHrMin`} render={({ field }) => <FormItem><FormControl><Input type="time" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell className="font-medium text-center">{field.timeSincePumpingStarted}</TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.depthToWaterLevel`} render={({ field }) => <FormItem><FormControl><Input {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.drawdown`} render={({ field }) => <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.obw1`} render={({ field }) => <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.obw2`} render={({ field }) => <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`pumpingData.${index}.remarks`} render={({ field }) => <FormItem><FormControl><Input {...field} /></FormControl></FormItem>} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recovery Data</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time (hr:min)</TableHead><TableHead>Time since pumping started (min)</TableHead><TableHead>Time since pumping stopped (min)</TableHead><TableHead>t/t'</TableHead><TableHead>Depth to Water Level (mbmp)</TableHead><TableHead>Residual Drawdown (m)</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {recoveryDataFields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.date`} render={({ field }) => <FormItem><FormControl><Input type="date" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.timeHrMin`} render={({ field }) => <FormItem><FormControl><Input type="time" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.timeSincePumpingStarted`} render={({ field }) => <FormItem><FormControl><Input {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell className="font-medium text-center">{field.timeSincePumpingStopped.toFixed(2)}</TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.t_t_prime`} render={({ field }) => <FormItem><FormControl><Input {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.depthToWaterLevel`} render={({ field }) => <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.residualDrawdown`} render={({ field }) => <FormItem><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>} /></TableCell>
                                <TableCell><FormField control={form.control} name={`recoveryData.${index}.remarks`} render={({ field }) => <FormItem><FormControl><Input {...field} /></FormControl></FormItem>} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField control={form.control} name="remarks" render={({ field }) => ( <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-500">REMARKS:</FormLabel><FormControl><Textarea placeholder="Detailed Remarks" className="min-h-[100px] bg-white border-primary/10 shadow-sm" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="recommendation" render={({ field }) => ( <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-500">RECOMMENDATION:</FormLabel><FormControl><Textarea placeholder="Technical Recommendation" className="min-h-[100px] bg-white border-primary/10 shadow-sm" {...field} /></FormControl><FormMessage /></FormItem> )} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] text-muted-foreground italic uppercase mr-4">* drawdown in observation wells</p>
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><FileText className="mr-2 h-3 w-3" />YT Completion Report</Button>
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><Activity className="mr-2 h-3 w-3" />Yield Test Report</Button>
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><FileSpreadsheet className="mr-2 h-3 w-3" />Pumping Data</Button>
            </div>
            <Button type="submit" disabled={isPending} size="lg" className="px-12 font-black uppercase tracking-widest h-14 bg-primary text-white shadow-xl shadow-primary/20">{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Pumping Data</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
