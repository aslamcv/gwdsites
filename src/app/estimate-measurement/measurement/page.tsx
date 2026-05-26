'use client';

import { useState, useTransition, useMemo, useEffect, Suspense } from 'react';
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
  X,
  Mountain,
  PlusCircle,
  Trash2,
  ClipboardList,
  MapPin,
  Ruler,
  Pencil,
  Settings,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
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
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Employee, GroundwaterReport } from '@/lib/types';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

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

function MeasurementEntryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingSiteIndex, setEditingSiteIndex] = useState<number | null>(null);
  const [newSite, setNewSite] = useState({ siteName: '', workName: 'Borewell Construction', remarks: '' });

  // 1. Authorization Logic
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading]);

  // 2. Data Fetching
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport, isLoading: isReportLoading } = useDoc<GroundwaterReport>(reportRef);

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

  useEffect(() => {
    if (cloudReport) {
      const sa = cloudReport.staffAssignment || {};
      setFormData({
        fileNo: cloudReport.fileNo || '',
        nameOfSite: cloudReport.nameOfSite || '',
        reportDate: cloudReport.reportDate || '',
        conveyance: cloudReport.conveyance || '',
        contractorName: cloudReport.nameOfContractor || '',
        ae: sa.assistantEngineer as string || '',
        aee: sa.assistantExecutiveEngineer as string || '',
        otherStaff: Array.isArray(sa.otherStaff) ? sa.otherStaff : (sa.otherStaff ? (sa.otherStaff as string).split(', ') : []),
        slr: Array.isArray(sa.slr) ? sa.slr : (sa.slr ? (sa.slr as string).split(', ') : []),
        clr: Array.isArray(sa.clr) ? sa.clr : (sa.clr ? (sa.clr as string).split(', ') : []),
        driver: sa.drivers as string || '',
        remarks: cloudReport.remarks || '',
        sites: cloudReport.sites || []
      });
    }
  }, [cloudReport]);

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
    if (!isAllowed) return;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addStaff = (key: string, name: string) => {
    if (!isAllowed || name === "none" || !name) return;
    setFormData(prev => {
      const current = (prev as any)[key] as string[];
      if (!current.includes(name)) {
        return { ...prev, [key]: [...current, name] };
      }
      return prev;
    });
  };

  const removeStaff = (key: string, name: string) => {
    if (!isAllowed) return;
    setFormData(prev => ({
      ...prev,
      [key]: (prev as any)[key].filter((n: string) => n !== name)
    }));
  };

  const handleAddSite = () => {
    if (!isAllowed) return;
    if (!newSite.siteName) {
      toast({ title: "Name of Site Required", variant: "destructive" });
      return;
    }

    if (editingSiteIndex !== null) {
      const updatedSites = [...formData.sites];
      updatedSites[editingSiteIndex] = { ...newSite };
      setFormData(prev => ({ ...prev, sites: updatedSites }));
      setEditingSiteIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        sites: [...prev.sites, { ...newSite }]
      }));
    }

    setNewSite({ siteName: '', workName: 'Borewell Construction', remarks: '' });
    setIsSiteDialogOpen(false);
  };

  const handleEditSite = (index: number) => {
    if (!isAllowed) return;
    setEditingSiteIndex(index);
    setNewSite({ ...formData.sites[index] });
    setIsSiteDialogOpen(true);
  };

  const removeSite = (index: number) => {
    if (!isAllowed) return;
    setFormData(prev => ({
      ...prev,
      sites: prev.sites.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!user || !firestore || !isAllowed) return;
    startTransition(() => {
      const isUpdate = !!id;
      const docRef = isUpdate ? doc(firestore, 'groundwaterReports', id) : doc(collection(firestore, 'groundwaterReports'));
      const reportId = docRef.id;

      const reportData = {
        ...formData,
        id: reportId,
        category: "ESTIMATE_MEASUREMENT",
        reportType: "MEASUREMENT",
        status: "Published",
        purpose: "Measurement Portal Entry",
        uploadedBy: user.uid,
        createdAt: cloudReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nameOfContractor: formData.contractorName,
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

      const operation = isUpdate ? updateDocumentNonBlocking(docRef, reportData) : setDocumentNonBlocking(docRef, reportData, { merge: true });
      
      toast({ title: isUpdate ? 'Measurement Updated' : 'Measurement Saved', description: 'Technical field data synchronized.' });
      router.push('/estimate-measurement');
    });
  };

  if (isReportLoading && id) {
    return <div className="p-12 text-center animate-pulse uppercase tracking-widest font-black opacity-30 text-slate-400">Loading Technical File...</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen pb-32 text-black text-left">
      
      {/* Header Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
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
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Measurement Date</Label>
                <Input disabled={!isAllowed} type="date" value={formData.reportDate} onChange={(e) => updateField('reportDate', e.target.value)} className="h-10 w-44 rounded-xl font-bold bg-white text-black border-slate-200" />
            </div>
            <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Conveyance Mode</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => updateField('conveyance', v)} value={formData.conveyance}>
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

      {/* Field Technical Team */}
      <Card className="rounded-[40px] border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
        <CardHeader className="bg-emerald-50/50 border-b py-5 px-10">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
            <Users className="size-4" /> Field Technical Team & Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Site Name</Label>
              <div className="relative">
                <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
                <Input disabled={!isAllowed} value={formData.nameOfSite} onChange={(e) => updateField('nameOfSite', e.target.value)} className="h-12 pl-10 border-emerald-200 bg-emerald-50/10 font-black uppercase text-emerald-700" placeholder="ENTER PRIMARY SITE" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Driver Name</Label>
              <Select disabled={!isAllowed} onValueChange={(v) => updateField('driver', v)} value={formData.driver}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Select Driver" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-black">
                  {drivers.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File Reference</Label>
              <Input disabled={!isAllowed} value={formData.fileNo} onChange={(e) => updateField('fileNo', e.target.value)} className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold" placeholder="MPM/GWD/..." />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contractor Name</Label>
              <Input disabled={!isAllowed} value={formData.contractorName} onChange={(e) => updateField('contractorName', e.target.value)} className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold" placeholder="CONTRACTOR DETAILS" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Other Staff Deployed</Label>
              <div className="space-y-3">
                <Select disabled={!isAllowed} onValueChange={(v) => addStaff('otherStaff', v)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Add Technical Staff" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-black">
                    {otherStaffOptions.map(e => <SelectItem key={e.id} value={e.name}>{e.name} ({e.designation})</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1.5">
                  {formData.otherStaff.map(name => (
                    <Badge key={name} variant="secondary" className="text-[9px] font-black py-0 h-6 px-2 gap-2 bg-slate-100 text-slate-600 rounded-lg">
                        {name} {isAllowed && <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStaff('otherStaff', name)} />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">SLR Deployment</Label>
              <div className="space-y-3">
                <Select disabled={!isAllowed} onValueChange={(v) => addStaff('slr', v)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Add SLR" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-black">
                    {slrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.slr.includes(e.name)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1.5">
                  {formData.slr.map(name => (
                    <Badge key={name} variant="secondary" className="text-[9px] font-black py-0 h-6 px-2 gap-2 bg-blue-50 text-blue-700 border-blue-100 rounded-lg">
                      {name} {isAllowed && <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStaff('slr', name)} />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CLR Deployment</Label>
              <div className="space-y-3">
                <Select disabled={!isAllowed} onValueChange={(v) => addStaff('clr', v)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Add CLR" /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-black">
                    {clrs.map(e => <SelectItem key={e.id} value={e.name} disabled={formData.clr.includes(e.name)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1.5">
                  {formData.clr.map(name => (
                    <Badge key={name} variant="secondary" className="text-[9px] font-black py-0 h-6 px-2 gap-2 bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg">
                      {name} {isAllowed && <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStaff('clr', name)} />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">POST-CONSTRUCTION FIELD MEASUREMENT</h2>
            <Separator orientation="vertical" className="h-6 bg-slate-200" />
            <Badge variant="outline" className="h-6 px-3 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">{formData.sites.length} ENTRIES</Badge>
          </div>
          
          <Button onClick={() => { setEditingSiteIndex(null); setNewSite({ siteName: '', workName: 'Borewell Construction', remarks: '' }); setIsSiteDialogOpen(true); }} disabled={!isAllowed} className="h-12 px-8 rounded-2xl bg-[#1e3a8a] hover:bg-blue-900 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95">
              <PlusCircle className="size-4" /> ADD MEASUREMENT LOG
          </Button>
        </div>

        <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 border-none shadow-2xl text-left">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">{editingSiteIndex !== null ? 'Edit Measurement Log' : 'Technical Measurement Log'}</DialogTitle>
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
                    <Button variant="ghost" onClick={() => { setIsSiteDialogOpen(false); setEditingSiteIndex(null); }} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
                    <Button onClick={handleAddSite} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">{editingSiteIndex !== null ? 'UPDATE LOG' : 'SAVE LOG ENTRY'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/80 border-b">
                        <TableRow className="h-12">
                            <TableHead className="w-16 text-center font-black text-[9px] uppercase">SL</TableHead>
                            <TableHead className="w-[300px] font-black text-[9px] uppercase">SITE LOCATION</TableHead>
                            <TableHead className="w-[240px] font-black text-[9px] uppercase">NATURE OF WORK</TableHead>
                            <TableHead className="font-black text-[9px] uppercase">FIELD MEASUREMENTS</TableHead>
                            <TableHead className="w-40 text-right pr-10 font-black text-[9px] uppercase">ACTIONS</TableHead>
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
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditSite(idx)} disabled={!isAllowed} className="size-8 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg"><Pencil className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => removeSite(idx)} disabled={!isAllowed} className="size-8 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="size-4" /></Button>
                                    </div>
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
      
      <div className="flex justify-between items-center bg-blue-50/30 p-8 rounded-[32px] border border-blue-100">
          <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm"><Settings className="size-5 text-blue-600 animate-spin-slow" /></div>
              <div>
                  <h4 className="font-black text-[11px] text-blue-900 uppercase tracking-widest leading-none mb-1">District Node Sync</h4>
                  <p className="text-[9px] font-bold text-blue-400 uppercase">Synchronizing technical field data with central district oversight.</p>
              </div>
          </div>
          <Button onClick={handleSave} disabled={isPending || !isAllowed} className="h-16 px-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200 gap-2 transition-all hover:scale-[1.02] active:scale-95">
            {!isAllowed && <Lock className="size-4" />}
            {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />} 
            {isAllowed ? (id ? 'UPDATE MEASUREMENT RECORD' : 'FINALIZE MEASUREMENT RECORD') : 'ACCESS RESTRICTED'}
          </Button>
      </div>
    </div>
  );
}

export default function MeasurementEntryPageWrapper() {
    return <Suspense fallback={<div className="p-12 text-center animate-pulse">Initializing Technical Node...</div>}><MeasurementEntryPage/></Suspense>;
}
