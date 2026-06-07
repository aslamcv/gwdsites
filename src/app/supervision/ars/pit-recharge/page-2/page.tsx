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
  Construction,
  Layers,
  Activity,
  ShieldCheck,
  Ruler,
  PlusCircle,
  Wind,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteData {
  siteDetails: string;
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

function ARSPitMultiSiteContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const id = searchParams.get('id');
  
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
      toast({ title: "Limit Reached", description: "Maximum of 6 sites allowed per session.", variant: "destructive" });
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
      newSites[index].isComplete = !!(s.siteDetails && s.earthwork.l && s.pvc110mm);
      
      return newSites;
    });
  };

  const handleFinalize = () => {
    if (!user || !firestore) return;
    startTransition(() => {
      const docRef = doc(collection(firestore, 'groundwaterReports'));
      
      const allWorks: any[] = [];
      sites.forEach((site, i) => {
        if (site.siteDetails) {
          allWorks.push({
            description: `SITE ${i+1}: ${site.siteDetails} (Excavation: ${site.earthwork.qty}m³, Masonry: ${site.masonry.qty}m³)`,
            qty: 1,
            unit: 'Job',
            rate: 0,
            amount: 0
          });
        }
      });

      const reportData = {
        id: docRef.id,
        category: "ESTIMATE_MEASUREMENT",
        reportType: "MEASUREMENT",
        status: "Published",
        purpose: "ARS Pit Supervision (Multi-Site)",
        applicantName: `ARS Group Session (${sites.length} Sites)`,
        reportDate: new Date().toISOString().split('T')[0],
        sites: sites,
        staffAssignment: staffContext,
        works: allWorks,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      setDoc(docRef, reportData).then(() => {
        toast({ title: 'Session Finalized', description: `${sites.length} site records synchronized.` });
        router.push('/supervision');
      }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: reportData }));
      });
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[#F1F5F9] min-h-screen font-sans pb-32 text-left">
      
      <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm ring-1 ring-slate-200/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border">
              <Link href="/supervision"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Construction className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-[26px] font-black text-slate-900 uppercase tracking-tighter leading-none">ARS PIT RECHARGE</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">TECHNICAL PHASE 2: MULTI-SITE CONTROLLER</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={addSite} disabled={sites.length >= 6} variant="outline" className="h-10 rounded-xl border-dashed border-slate-300 font-black uppercase text-[10px] tracking-widest gap-2">
              <PlusCircle className="size-4" /> ADD SITE
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="bg-white/50 p-1 rounded-2xl h-14 border border-slate-200 w-full flex justify-start overflow-x-auto overflow-y-hidden scrollbar-hide">
          {sites.map((site, i) => (
            <TabsTrigger 
              key={i} 
              value={`site-${i}`}
              className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase text-[10px] tracking-widest gap-2 flex items-center"
            >
              SITE {i + 1}
              {site.isComplete ? <CheckCircle2 className="size-3 text-emerald-500" /> : <div className="size-1.5 rounded-full bg-red-400 animate-pulse" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {sites.map((site, i) => (
          <TabsContent key={i} value={`site-${i}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
            <Card className="rounded-[32px] border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-5 px-8">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">SITE IDENTITY & MEASUREMENTS</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Name & Details of Site</Label>
                    <Textarea 
                        value={site.siteDetails} 
                        onChange={(e) => updateSiteField(i, 'siteDetails', e.target.value)}
                        placeholder="e.g. GHSS PANG, KURUVA GP, WARD 12"
                        className="min-h-[100px] rounded-2xl border-slate-200 font-bold uppercase text-xs"
                    />
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                    <TableRow className="h-12">
                        <TableHead className="w-12 text-center text-[9px] font-black uppercase">SL</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">TECHNICAL ITEM</TableHead>
                        <TableHead className="w-16 text-center text-[9px] font-black uppercase">NO</TableHead>
                        <TableHead className="w-16 text-center text-[9px] font-black uppercase">L (m)</TableHead>
                        <TableHead className="w-16 text-center text-[9px] font-black uppercase">B (m)</TableHead>
                        <TableHead className="w-16 text-center text-[9px] font-black uppercase">H (m)</TableHead>
                        <TableHead className="w-24 text-right text-[9px] font-black pr-8 uppercase">QTY</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {[
                        { id: 'earthwork', label: 'EARTHWORK EXCAVATION' },
                        { id: 'masonry', label: 'LATERITE MASONRY' },
                        { id: 'rcc', label: 'RCC SLAB' },
                    ].map((item, idx) => (
                        <TableRow key={item.id} className="h-14">
                        <TableCell className="text-center font-bold text-slate-300 text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-bold text-[10px] text-slate-700 uppercase">{item.label}</TableCell>
                        <TableCell className="p-1"><Input value={(site as any)[item.id].n} onChange={(e) => updateSiteField(i, `${item.id}.n`, e.target.value)} className="h-9 text-center" /></TableCell>
                        <TableCell className="p-1"><Input value={(site as any)[item.id].l} onChange={(e) => updateSiteField(i, `${item.id}.l`, e.target.value)} className="h-9 text-center" /></TableCell>
                        <TableCell className="p-1"><Input value={(site as any)[item.id].b} onChange={(e) => updateSiteField(i, `${item.id}.b`, e.target.value)} className="h-9 text-center" /></TableCell>
                        <TableCell className="p-1"><Input value={(site as any)[item.id].h} onChange={(e) => updateSiteField(i, `${item.id}.h`, e.target.value)} className="h-9 text-center" /></TableCell>
                        <TableCell className="text-right pr-8 font-black text-blue-600 text-xs">{(site as any)[item.id].qty}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end pt-8">
        <Button onClick={handleFinalize} disabled={isPending || sites.some(s => !s.isComplete)} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl gap-3 hover:bg-blue-900 transition-all">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />} 
          FINALIZE MULTI-SITE SESSION
        </Button>
      </div>
    </div>
  );
}

export default function ARSPitMultiSitePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold text-primary animate-pulse uppercase tracking-[0.3em]">Initializing Technical Node...</div>}>
      <ARSPitMultiSiteContent />
    </Suspense>
  );
}
