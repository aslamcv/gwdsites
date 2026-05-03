'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useTransition, useMemo, useEffect } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import type { GroundwaterReport } from '@/lib/types';
import { useLsgdData } from '@/hooks/use-lsgd-data';

const stepDataItemSchema = z.object({
  time: z.number(),
  waterLevel: z.coerce.string().optional(),
  drawdown: z.coerce.string().optional(),
});

const summaryItemSchema = z.object({
  step: z.number(),
  duration: z.coerce.string().optional(),
  qLps: z.coerce.string().optional(),
  qLpm: z.coerce.string().optional(),
  drawdown: z.coerce.string().optional(),
});

const formSchema = z.object({
  nameOfSite: z.string().min(1, 'Name of Site is required'),
  district: z.string().min(1, 'District is required'),
  lsgd: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  fileNo: z.string().optional(),
  staticWaterLevel: z.coerce.string().optional(),
  depthOfWell: z.coerce.string().optional(),
  remarks: z.string().optional(),
  recommendation: z.string().optional(),
  step1: z.array(stepDataItemSchema),
  step2: z.array(stepDataItemSchema),
  step3: z.array(stepDataItemSchema),
  summary: z.array(summaryItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

const timeIntervals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 120, 140, 160, 180, 210, 240, 270, 300];
const defaultStepData = timeIntervals.map(time => ({ time, waterLevel: '', drawdown: '' }));
const defaultSummaryData = [1, 2, 3].map(step => ({ step, duration: '60', qLps: '', qLpm: '', drawdown: '' }));

export default function OtherDistrictBoreWellPumpingTestPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const { lsgs } = useLsgdData();

  const id = searchParams.get('id');
  const districtOptions = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'];

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport } = useDoc<GroundwaterReport>(reportRef);

  const defaultValues: FormValues = useMemo(() => ({
    nameOfSite: '', district: '', lsgd: '', date: new Date().toISOString().split('T')[0], fileNo: '', staticWaterLevel: '', depthOfWell: '', remarks: '', recommendation: '', step1: defaultStepData, step2: defaultStepData, step3: defaultStepData, summary: defaultSummaryData,
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

  const { fields: step1Fields } = useFieldArray({ control: form.control, name: 'step1' });
  const { fields: step2Fields } = useFieldArray({ control: form.control, name: 'step2' });
  const { fields: step3Fields } = useFieldArray({ control: form.control, name: 'step3' });
  const { fields: summaryFields } = useFieldArray({ control: form.control, name: 'summary' });

  const onSubmit = (values: FormValues) => {
    if (!user || !firestore) return;
    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = reportDocRef.id;

      const reportData = {
        ...values,
        id: reportId,
        reportDate: values.date,
        applicantName: values.nameOfSite,
        reportTitle: `Bore Well Yield Test at ${values.nameOfSite}`,
        status: 'Published' as const,
        purpose: "Pumping Test / Other District / Bore Well",
        category: "Pumping Test / Other District / Bore Well",
        uploadedBy: user.uid,
        createdAt: cloudReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation.then(() => {
        toast({ title: 'Bore Well SDT Recorded', description: `Step Drawdown Test data for ${values.nameOfSite} in ${values.district} has been saved.` });
        setGeneratedReportId(reportId);
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: reportDocRef.path, operation: isUpdate ? 'update' : 'create', requestResourceData: reportData }));
      });
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pumping-test/other-district">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader title="Other District: Bore Well Yield Test (SDT)" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-primary/10">
            <CardHeader className="bg-primary/5 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Administrative Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-500">Target District</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11 border-primary/10 font-bold text-primary"><SelectValue placeholder="Select District" /></SelectTrigger></FormControl><SelectContent>{districtOptions.map((district) => (<SelectItem key={district} value={district}>{district}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-500">Site/Applicant</FormLabel><FormControl><Input className="h-11 border-primary/10 font-bold" placeholder="Site Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-500">File Reference</FormLabel><FormControl><Input className="h-11 border-primary/10" placeholder="e.g. MPM/GWD/..." {...field} /></FormControl></FormItem> )} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Step Drawdown Pumping Log
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[500px] w-full">
                    <Table>
                        <TableHeader className="bg-slate-100/50 sticky top-0 z-20">
                            <TableRow>
                                <TableHead className="w-24 text-center font-black text-[10px] uppercase">Time (min)</TableHead>
                                <TableHead colSpan={2} className="text-center font-black text-[10px] uppercase border-x border-slate-200">Step 1</TableHead>
                                <TableHead colSpan={2} className="text-center font-black text-[10px] uppercase border-x border-slate-200">Step 2</TableHead>
                                <TableHead colSpan={2} className="text-center font-black text-[10px] uppercase border-x border-slate-200">Step 3</TableHead>
                            </TableRow>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="border-r border-slate-200"></TableHead>
                                <TableHead className="text-[9px] font-bold text-center border-r border-slate-200">WL (mbmp)</TableHead>
                                <TableHead className="text-[9px] font-bold text-center border-r border-slate-200">DD (m)</TableHead>
                                <TableHead className="text-[9px] font-bold text-center border-r border-slate-200">WL (mbmp)</TableHead>
                                <TableHead className="text-[9px] font-bold text-center border-r border-slate-200">DD (m)</TableHead>
                                <TableHead className="text-[9px] font-bold text-center border-r border-slate-200">WL (mbmp)</TableHead>
                                <TableHead className="text-[9px] font-bold text-center">DD (m)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timeIntervals.map((time, index) => (
                                <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-bold text-center text-xs border-r border-slate-100">{time}</TableCell>
                                    <TableCell className="p-0.5 border-r border-slate-100"><FormField control={form.control} name={`step1.${index}.waterLevel`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none focus:bg-white" {...field} />} /></TableCell>
                                    <TableCell className="p-0.5 border-r border-slate-100"><FormField control={form.control} name={`step1.${index}.drawdown`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none font-bold focus:bg-white" {...field} />} /></TableCell>
                                    <TableCell className="p-0.5 border-r border-slate-100"><FormField control={form.control} name={`step2.${index}.waterLevel`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none focus:bg-white" {...field} />} /></TableCell>
                                    <TableCell className="p-0.5 border-r border-slate-100"><FormField control={form.control} name={`step2.${index}.drawdown`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none font-bold focus:bg-white" {...field} />} /></TableCell>
                                    <TableCell className="p-0.5 border-r border-slate-100"><FormField control={form.control} name={`step3.${index}.waterLevel`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none focus:bg-white" {...field} />} /></TableCell>
                                    <TableCell className="p-0.5"><FormField control={form.control} name={`step3.${index}.drawdown`} render={({ field }) => <Input className="h-8 text-[11px] border-none text-center shadow-none font-bold focus:bg-white" {...field} />} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-emerald-500/10">
            <CardHeader className="bg-emerald-500/5 border-b py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> SDT Summary (Other District)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 overflow-x-auto">
                <Table>
                    <TableHeader className="bg-emerald-50/50"><TableRow><TableHead className="text-[10px] font-black uppercase">Step No</TableHead><TableHead className="text-[10px] font-black uppercase">Duration (min)</TableHead><TableHead className="text-[10px] font-black uppercase">Q (lps)</TableHead><TableHead className="text-[10px] font-black uppercase">Q (lpm)</TableHead><TableHead className="text-[10px] font-black uppercase">Drawdown (m)</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {[1, 2, 3].map((step, idx) => (
                            <TableRow key={step}>
                                <TableCell className="font-bold text-xs">Step {step}</TableCell>
                                <TableCell><FormField control={form.control} name={`summary.${idx}.duration`} render={({ field }) => <Input className="h-9 text-xs" {...field} />} /></TableCell>
                                <TableCell><FormField control={form.control} name={`summary.${idx}.qLps`} render={({ field }) => <Input className="h-9 text-xs" {...field} />} /></TableCell>
                                <TableCell><FormField control={form.control} name={`summary.${idx}.qLpm`} render={({ field }) => <Input className="h-9 text-xs" {...field} />} /></TableCell>
                                <TableCell><FormField control={form.control} name={`summary.${idx}.drawdown`} render={({ field }) => <Input className="h-9 text-xs font-bold text-emerald-700" {...field} />} /></TableCell>
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
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><FileText className="mr-2 h-3 w-3" />YT Completion Report</Button>
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><Activity className="mr-2 h-3 w-3" />Yield Test Report</Button>
              <Button variant="outline" size="sm" disabled={!generatedReportId} className="h-9 text-[10px] font-bold uppercase tracking-wider border-primary/20 text-primary"><FileSpreadsheet className="mr-2 h-3 w-3" />Pumping Data</Button>
            </div>
            <Button type="submit" disabled={isPending} className="px-12 h-14 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-white">{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Finalize SDT Record</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
