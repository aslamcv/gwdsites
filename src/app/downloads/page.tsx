
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Edit3, 
  Trash2,
  Eye,
  RotateCcw,
  MapPin,
  FileText,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  FileCheck,
  MoreVertical,
  FileSearch,
  ReceiptIndianRupee,
  Activity,
  ArrowRight,
  Wind,
  Ruler,
  BarChart,
  Lock,
  ArrowLeft,
  Pickaxe
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  useDoc,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/estimate-measurement/report-dialog';
import { useToast } from '@/hooks/use-toast';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function GIRDownloadCenterPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { lsgs } = useLsgdData();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile } = useDoc(userProfileRef);
  
  const isAdmin = useMemo(() => {
    if (isUserLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.role === 'admin';
  }, [user, userProfile, isUserLoading]);

  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [fileNoSearch, setFileNoSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [lsgdFilter, setLsgdFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
  const [reportToDelete, setReportToDelete] = useState<GroundwaterReport | null>(null);
  const [viewingReport, setViewingReport] = useState<GroundwaterReport | null>(null);

  // EM Modal State
  const [selectedEmReport, setSelectedEmReport] = useState<GroundwaterReport | null>(null);
  const [isEmModalOpen, setIsEmModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(collection(firestore, 'groundwaterReports'), orderBy('createdAt', 'desc'));
  }, [firestore, user, isUserLoading]);
  const { data: reports, isLoading } = useCollection<GroundwaterReport>(reportsQuery);

  const getMainCategory = (report: GroundwaterReport) => {
    const purpose = report.purpose?.toLowerCase() || '';
    const cat = report.category?.toLowerCase() || '';
    
    if (purpose.includes('investigation') || cat.includes('survey')) return 'Investigation';
    if (purpose.includes('drilling') || report.workType === 'DRILLING' || cat.includes('drilling')) return 'Well Drilling';
    if (purpose.includes('flushing') || report.workType === 'FLUSHING' || cat.includes('flushing')) return 'Well Flushing';
    if (purpose.includes('pumping test')) return 'Pumping Test';
    if (purpose.includes('supervision')) return 'Supervision';
    if (cat.includes('estimate') || cat.includes('measurement') || cat.includes('estimate_measurement')) return 'Estimate/Measurement';
    if (purpose.includes('census')) return 'Statistical Census';
    
    return 'Technical';
  };

  const getSubCategory = (report: GroundwaterReport) => {
    const cat = report.category || '';
    if (cat === 'ESTIMATE_MEASUREMENT') return report.reportType || 'Measurement';
    return cat.split(' / ')[0] || 'General';
  };

  const { filteredReports, metrics, uniqueVillages, uniqueTypes } = useMemo(() => {
    if (!reports) return { filteredReports: [], metrics: { total: 0, investigation: 0, drilling: 0, flushing: 0, pumping: 0, supervision: 0, estimateMeasurement: 0, statisticalCensus: 0 }, uniqueVillages: [], uniqueTypes: [] };
    
    const savedReports = reports.filter(r => 
      (r.nameOfSite?.trim() || r.applicantName?.trim() || r.fileNo?.trim() || r.location?.trim())
    );

    const villages = Array.from(new Set(savedReports.map(r => r.village).filter(Boolean))).sort();
    const types = Array.from(new Set(savedReports.map(r => r.typeAppliedFor).filter(Boolean))).sort();
    
    const met = {
      total: savedReports.length,
      investigation: savedReports.filter(r => r.purpose?.toLowerCase().includes('investigation') || r.category?.toLowerCase().includes('survey')).length,
      drilling: savedReports.filter(r => r.purpose?.toLowerCase().includes('drilling') || r.workType === 'DRILLING').length,
      flushing: savedReports.filter(r => r.purpose?.toLowerCase().includes('flushing') || r.workType === 'FLUSHING').length,
      pumping: savedReports.filter(r => r.purpose?.toLowerCase().includes('pumping test')).length,
      supervision: savedReports.filter(r => r.purpose?.toLowerCase().includes('supervision')).length,
      estimateMeasurement: savedReports.filter(r => r.category === 'ESTIMATE_MEASUREMENT' || r.category?.toLowerCase().includes('estimate') || r.category?.toLowerCase().includes('measurement')).length,
      statisticalCensus: savedReports.filter(r => r.purpose?.toLowerCase().includes('census')).length,
    };

    const filtered = savedReports.filter(report => {
      const purpose = report.purpose?.toLowerCase() || '';
      const cat = report.category?.toLowerCase() || '';
      if (activeTab === 'Investigation' && !(purpose.includes('investigation') || cat.includes('survey'))) return false;
      if (activeTab === 'Well Drilling' && !(purpose.includes('drilling') || report.workType === 'DRILLING')) return false;
      if (activeTab === 'Well Flushing' && !(purpose.includes('flushing') || report.workType === 'FLUSHING')) return false;
      if (activeTab === 'Pumping Test' && !purpose.includes('pumping test')) return false;
      if (activeTab === 'Supervision' && !purpose.includes('supervision')) return false;
      if (activeTab === 'Estimate/Measurement' && !(cat.includes('estimate_measurement') || cat.includes('estimate') || cat.includes('measurement'))) return false;
      if (activeTab === 'Statistical Census' && !purpose.includes('census')) return false;
      
      const searchStr = (report.fileNo || report.nameOfSite || report.applicantName || report.village || report.location || '').toLowerCase();
      if (globalSearch && !searchStr.includes(globalSearch.toLowerCase())) return false;
      if (fileNoSearch && !report.fileNo?.toLowerCase().includes(fileNoSearch.toLowerCase())) return false;
      if (villageFilter !== 'all' && report.village !== villageFilter) return false;
      if (lsgdFilter !== 'all' && report.lsgd !== lsgdFilter) return false;
      if (typeFilter !== 'all' && report.typeAppliedFor !== typeFilter) return false;
      
      return true;
    });

    return { filteredReports: filtered, metrics: met, uniqueVillages: villages, uniqueTypes: types };
  }, [reports, activeTab, globalSearch, fileNoSearch, villageFilter, lsgdFilter, typeFilter]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const getEditUrl = (report: GroundwaterReport) => {
    const id = report.id;
    const purpose = (report.purpose || '').toLowerCase();
    const category = (report.category || '').toLowerCase();
    
    const isVes = !!report.vesData || category.includes('geophysical');
    const isEM = category.includes('estimate_measurement') || !!report.reportType;
    const isSupervision = purpose.includes('supervision') || category.includes('supervision') || !!report.arsSubType;

    if (isEM) {
      return report.reportType === 'MEASUREMENT' ? `/estimate-measurement/measurement?id=${id}` : `/estimate-measurement/estimate?id=${id}`;
    }
    if (isSupervision) {
      if (report.arsSubType === 'ARS_DUG_WELL_RECHARGE') return `/supervision/ars/dugwell-entry?id=${id}`;
      if (report.arsSubType === 'ARS_PIT_RECHARGE') return `/supervision/ars/pit/inspection?id=${id}`;
      if (purpose.includes('hps')) return `/supervision/hps/site-entry?id=${id}`;
      if (purpose.includes('hpr')) return `/supervision/hpr/site-entry?id=${id}`;
      if (purpose.includes('mwss')) return `/supervision/mwss-reno/mwss-entry?id=${id}`;
      if (purpose.includes('drilling')) return `/supervision/bw-construction/drilling-entry?id=${id}`;
      if (purpose.includes('flushing')) return `/supervision/bw-construction/flushing-entry?id=${id}`;
    }
    if (purpose.includes('drilling') || report.workType === 'DRILLING') return `/well-drilling/drilling-entry?id=${id}`;
    if (purpose.includes('flushing') || report.workType === 'FLUSHING') return `/well-drilling/flushing-entry?id=${id}`;
    if (purpose.includes('pumping test')) return report.category?.includes('Bore') ? `/pumping-test/borewell-entry?id=${id}` : `/pumping-test/open-well-entry?id=${id}`;
    
    return isVes ? `/ground-water-investigation/geophysical-survey/site-entry?id=${id}` : `/ground-water-investigation/geological-survey/site-entry?id=${id}`;
  };

  const getTechnicalDocuments = (report: GroundwaterReport) => {
    const id = report.id;
    const mainCategory = getMainCategory(report);
  
    switch (mainCategory) {
      case "Well Drilling":
        return [
          { name: "BWC COMPLETION REPORT", type: "BWC", color: "blue", icon: FileText, url: `/well-drilling/private/drinking/completion-report?id=${id}` },
          { name: "FINAL BILL – Drilling", type: "BILL_DRILLING", color: "green", icon: ReceiptIndianRupee, url: `/well-drilling/private/drinking/final-bill?id=${id}` }
        ];
      case "Well Flushing":
        return [
          { name: "BWF COMPLETION REPORT", type: "BWF", color: "blue", icon: FileText, url: `/well-drilling/private/drinking/flushing-report?id=${id}` },
          { name: "FINAL BILL – Flushing", type: "BILL_FLUSHING", color: "green", icon: ReceiptIndianRupee, url: `/well-drilling/private/drinking/final-bill?id=${id}` }
        ];
      case "Investigation":
        const isVes = !!report.vesData || report.category?.toLowerCase().includes('geophysical');
        if (isVes) return [{ name: "GEOPHYSICAL INVESTIGATION REPORT", type: "geophysical", color: "blue", icon: FileSearch, url: `/report/${id}/ves` }];
        return [
          { name: "INVESTIGATION REPORT", type: "investigation", color: "blue", icon: FileSearch, url: `/report/${id}` },
          { name: "FEASIBILITY REPORT", type: "feasibility", color: "green", icon: FileCheck, url: report.recommendationType === 'openwell' ? `/report/${id}/feasibility-open-well` : `/report/${id}/feasibility-bore-well` }
        ];
      case "Pumping Test":
        return [
          { name: "YT COMPLETION REPORT", type: "YT", color: "blue", icon: FileText, url: report.category?.includes('Bore') ? `/pumping-test/private/agriculture/bore-well/yield-test/completion-report?id=${id}` : `/pumping-test/private/agriculture/open-well/yield-test/completion-report?id=${id}` },
          { name: "YIELD TEST REPORT", type: "YIELD", color: "purple", icon: Activity, url: `/pumping-test/private/agriculture/yield-test-report?id=${id}` }
        ];
      case "Supervision":
        let supUrl = '#';
        let supLabel = 'COMPLETION REPORT';
        const purpose = (report.purpose || '').toLowerCase();
        if (report.arsSubType) supUrl = `/supervision/ars/completion-report?id=${id}`;
        else if (purpose.includes('hps')) supUrl = `/supervision/hps/completion-report?id=${id}`;
        else if (purpose.includes('hpr')) supUrl = `/supervision/hpr/completion-report?id=${id}`;
        else if (purpose.includes('mwss')) supUrl = `/supervision/mwss-reno/completion-report?id=${id}`;
        return [{ name: supLabel, type: "SUP", color: "blue", icon: FileText, url: supUrl }];
      case "Estimate/Measurement":
         return [{ name: report.reportType === "ESTIMATE" ? "ESTIMATE REPORT" : "MEASUREMENT REPORT", type: "EM", color: "blue", icon: FileText, url: "#", isModal: true }];
      default:
        return [];
    }
  };

  const handleDeleteReport = () => {
    if (!firestore || !reportToDelete) return;
    const docRef = doc(firestore, `groundwaterReports`, reportToDelete.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Record Deleted", variant: "destructive" });
    setReportToDelete(null);
  };

  const keysToIgnore = ['id', 'uploadedBy', 'createdAt', 'updatedAt', 'staffAssignment', 'works', 'vesData', 'pumpingData', 'recoveryData', 'sites', 'pitTable'];

  return (
    <div className="p-4 sm:p-6 space-y-8 min-h-screen bg-background text-left">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-5">
          <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shadow-sm"><Logo /></div>
          <div className="space-y-0.5">
            <Breadcrumb />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Technical Records Center</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ground Water Department, District Office, Malappuram</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
        {[
          { label: 'Total Records', value: metrics.total, color: 'border-slate-400 text-slate-900', icon: FileCheck },
          { label: 'Investigation', value: metrics.investigation, color: 'border-blue-500 text-blue-600', icon: FileText },
          { label: 'Drilling Jobs', value: metrics.drilling, color: 'border-indigo-500 text-indigo-600', icon: Pickaxe },
          { label: 'Flushing Jobs', value: metrics.flushing, color: 'border-cyan-500 text-cyan-600', icon: Wind },
          { label: 'Pumping Tests', value: metrics.pumping, color: 'border-amber-500 text-amber-600', icon: TrendingUp },
          { label: 'Supervision', value: metrics.supervision, color: 'border-rose-500 text-rose-600', icon: ShieldCheck },
          { label: 'Estimates', value: metrics.estimateMeasurement, color: 'border-purple-500 text-purple-600', icon: Ruler },
          { label: 'Census', value: metrics.statisticalCensus, color: 'border-teal-500 text-teal-600', icon: BarChart }
        ].map((m, i) => (
          <Card key={i} className={cn("border-none shadow-sm transition-all relative overflow-hidden ring-1 ring-slate-200", m.value === 0 && "opacity-60")}>
            <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", m.color.split(' ')[0].replace('border-', 'from-'))} />
            <CardContent className="p-5 flex flex-col items-start">
              <m.icon className={cn("h-5 w-5 mb-3 opacity-40", m.color.split(' ')[1])} />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">{m.label}</p>
              <p className="text-xl font-black">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input placeholder="Universal Search: File No, Site, Applicant..." className="h-14 pl-12 bg-white border-slate-200 shadow-sm rounded-2xl" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
        </div>
        <Card className="border-none shadow-sm bg-secondary/30 rounded-2xl ring-1 ring-slate-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">File Reference</Label><Input placeholder="MPM/GWD/..." value={fileNoSearch} onChange={(e) => setFileNoSearch(e.target.value)} className="bg-white h-10" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Village</Label><Select onValueChange={setVillageFilter} value={villageFilter}><SelectTrigger className="bg-white h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Villages</SelectItem>{uniqueVillages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">LSGD</Label><Select onValueChange={setLsgdFilter} value={lsgdFilter}><SelectTrigger className="bg-white h-10"><SelectValue placeholder="Select LSGD" /></SelectTrigger><SelectContent><SelectItem value="all">All LSGDs</SelectItem>{lsgs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Structure</Label><Select onValueChange={setTypeFilter} value={typeFilter}><SelectTrigger className="bg-white h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent h-auto p-0 gap-8 rounded-none border-b border-slate-200 w-full flex justify-start">
          {['All Documents', 'Investigation', 'Well Drilling', 'Well Flushing', 'Pumping Test', 'Supervision', 'Estimate/Measurement', 'Statistical Census'].map((tab) => (
            <TabsTrigger key={tab} value={tab === 'All Documents' ? 'all' : tab} className="rounded-none px-0 py-3 font-bold text-sm text-slate-500 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary transition-all uppercase">{tab}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white">
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-12 text-center text-[10px] font-black uppercase">Sl No</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Reference</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Site/Applicant</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Category</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Sub Category</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Record Date</TableHead>
                      <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell></TableRow>)
                    ) : paginatedReports.length > 0 ? (
                      paginatedReports.map((report, index) => {
                        const isOwner = user?.uid === report.uploadedBy;
                        const canModifyRecord = isAdmin || isOwner;
                        
                        return (
                          <TableRow key={report.id} className="hover:bg-slate-50/80 group">
                            <TableCell className="text-center font-bold text-slate-400 text-xs">{ (currentPage - 1) * itemsPerPage + index + 1 }</TableCell>
                            <TableCell className="font-bold text-slate-900 font-mono text-xs">{report.fileNo || report.id.slice(0,8)}</TableCell>
                            <TableCell><div className="flex flex-col"><span className="font-bold text-slate-800 uppercase text-xs">{report.nameOfSite || report.applicantName || report.location}</span><span className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {report.village || report.lsgd}</span></div></TableCell>
                            <TableCell><span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{getMainCategory(report)}</span></TableCell>
                            <TableCell><Badge variant="secondary" className="text-[9px] font-black">{getSubCategory(report)}</Badge></TableCell>
                            <TableCell className="text-[11px] font-medium text-slate-500">{report.reportDate || '--'}</TableCell>
                            <TableCell className="text-right pr-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 transition-colors" title="View Report" onClick={() => setViewingReport(report)}><Eye className="h-4 w-4"/></Button>
                                <Button asChild variant="ghost" size="icon" className={cn("h-8 w-8 transition-colors", canModifyRecord ? "text-slate-400 hover:text-green-600" : "opacity-20 pointer-events-none")} title={canModifyRecord ? "Edit Record" : "Access Restricted"}>{canModifyRecord ? <Link href={getEditUrl(report)}><Edit3 className="h-4 w-4"/></Link> : <span><Lock className="h-3 w-3"/></span>}</Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!canModifyRecord} className={cn("size-8 transition-colors", canModifyRecord ? "text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl" : "opacity-20")} title="Delete Record">
                                      {canModifyRecord ? <Trash2 className="size-4" /> : <Lock className="size-3 text-slate-300"/>}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl p-8">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently delete the record. Are you sure?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-4">
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteReport()} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors" title="More Actions"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2 bg-white shadow-2xl border-slate-200">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Technical Documents</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="px-1 py-1 space-y-2">
                                      {getTechnicalDocuments(report).map((btn, bIdx) => (
                                        <DropdownMenuItem key={bIdx} onClick={() => btn.isModal ? (setSelectedEmReport(report), setIsEmModalOpen(true)) : window.open(btn.url, '_blank')} className={cn("rounded-xl gap-3 cursor-pointer font-black text-[11px] text-white py-3 px-4", btn.color === 'blue' ? "bg-gradient-to-br from-blue-600 to-blue-900" : btn.color === 'green' ? "bg-gradient-to-br from-emerald-600 to-emerald-900" : "bg-gradient-to-br from-purple-600 to-purple-900")}>
                                          <btn.icon className="h-4 w-4" /><span>{btn.name}</span><ArrowRight className="h-3 w-3 ml-auto opacity-50" />
                                        </DropdownMenuItem>
                                      ))}
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow><TableCell colSpan={7} className="h-64 text-center text-slate-400 uppercase font-black text-xs">No saved records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="justify-between border-t py-4 px-6">
                <div className="text-[10px] font-black text-slate-400 uppercase">Showing {paginatedReports.length} of {filteredReports.length} Files</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Previous</Button>
                  <div className="text-xs font-bold text-slate-600 mx-2">Page {currentPage} / {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ReportDialog report={selectedEmReport} isOpen={isEmModalOpen} onOpenChange={setIsEmModalOpen} />

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent className="rounded-3xl p-8 text-left">
            <AlertDialogHeader className="flex flex-col items-center text-center">
                <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="size-8" /></div>
                <AlertDialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Delete Technical Record?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-lg mt-2">You are about to permanently delete the record for <strong>{reportToDelete?.fileNo || reportToDelete?.id}</strong>. This action cannot be reversed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-center">
                <AlertDialogCancel onClick={() => setReportToDelete(null)} className="rounded-2xl h-12 px-8 border-slate-200">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-8 text-white font-bold shadow-lg shadow-red-200">Confirm Deletion</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-3xl rounded-[32px] overflow-hidden p-0 border-none shadow-2xl bg-white text-left">
          <DialogHeader className="p-8 bg-slate-50/50 border-b text-left">
            <DialogTitle className="text-xl font-black uppercase text-slate-900">Technical Record: {viewingReport?.fileNo}</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">Viewing all saved parameters for site: {viewingReport?.nameOfSite || viewingReport?.applicantName || viewingReport?.location}</DialogDescription>
          </DialogHeader>
          {viewingReport && (
            <ScrollArea className="max-h-[60vh]">
              <div className="py-2 px-8">
                {Object.entries(viewingReport).filter(([key, value]) => value && !keysToIgnore.includes(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[240px_1fr] items-start gap-4 py-3.5 border-b border-slate-100 last:border-b-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right pr-4">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span className="font-semibold text-slate-800 text-sm break-words">{String(value)}</span>
                    </div>
                ))}
                {viewingReport.staffAssignment && Object.entries(viewingReport.staffAssignment).filter(([, value]) => value).length > 0 && (
                     <div className="py-3.5 text-left">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right pr-4 mb-2">Staff Assignment</h4>
                         {Object.entries(viewingReport.staffAssignment).filter(([, value]) => value).map(([key, value]) => (
                             <div key={key} className="grid grid-cols-[240px_1fr] items-start gap-4 py-2 border-b border-slate-50 last:border-b-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-4">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                <span className="font-semibold text-slate-800 text-sm break-words">{String(value)}</span>
                             </div>
                         ))}
                     </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="border-t bg-slate-50/50 p-4 justify-end"><Button onClick={() => setViewingReport(null)} className="h-10 rounded-xl px-8 font-bold">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
