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
  Activity,
  Loader2,
  MapPin,
  Lock,
  ReceiptIndianRupee
} from 'lucide-react';
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
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport } = useDoc<GroundwaterReport>(reportRef);

  const [formData, setFormData] = useState({
    borewellSize: '',
    fileNo: '',
    nameOfSite: '',
    address: '',
    lsgd: '',
    remittance: '',
    totalDepth: '',
    overburden: '',
    pvc6kg: '',
    pvc10kg: '',
    discharge: '',
    zoneDepth: '',
    waterLevel: '',
    remarks: '',
    observations: ''
  });

  const [dateInfo, setDateInfo] = useState({
    start: startDateFromParam,
    end: endDateFromParam
  });

  useEffect(() => {
    if (cloudReport) {
      setFormData({
        borewellSize: cloudReport.borewellSize || '',
        fileNo: cloudReport.fileNo || '',
        nameOfSite: cloudReport.nameOfSite || cloudReport.applicantName || '',
        address: cloudReport.address || '',
        lsgd: cloudReport.lsgd || '',
        remittance: cloudReport.remittance || '',
        totalDepth: cloudReport.totalDepth || '',
        overburden: cloudReport.overburden || '',
        pvc6kg: cloudReport.pvc6kg || '',
        pvc10kg: cloudReport.pvc10kg || '',
        discharge: cloudReport.discharge || '',
        zoneDepth: cloudReport.zoneDepth || '',
        waterLevel: cloudReport.waterLevel || '',
        remarks: cloudReport.remarks || '',
        observations: cloudReport.observations || ''
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

  const updateField = (key: string, value: string) => {
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
            description: 'Technical parameters have been successfully recorded.' 
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
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-32">
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
        {!isAllowed && !isAuthLoading && !isProfileLoading && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black uppercase text-[10px]">
            <Lock className="size-3.5" /> READ ONLY ACCESS
          </Badge>
        )}
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-tight">Technical Record Summary</p>
            <p className="text-sm font-bold">Period: {dateInfo.start} {dateInfo.end ? ` to ${dateInfo.end}` : ''}</p>
          </div>
        </div>
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
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Name of Site</Label>
          <Input 
            disabled={!isAllowed}
            value={formData.nameOfSite} 
            onChange={(e) => updateField('nameOfSite', e.target.value)}
            placeholder="e.g. Civil Station" 
            className="h-12 bg-white border-primary/10 shadow-sm uppercase font-bold" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Address</Label>
          <Input 
            disabled={!isAllowed}
            value={formData.address} 
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Street, Village" 
            className="h-12 bg-white border-primary/10 shadow-sm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">LSGD</Label>
          <Select disabled={!isAllowed} onValueChange={(val) => updateField('lsgd', val)} value={formData.lsgd}>
            <SelectTrigger className="h-12 bg-white border-primary/10 shadow-sm">
              <SelectValue placeholder={lsgs.length > 0 ? "Select LSGD" : "Import from Settings"} />
            </SelectTrigger>
            <SelectContent>
              {lsgs.map(lsg => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">LAC (Constituency)</Label>
          <div className="h-12 px-3 flex items-center bg-secondary/30 rounded-md border border-primary/5 text-sm font-bold text-primary">
            {formData.lsgd ? (detectedLac || "No LAC mapped") : "Waiting for LSGD selection"}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Total Amount Remitted</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.remittance}
              onChange={(e) => updateField('remittance', e.target.value)}
              className="h-12 pl-8 bg-white border-primary/10 shadow-sm font-bold" 
            />
          </div>
        </div>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sub-Surface Technical data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              placeholder="Quantity" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">PVC 140mm 10kg/cm² (m)</Label>
            <Input 
              disabled={!isAllowed}
              value={formData.pvc10kg}
              onChange={(e) => updateField('pvc10kg', e.target.value)}
              placeholder="Quantity" 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Discharge (LPH)</Label>
            <Input 
              disabled={!isAllowed}
              type="number" 
              value={formData.discharge}
              onChange={(e) => updateField('discharge', e.target.value)}
              placeholder="e.g. 5000" 
              className="h-11 font-bold text-primary" 
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
            <Label className="text-[10px] font-black uppercase text-slate-500">Water Level (mbgl)</Label>
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
            <Label className="text-[10px] font-black uppercase text-slate-500">Remarks</Label>
            <Select disabled={!isAllowed} onValueChange={(val) => updateField('remarks', val)} value={formData.remarks}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low yield</SelectItem>
                <SelectItem value="medium">Medium yield</SelectItem>
                <SelectItem value="high">High yield</SelectItem>
                <SelectItem value="dry">Dry well</SelectItem>
                <SelectItem value="collapsed">Collapsed well</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
          <ClipboardList className="h-3 w-3" />
          Field Observations & Remarks
        </Label>
        <Textarea 
          disabled={!isAllowed}
          value={formData.observations}
          onChange={(e) => updateField('observations', e.target.value)}
          placeholder="Record detailed lithology, strata details, or site specific technical notes here..." 
          className="min-h-[120px] bg-white border-primary/10 shadow-sm leading-relaxed"
        />
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-4">
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 shadow-2xl flex items-center justify-between gap-6 ring-1 ring-black/5">
          <div className="flex items-center gap-2 pl-4">
            <Button asChild variant="outline" disabled={!id} className="h-12 gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-blue-900/20">
              <Link href={id ? `/well-drilling/private/drinking/completion-report?id=${id}` : '#'}>
                <FileText className="h-4 w-4" /> BWC COMPLETION REPORT
              </Link>
            </Button>
            <Button asChild variant="outline" disabled={!id} className="h-12 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 border-none font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-emerald-900/20">
              <Link href={id ? `/well-drilling/private/drinking/final-bill?id=${id}` : '#'}>
                <ReceiptIndianRupee className="h-4 w-4" /> FINAL BILL - DRILLING
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 pr-2">
            <Button onClick={handleSave} disabled={isPending || !isAllowed} className="h-14 px-12 rounded-2xl bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-900/20 gap-2">
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {id ? 'UPDATE TECHNICAL RECORD' : 'SAVE TECHNICAL RECORD'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DrillingTechnicalSiteEntryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center animate-pulse font-black opacity-30 text-slate-400">Initializing Technical Entry...</div>}>
            <DrillingSiteEntryContent />
        </Suspense>
    )
}
