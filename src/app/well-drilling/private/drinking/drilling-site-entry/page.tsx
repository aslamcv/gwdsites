'use client';

import { useState, useTransition, useEffect, useMemo, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  ClipboardList, 
  Activity,
  Loader2,
  MapPin,
  Lock,
  ReceiptIndianRupee
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

function DrillingSiteEntryContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lsgs, lsgMappings } = useLsgdData();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  
  const id = searchParams.get('id');
  const startDateFromParam = searchParams.get('startDate') || '';
  const endDateFromParam = searchParams.get('endDate') || '';

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport } = useDoc<GroundwaterReport>(reportRef);

  const [formData, setFormData] = useState({
    borewellSize: '150mm (6\")',
    fileNo: '',
    nameOfSite: '',
    address: '',
    lsgd: '',
    wellNumber: '',
    remittance: '',
    totalDepth: '',
    overburden: '',
    pvc6kg: '',
    pvc10kg: '',
    discharge: '',
    zoneDepth: '',
    waterLevel: '',
    remarks: 'Medium yield',
    observations: '',
    hasEndCap: true
  });

  const [dateInfo, setDateInfo] = useState({
    start: startDateFromParam,
    end: endDateFromParam
  });

  useEffect(() => {
    if (cloudReport) {
      setFormData({
        borewellSize: cloudReport.borewellSize || '150mm (6\")',
        fileNo: cloudReport.fileNo || '',
        nameOfSite: cloudReport.nameOfSite || cloudReport.applicantName || '',
        address: cloudReport.address || '',
        lsgd: cloudReport.lsgd || '',
        wellNumber: cloudReport.wellNumber || '',
        remittance: cloudReport.remittance || '',
        totalDepth: cloudReport.totalDepth || '',
        overburden: cloudReport.overburden || '',
        pvc6kg: cloudReport.pvc6kg || '',
        pvc10kg: cloudReport.pvc10kg || '',
        discharge: cloudReport.discharge || '',
        zoneDepth: cloudReport.zoneDepth || '',
        waterLevel: cloudReport.waterLevel || '',
        remarks: cloudReport.remarks || 'Medium yield',
        observations: cloudReport.observations || '',
        hasEndCap: cloudReport.hasEndCap !== undefined ? cloudReport.hasEndCap : true
      });
      if (cloudReport.dateOfInvestigation) {
        const parts = cloudReport.dateOfInvestigation.split(' - ');
        setDateInfo({
          start: parts[0] || '',
          end: parts[1] || ''
        });
      }
    }
  }, [cloudReport]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const selectedMapping = lsgMappings.find(m => m.lsg === formData.lsgd);
  const detectedLac = selectedMapping?.constituency || '';

  const handleSave = () => {
    if (!user || !firestore || !isAllowed) return;

    startTransition(() => {
      const isUpdate = !!id;
      const reportDocRef = isUpdate 
        ? doc(firestore, 'groundwaterReports', id) 
        : doc(collection(firestore, 'groundwaterReports'));
      
      const reportId = reportDocRef.id;

      const reportData = {
        ...formData,
        id: reportId,
        reportDate: new Date().toISOString().split('T')[0],
        applicantName: formData.nameOfSite,
        status: 'Published' as const,
        purpose: "Well Drilling / Private / Drinking",
        category: "Well Drilling",
        workType: "DRILLING",
        uploadedBy: user.uid,
        createdAt: cloudReport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateOfInvestigation: `${dateInfo.start}${dateInfo.end ? ' - ' + dateInfo.end : ''}`,
        assembly: detectedLac
      };

      const operation = isUpdate ? updateDoc(reportDocRef, reportData) : setDoc(reportDocRef, reportData);

      operation
        .then(() => {
          toast({ 
            title: isUpdate ? 'Record Updated' : 'Record Saved', 
            description: 'Technical parameters recorded successfully.' 
          });
          router.push('/well-drilling');
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: reportDocRef.path,
            operation: isUpdate ? 'update' : 'create',
            requestResourceData: reportData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-32 font-sans text-black">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/well-drilling">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <PageHeader title={id ? "Edit Drilling Technical Entry" : "Page 2 - Recent Drinking Well Drilling"} />
          </div>
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-tight">Technical Data Record</p>
            <p className="text-sm font-bold">Period: {dateInfo.start} {dateInfo.end ? ` to ${dateInfo.end}` : ''}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white border-primary/20 text-primary uppercase font-bold text-[9px] h-7 px-4">MALAPPURAM TECHNICAL NODE</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Bore well Size</Label>
          <Select disabled={!isAllowed} onValueChange={(val) => updateField('borewellSize', val)} value={formData.borewellSize}>
            <SelectTrigger className="h-12 bg-white border-primary/10 shadow-sm"><SelectValue placeholder="Select size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="110mm">110mm (4.5")</SelectItem>
              <SelectItem value="150mm">150mm (6")</SelectItem>
              <SelectItem value="200mm">200mm (8")</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">File no.</Label>
          <Input 
            disabled={!isAllowed}
            value={formData.fileNo} 
            onChange={(e) => updateField('fileNo', e.target.value)}
            placeholder="MPM/GWD/..." 
            className="h-12 bg-white border-primary/10 shadow-sm font-bold text-primary" 
          />
        </div>
        <div className="space-y-2 lg:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Well Number</Label>
          <Input 
            disabled={!isAllowed} 
            value={formData.wellNumber} 
            onChange={(e) => updateField('wellNumber', e.target.value)} 
            className="h-12 border-primary/10 font-black text-primary focus:bg-white" 
            placeholder="ENTER WELL NUMBER" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Name of Site</Label>
          <Input 
            disabled={!isAllowed}
            value={formData.nameOfSite} 
            onChange={(e) => updateField('nameOfSite', e.target.value)}
            placeholder="Site Location" 
            className="h-12 bg-white border-primary/10 shadow-sm uppercase font-bold" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2 lg:col-span-1">
          <Label className="text-[10px] font-black uppercase text-primary/60">Address</Label>
          <Input 
            disabled={!isAllowed}
            value={formData.address} 
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Street, Village" 
            className="h-12 bg-white border-primary/10 shadow-sm" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">LSGD</Label>
          <Select disabled={!isAllowed} onValueChange={(val) => updateField('lsgd', val)} value={formData.lsgd}>
            <SelectTrigger className="h-12 bg-white border-primary/10 shadow-sm">
              <SelectValue placeholder={lsgs.length > 0 ? "Select LSGD" : "Import in Settings"} />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {lsgs.map(lsg => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">LAC (Constituency)</Label>
          <div className="h-12 px-3 flex items-center bg-secondary/30 rounded-md border border-primary/5 text-sm font-bold text-primary">
            {formData.lsgd ? (detectedLac || "No LAC matched") : "Auto-detected"}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Remittance (₹)</Label>
          <Input 
            disabled={!isAllowed}
            type="number" 
            value={formData.remittance}
            onChange={(e) => updateField('remittance', e.target.value)}
            className="h-12 bg-white border-primary/10 shadow-sm font-bold text-emerald-600" 
          />
        </div>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden rounded-[24px]">
        <CardHeader className="bg-primary/5 border-b py-4">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sub-Surface Technical data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Total Depth (m)</Label>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.totalDepth}
              onChange={(e) => updateField('totalDepth', e.target.value)}
              placeholder="0.00" 
              className="h-11 font-bold" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">OVERBURDEN (m)</Label>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.overburden}
              onChange={(e) => updateField('overburden', e.target.value)}
              placeholder="0.00" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">PVC 140mm 6kg/cm² (m)</Label>
            <Input 
              disabled={!isAllowed}
              value={formData.pvc6kg}
              onChange={(e) => updateField('pvc6kg', e.target.value)}
              placeholder="Qty" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">PVC 140mm 10kg/cm² (m)</Label>
            <Input 
              disabled={!isAllowed}
              value={formData.pvc10kg}
              onChange={(e) => updateField('pvc10kg', e.target.value)}
              placeholder="Qty" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Estimated Yield (LPH)</Label>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.discharge}
              onChange={(e) => updateField('discharge', e.target.value)}
              placeholder="e.g. 5000" 
              className="h-11 font-bold text-blue-600" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Zone Depth (m)</Label>
            <Input 
              disabled={!isAllowed}
              value={formData.zoneDepth}
              onChange={(e) => updateField('zoneDepth', e.target.value)}
              placeholder="e.g. 60-90" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Static Water Level (mbgl)</Label>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.waterLevel}
              onChange={(e) => updateField('waterLevel', e.target.value)}
              placeholder="0.00" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Yield Assessment</Label>
            <Select disabled={!isAllowed} onValueChange={(val) => updateField('remarks', val)} value={formData.remarks}>
              <SelectTrigger className="h-11 font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low yield">Low yield</SelectItem>
                <SelectItem value="Medium yield">Medium yield</SelectItem>
                <SelectItem value="High yield">High yield</SelectItem>
                <SelectItem value="Dry well">Dry well</SelectItem>
                <SelectItem value="Collapsed well">Collapsed well</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="hasEndCap" 
                checked={formData.hasEndCap} 
                onCheckedChange={(checked) => updateField('hasEndCap', checked)}
                disabled={!isAllowed}
              />
              <Label htmlFor="hasEndCap" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">End Cap Used</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
          <ClipboardList className="h-3 w-3" />
          Technical Observations & Strata
        </Label>
        <Textarea 
          disabled={!isAllowed}
          value={formData.observations}
          onChange={(e) => updateField('observations', e.target.value)}
          placeholder="Record details of lithology, water strike depth, and any site constraints..." 
          className="min-h-[140px] rounded-2xl p-6 italic font-medium leading-relaxed"
        />
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-4">
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] border border-slate-200 shadow-2xl flex items-center justify-between gap-6 ring-1 ring-black/5">
          <div className="flex items-center gap-2 pl-4">
            <Button asChild variant="outline" disabled={!id} className="h-14 gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-blue-900/20">
              <Link href={id ? `/well-drilling/private/drinking/completion-report?id=${id}` : '#'}>
                <FileText className="h-4 w-4" /> BWC COMPLETION REPORT
              </Link>
            </Button>
            <Button asChild variant="outline" disabled={!id} className="h-14 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 border-none font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-emerald-900/20">
              <Link href={id ? `/well-drilling/private/drinking/final-bill?id=${id}` : '#'}>
                <ReceiptIndianRupee className="h-4 w-4" /> FINAL BILL
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 pr-2">
            <Button onClick={handleSave} disabled={isPending || !isAllowed} className="h-16 px-16 rounded-[24px] bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95">
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {id ? 'UPDATE RECORD' : 'SAVE TECHNICAL RECORD'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DrillingTechnicalSiteEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse font-black opacity-30 text-slate-400">Initializing Workspace...</div>}>
            <DrillingSiteEntryContent />
        </Suspense>
    )
}
