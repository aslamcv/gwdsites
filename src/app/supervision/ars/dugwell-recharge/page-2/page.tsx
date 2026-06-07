'use client';

import { Suspense, useState, useTransition, useEffect, useMemo } from 'react';
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
  PlusCircle,
  Construction,
  ShieldCheck,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface SiteData {
  siteDetails: string;
  lsgd: string;
  earthwork: { n: string; l: string; b: string; h: string; qty: string };
  masonry: { n: string; l: string; b: string; h: string; qty: string };
  rcc: { n: string; l: string; b: string; h: string; qty: string };
  steel: string;
  plastering: string;
  whiteWashing: string;
  pvc160mm: string;
  pvc110mm: string;
  pvc90mm: string;
  ballValve110mm: string;
  elbows: string;
  tees: string;
  bends: string;
  isComplete: boolean;
}

const createEmptySite = (): SiteData => ({
  siteDetails: '',
  lsgd: '',
  earthwork: { n: '1', l: '', b: '', h: '', qty: '0.000' },
  masonry: { n: '1', l: '', b: '', h: '', qty: '0.000' },
  rcc: { n: '1', l: '', b: '', h: '', qty: '0.000' },
  steel: '',
  plastering: '',
  whiteWashing: '',
  pvc160mm: '',
  pvc110mm: '',
  pvc90mm: '',
  ballValve110mm: '',
  elbows: '',
  tees: '',
  bends: '',
  isComplete: false,
});

function ARSDugwellMultiSiteContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const { lsgs } = useLsgdData();

  const staffContext = {
    aee: searchParams.get('assistantExecutiveEngineer') || '',
    ae: searchParams.get('assistantEngineer') || '',
    supervisor: searchParams.get('supervisor') || '',
    slr: searchParams.get('slr') || '',
    clr: searchParams.get('clr') || '',
  };

  const [sites, setSites] = useState<SiteData[]>([createEmptySite()]);
  const [activeTab, setActiveTab] = useState('site-0');

  const addSite = () => {
    if (sites.length < 6) {
      setSites(prev => [...prev, createEmptySite()]);
      setActiveTab(`site-${sites.length}`);
    } else {
      toast({ title: "Limit Reached", description: "Maximum of 6 sites allowed.", variant: "destructive" });
    }
  };

  const updateSiteField = (index: number, field: keyof SiteData | string, value: any) => {
    setSites(prev => {
      const newSites = [...prev];
      if (typeof field === 'string' && field.includes('.')) {
        const [parent, child] = field.split('.');
        (newSites[index] as any)[parent][child] = value;
        
        const p = (newSites[index] as any)[parent];
        const n = parseFloat(p.n) || 1;
        const l = parseFloat(p.l) || 0;
        const b = parseFloat(p.b) || 0;
        const h = parseFloat(p.h) || 0;
        if (l > 0) p.qty = (n * l * (b || 1) * (h || 1)).toFixed(3);

      } else {
        (newSites[index] as any)[field] = value;
      }

      const s = newSites[index];
      newSites[index].isComplete = !!(s.siteDetails && s.lsgd && s.earthwork.l && s.pvc110mm);
      
      return newSites;
    });
  };

  const handleFinalize = () => {
    if (!user || !firestore) return;
    startTransition(() => {
      const docRef = doc(collection(firestore, 'groundwaterReports'));
      
      const reportData = {
        id: docRef.id,
        category: "ESTIMATE_MEASUREMENT",
        reportType: "MEASUREMENT",
        status: "Published",
        purpose: "ARS Dugwell Supervision (Multi-Site)",
        applicantName: `ARS Dugwell Group (${sites.length} Sites)`,
        reportDate: new Date().toISOString().split('T')[0],
        sites: sites,
        staffAssignment: staffContext,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDoc(docRef, reportData).then(() => {
        toast({ title: "Session Finalized", description: `${sites.length} site records synchronized.` });
        router.push('/supervision');
      }).catch(error => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: reportData }));
      });
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[#F1F5F9] min-h-screen pb-32 text-left">
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm text-left">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border">
              <Link href="/supervision"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">ARS DUG WELL RECHARGE</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Site Technical Controller</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={addSite} disabled={sites.length >= 6}>
              <PlusCircle className="mr-2 size-4"/> Add Site
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          {sites.map((site, i) => (
            <TabsTrigger key={i} value={`site-${i}`} className="gap-2">
              Site {i + 1}
              {site.isComplete ? <CheckCircle2 className="size-3 text-emerald-500" /> : <div className="size-1.5 rounded-full bg-red-400" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {sites.map((site, i) => (
          <TabsContent key={i} value={`site-${i}`} className="mt-0">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Site {i + 1}: Identity and Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name & Details of Site</Label>
                    <Textarea value={site.siteDetails} onChange={(e) => updateSiteField(i, 'siteDetails', e.target.value)} placeholder="e.g., GHSS Pang, Kuruva GP"/>
                  </div>
                  <div className="space-y-2">
                    <Label>LSGD</Label>
                    <Select onValueChange={(v) => updateSiteField(i, 'lsgd', v)} value={site.lsgd}>
                      <SelectTrigger><SelectValue placeholder="Select LSGD" /></SelectTrigger>
                      <SelectContent>
                        {lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <h3 className="font-bold border-t pt-4">Technical Measurement Grid (LxBxH)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead className="w-20">L (m)</TableHead>
                      <TableHead className="w-20">B (m)</TableHead>
                      <TableHead className="w-20">H (m)</TableHead>
                      <TableHead className="w-24 text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {[
                    { id: 'earthwork', label: 'Earthwork Excavation' },
                    { id: 'masonry', label: 'Laterite Masonry' },
                    { id: 'rcc', label: 'RCC 1:2:4 Slab' },
                  ].map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell><Input value={(site as any)[item.id].n} onChange={(e) => updateSiteField(i, `${item.id}.n`, e.target.value)}/></TableCell>
                      <TableCell><Input value={(site as any)[item.id].l} onChange={(e) => updateSiteField(i, `${item.id}.l`, e.target.value)}/></TableCell>
                      <TableCell><Input value={(site as any)[item.id].b} onChange={(e) => updateSiteField(i, `${item.id}.b`, e.target.value)}/></TableCell>
                      <TableCell><Input value={(site as any)[item.id].h} onChange={(e) => updateSiteField(i, `${item.id}.h`, e.target.value)}/></TableCell>
                      <TableCell className="text-right font-bold">{(site as any)[item.id].qty}</TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
                <h3 className="font-bold border-t pt-4">Finishing & Plumbing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Steel (Kg)</Label><Input value={site.steel} onChange={e => updateSiteField(i, 'steel', e.target.value)}/></div>
                  <div className="space-y-2"><Label>Plastering (m²)</Label><Input value={site.plastering} onChange={e => updateSiteField(i, 'plastering', e.target.value)}/></div>
                  <div className="space-y-2"><Label>160mm Gutter (m)</Label><Input value={site.pvc160mm} onChange={e => updateSiteField(i, 'pvc160mm', e.target.value)}/></div>
                  <div className="space-y-2"><Label>110mm Pipe (m)</Label><Input value={site.pvc110mm} onChange={e => updateSiteField(i, 'pvc110mm', e.target.value)}/></div>
                  <div className="space-y-2"><Label>90mm Pipe (m)</Label><Input value={site.pvc90mm} onChange={e => updateSiteField(i, 'pvc90mm', e.target.value)}/></div>
                  <div className="space-y-2"><Label>110mm Valve</Label><Input value={site.ballValve110mm} onChange={e => updateSiteField(i, 'ballValve110mm', e.target.value)}/></div>
                  <div className="space-y-2"><Label>Elbows</Label><Input value={site.elbows} onChange={e => updateSiteField(i, 'elbows', e.target.value)}/></div>
                  <div className="space-y-2"><Label>Tees</Label><Input value={site.tees} onChange={e => updateSiteField(i, 'tees', e.target.value)}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end pt-8">
        <Button onClick={handleFinalize} disabled={isPending || sites.some(s => !s.isComplete)} className="h-12 px-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl">
          {isPending ? <Loader2 className="mr-2 animate-spin size-4"/> : <ShieldCheck className="mr-2 size-4"/>}
          Finalize & Save Technical Node
        </Button>
      </div>
    </div>
  );
}

export default function ARSDugwellMultiSitePage() {
  return (
    <Suspense>
      <ARSDugwellMultiSiteContent />
    </Suspense>
  );
}
