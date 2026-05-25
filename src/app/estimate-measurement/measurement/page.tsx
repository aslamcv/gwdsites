'use client';

import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Users, 
  Truck, 
  X,
  Mountain,
  PlusCircle,
  Trash2,
  ClipboardList,
  MapPin,
  Ruler,
  ShieldCheck,
  SearchCode
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Employee } from '@/lib/types';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';

const workOptions = [
  "Borewell Construction",
  "Borewell Flushing",
  "MWSS",
  "MWSS Renovation",
  "HPS",
  "HPR",
  "ARS",
  "Remarks"
];

export default function MeasurementEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [newSite, setNewSite] = useState({ siteName: '', workName: 'Borewell Construction', remarks: '' });

  // Centralized employees list
  const employeesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'employees'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesQuery);

  const [formData, setFormData] = useState({
    fileNo: '',
    nameOfSite: '',
    reportDate: new Date().toISOString().split('T')[0],
    conveyance: '',
    contractorName: '',
    ae: '',
    aee: '',
    otherStaff: [] as string[],
    slr: [] as string[],
    clr: [] as string[],
    driver: '',
    remarks: '',
    sites: [] as { siteName: string, workName: string, remarks: string }[]
  });

  const aes = useMemo(() => employees?.filter(e => e.designation === 'Assistant Engineer') || [], [employees]);
  const aees = useMemo(() => employees?.filter(e => e.designation === 'Assistant Executive Engineer') || [], [employees]);
  const slrs = useMemo(() => employees?.filter(e => e.designation === 'SLR') || [], [employees]);
  const clrs = useMemo(() => employees?.filter(e => e.designation === 'CLR' || e.designation === 'CLR (Employment)') || [], [employees]);
  const drivers = useMemo(() => employees?.filter(e => e.designation.includes('Driver')) || [], [employees]);

  const otherStaffOptions = useMemo(() => {
    if (!employees) return [];
    const excluded = [
      'Assistant Executive Engineer',
      'Assistant Engineer',
      'Compressor Driver',
      'HDV Driver',
      'LDV Driver',
      'SLR',
      'CLR',
      'CLR (Employment)'
    ];
    const currentlySelected = [
      formData.ae, formData.aee, formData.driver,
      ...formData.slr, ...formData.clr, ...formData.otherStaff
    ].filter(Boolean);

    return employees.filter(e => !excluded.includes(e.designation) && !currentlySelected.includes(e.name));
  }, [employees, formData]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addStaff = (key: string, name: string) => {
    if (name === "none" || !name) return;
    setFormData(prev => {
      const current = (prev as any)[key] as string[];
      if (!current.includes(name)) {
        return { ...prev, [key]: [...current, name] };
      }
      return prev;
    });
  };

  const removeStaff = (key: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev as any)[key].filter((n: string) => n !== name)
    }));
  };

  const handleAddSite = () => {
    if (!newSite.siteName) {
      toast({ title: "Name of Site Required", variant: "destructive" });
      return;
    }
    setFormData(prev => ({
      ...prev,
      sites: [...prev.sites, { ...newSite }]
    }));
    setNewSite({ siteName: '', workName: 'Borewell Construction', remarks: '' });
    setIsSiteDialogOpen(false);
  };

  const removeSite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sites: prev.sites.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!user || !firestore) return;
    startTransition(() => {
      const docRef = doc(collection(firestore, 'groundwaterReports'));
      const reportData = {
        ...formData,
        id: docRef.id,
        category: "ESTIMATE_MEASUREMENT",
        reportType: "MEASUREMENT",
        status: "Published",
        purpose: "Measurement Portal Entry",
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
        staffAssignment: {
          assistantEngineer: formData.ae,
          assistantExecutiveEngineer: formData.aee,
          supervisor: formData.otherStaff[0] || 'Unassigned',
          otherStaff: formData.otherStaff,
          slr: formData.slr,
          clr: formData.clr,
          drivers: formData.driver,
          conveyance: formData.conveyance
        }
      };

      setDocumentNonBlocking(docRef, reportData, { merge: true });
      toast({ title: 'Measurement Recorded', description: 'Technical field data and site staff synchronized.' });
      router.push('/estimate-measurement');
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen pb-32 text-black">
      
      {/* Header Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-left">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 shadow-sm text-black">
              <Link href="/estimate-measurement"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">MEASUREMENT PORTAL</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Ground Water Department, Malappuram</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Measurement Date</Label>
                <Input type="date" value={formData.reportDate} onChange={(e) => updateField('reportDate', e.target.value)} className="h-10 w-44 rounded-xl font-bold bg-white text-black border-slate-200" />
            </div>
            <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Conveyance Mode</Label>
                <Select onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance}>
                <SelectTrigger className="h-10 w-56 rounded-xl bg-slate-50 text-black border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                    <SelectItem value="department">Department Vehicle</SelectItem>
                    <SelectItem value="rented">Rented Vehicle</SelectItem>
                    <SelectItem value="private">Private Vehicle</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-blue-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Oversight
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Assistant Engineer (AE)</Label>
              <Select onValueChange={(v) => updateField('ae', v)} value={formData.ae}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                  <SelectValue placeholder="Select AE" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {aes.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Asst. Executive Engineer (AEE)</Label>
              <Select onValueChange={(v) => updateField('aee', v)} value={formData.aee}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200">
                  <SelectValue placeholder="Select AEE" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {aees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-emerald-50/50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <Users className="h-4 w-4" /> Field Technical Team
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400">SLR</Label>
                <div className="space-y-2">
                  <Select onValueChange={(v) => addStaff('slr', v)}>
                    <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200"><SelectValue placeholder="Add" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-black">
                      {slrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.slr.includes(e.name)}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {formData.slr.map(name => (
                      <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name} <X className="h-3 w-3 cursor-pointer" onClick={() => removeStaff('slr', name)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400">CLR</Label>
                <div className="space-y-2">
                  <Select onValueChange={(v) => addStaff('clr', v)}>
                    <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200"><SelectValue placeholder="Add" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-black">
                      {clrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.clr.includes(e.name)}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1">
                    {formData.clr.map(name => (
                      <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name} <X className="h-3 w-3 cursor-pointer" onClick={() => removeStaff('clr', name)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Other Staff</Label>
              <div className="space-y-2">
                <Select onValueChange={(v) => addStaff('otherStaff', v)}>
                  <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200"><SelectValue placeholder="Add Staff" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-black">
                    {otherStaffOptions.map(e => <SelectItem key={e.id} value={e.name}>{e.name} ({e.designation})</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {formData.otherStaff.map(name => (
                    <Badge key={name} variant="secondary" className="text-[10px] py-0 h-5 px-1.5 gap-1 font-bold bg-slate-100 text-slate-700">
                        {name} <X className="h-3 w-3 cursor-pointer" onClick={() => removeStaff('otherStaff', name)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-4 px-6">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Primary Site Name</Label>
              <div className="relative">
                <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-emerald-500" />
                <Input value={formData.nameOfSite} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-10 pl-9 border-emerald-200 bg-emerald-50/30 font-black uppercase text-emerald-700" placeholder="ENTER PRIMARY SITE" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Driver Name</Label>
              <Select onValueChange={(v) => updateField('driver', v)} value={formData.driver}>
                <SelectTrigger className="h-10 bg-slate-50/50 text-black border-slate-200"><SelectValue placeholder="Select Driver" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {drivers.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">Name of Contractor</Label>
              <Input value={formData.contractorName} onChange={(e) => updateField('contractorName', e.target.value)} className="h-10 border-slate-200 bg-white font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400">File Reference</Label>
              <Input value={formData.fileNo} onChange={(e) => updateField('fileNo', e.target.value)} className="h-10 bg-slate-50/50 border-slate-200" placeholder="MPM/GWD/..." />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">POST-CONSTRUCTION FIELD MEASUREMENT</h2>
            <Separator orientation="vertical" className="h-6 bg-slate-200" />
            <Badge variant="outline" className="h-6 px-3 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">{formData.sites.length} ENTRIES</Badge>
          </div>
          
          <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 px-8 rounded-2xl bg-[#1e3a8a] hover:bg-blue-900 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95">
                    <PlusCircle className="size-4" /> ADD MEASUREMENT LOG
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Technical Measurement Log</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Specify site location and nature of work for final billing.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Name of Site</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                            <Input value={newSite.siteName} onChange={(e) => setNewSite({...newSite, siteName: e.target.value.toUpperCase()})} placeholder="e.g. GHSS PULLIKKAL" className="h-12 pl-10 border-slate-200 rounded-xl font-bold uppercase" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Name of Work</Label>
                        <Select onValueChange={(v) => setNewSite({...newSite, workName: v})} value={newSite.workName}>
                            <SelectTrigger className="h-12 border-slate-200 rounded-xl font-bold uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">{workOptions.map(opt => <SelectItem key={opt} value={opt} className="font-bold text-xs uppercase">{opt}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Field Measurement / Remarks</Label>
                        <Textarea value={newSite.remarks} onChange={(e) => setNewSite({...newSite, remarks: e.target.value})} placeholder="Actual field measurements or site specific conditions..." className="rounded-xl border-slate-200 min-h-[100px]" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSiteDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
                    <Button onClick={handleAddSite} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">SAVE LOG ENTRY</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/80 border-b">
                        <TableRow className="h-12">
                            <TableHead className="w-16 text-center font-black text-[9px] uppercase">SL</TableHead>
                            <TableHead className="w-[300px] font-black text-[9px] uppercase">SITE LOCATION</TableHead>
                            <TableHead className="w-[240px] font-black text-[9px] uppercase">NATURE OF WORK</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">FIELD MEASUREMENTS</TableHead>
                            <TableHead className="w-20 text-right pr-10 font-black text-[9px] uppercase">REMOVE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formData.sites.length > 0 ? formData.sites.map((site, idx) => (
                            <TableRow key={idx} className="h-16 hover:bg-slate-50/50 transition-colors border-slate-100/50">
                                <TableCell className="text-center font-black text-slate-300 text-[11px]">{idx + 1}</TableCell>
                                <TableCell className="font-black text-xs uppercase text-slate-800">{site.siteName}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase tracking-tighter px-3 h-6 rounded-full">{site.workName}</Badge>
                                </TableCell>
                                <TableCell className="text-[11px] font-medium text-slate-500 italic max-w-[400px] truncate">{site.remarks || 'No measurements recorded'}</TableCell>
                                <TableCell className="text-right pr-10">
                                    <Button variant="ghost" size="icon" onClick={() => removeSite(idx)} className="size-8 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="size-4" /></Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-slate-300">
                                    <Ruler className="size-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No measurement logs added yet. Use the button above to start.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-4 px-8">
          <CardTitle className="text-[10px] font-black uppercase text-slate-500">FIELD OBSERVATIONS & REMARKS</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <Textarea 
            value={formData.remarks} 
            onChange={(e) => updateField('remarks', e.target.value)} 
            className="min-h-[120px] font-medium text-black border-slate-200 bg-white" 
            placeholder="Record site-specific observations during measurement..." 
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isPending} className="h-16 px-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200 gap-2 transition-all hover:scale-[1.02] active:scale-95">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
          FINALIZE MEASUREMENT RECORD
        </Button>
      </div>
    </div>
  );
}

