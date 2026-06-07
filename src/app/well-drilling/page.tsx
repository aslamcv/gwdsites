'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Search, 
  Pickaxe, 
  Wind,
  ChevronDown,
  Eye,
  Edit3,
  FilterX,
  Trash2,
  FileText,
  Lock,
  ReceiptIndianRupee,
  FileCheck,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

const keysToIgnore = ['id', 'uploadedBy', 'createdAt', 'updatedAt', 'staffAssignment', 'works', 'vesData', 'pumpingData', 'recoveryData', 'sites', 'pitTable', 'summary', 'turbidity', 'step1', 'step2', 'step3'];

export default function WellDrillingLedgerPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<GroundwaterReport | null>(null);
  const [viewingReport, setViewingReport] = useState<GroundwaterReport | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAdmin = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    const email = user?.email?.toLowerCase().trim();
    if (email === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.role?.toLowerCase().trim() === 'admin';
  }, [user, userProfile, isAuthLoading, isProfileLoading]);

  const isEngineer = useMemo(() => userProfile?.role?.toLowerCase().trim() === 'engineer', [userProfile]);
  const isScientist = useMemo(() => userProfile?.role?.toLowerCase().trim() === 'scientist', [userProfile]);

  const isApproved = useMemo(() => {
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.isApproved === true;
  }, [user, userProfile]);

  const isAllowedToAdd = useMemo(() => {
    if (isAuthLoading || isProfileLoading) return false;
    if (isAdmin) return true;
    return (isEngineer || isScientist) && isApproved;
  }, [isAdmin, isEngineer, isScientist, isApproved, isAuthLoading, isProfileLoading]);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || isAuthLoading || !user) return null;
    return query(collection(firestore, 'groundwaterReports'));
  }, [firestore, user, isAuthLoading]);

  const { data: reports, isLoading } = useCollection<GroundwaterReport>(reportsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || isAuthLoading || !user) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, user, isAuthLoading]);
  const { data: systemUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  const userMap = useMemo(() => {
    const map = new Map();
    map.set(MASTER_ADMIN_EMAIL.toLowerCase(), 'District Officer');
    
    if (systemUsers) {
      systemUsers.forEach(u => {
        const name = u.displayName || u.email || 'Technical Officer';
        const uid = (u.uid || '').trim();
        const email = (u.email || '').toLowerCase().trim();
        if (uid) map.set(uid, name);
        if (email) map.set(email, name);
      });
    }
    return map;
  }, [systemUsers]);

  const allRecords = useMemo(() => {
    if (!reports) return [];
    return reports
      .filter(r => {
        const purpose = (r.purpose || '').toLowerCase();
        const isStandaloneDrilling = (r.workType === 'DRILLING' || r.workType === 'FLUSHING' || 
                                     purpose.includes('well drilling') || purpose.includes('well flushing')) &&
                                     !purpose.includes('supervision');

        if (!isStandaloneDrilling) return false;

        const term = searchQuery.toLowerCase().trim();
        if (!term) return true;

        const searchableFields = [r.nameOfSite, r.fileNo, r.applicantName, r.village, r.lsgd, r.address].map(f => (f || '').toLowerCase());
        return searchableFields.some(field => field.includes(term));
      });
  }, [reports, searchQuery]);

  const sortedRecords = useMemo(() => {
    return [...allRecords].sort((a, b) => {
      const dateA = a.createdAt || a.reportDate || '';
      const dateB = b.createdAt || b.reportDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [allRecords]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDeleteReport = () => {
    if (!firestore || !reportToDelete) return;
    const docRef = doc(firestore, 'groundwaterReports', reportToDelete.id);
    
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Record Deleted", variant: "destructive" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        }));
      });
      
    setReportToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Drilling & Development Ledger</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Technical Records of District Standalone Rig Operations</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={!isAllowedToAdd} size="lg" className="h-14 px-8 rounded-2xl bg-[#1e3a8a] hover:bg-blue-900 shadow-xl shadow-blue-900/20 font-black uppercase tracking-widest text-[11px] gap-3">
              <PlusCircle className="size-5" />
              NEW DRILLING ENTRY
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] p-2 rounded-[24px] border-slate-200 shadow-2xl bg-white/95 backdrop-blur-xl">
            <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Work Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-blue-50 group">
              <Link href="/well-drilling/drilling-entry" className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-focus:bg-blue-200"><Pickaxe className="size-4 text-blue-600" /></div>
                <span className="font-bold text-xs uppercase text-slate-700">Borewell Drilling</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-emerald-50 group">
              <Link href="/well-drilling/flushing-entry" className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:scale-110 transition-transform"><Wind className="size-4 text-emerald-600" /></div>
                <span className="font-bold text-xs uppercase text-slate-700">Borewell Flushing</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-md p-4">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Search by Site, File No or Beneficiary..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 h-14">
                <TableRow className="border-slate-100">
                  <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Log Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Site / Reference</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Technical Reports</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Work Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">User</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isUsersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-20 border-slate-50">
                      <TableCell colSpan={6} className="px-8"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedRecords.length > 0 ? (
                  paginatedRecords.map((r) => {
                    const editUrl = r.workType === 'FLUSHING' ? `/well-drilling/flushing-entry?id=${r.id}` : `/well-drilling/drilling-entry?id=${r.id}`;
                    const viewUrl = r.workType === 'FLUSHING' ? `/well-drilling/private/drinking/flushing-report?id=${r.id}` : `/well-drilling/private/drinking/completion-report?id=${r.id}`;
                    
                    const creatorId = (r.uploadedBy || '').trim();
                    const userUid = (user?.uid || '').trim();
                    const userEmail = (user?.email || '').toLowerCase().trim();
                    const creatorLower = creatorId.toLowerCase();
                    
                    const isOwner = (userUid && creatorId === userUid) || (userEmail && creatorLower === userEmail);
                    
                    const canModifyRecord = isAdmin || (isApproved && (isEngineer || isScientist) && isOwner);
                    const ownerName = userMap.get(creatorId) || userMap.get(creatorLower) || 'District Officer';

                    return (
                      <TableRow key={r.id} className="h-20 border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-8 font-bold text-xs text-slate-700">{r.reportDate || '---'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-left">
                            <span className="font-black text-xs text-slate-900 uppercase tracking-tight">{r.nameOfSite || 'Unnamed Site'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{r.fileNo || '---'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex justify-center gap-2">
                              <Button asChild variant="outline" size="sm" className="h-7 px-3 text-[9px] font-black uppercase bg-blue-50 text-blue-700 border-blue-100 rounded-lg shadow-sm">
                                <Link href={viewUrl} target="_blank"><FileText className="size-3 mr-1.5" /> Completion</Link>
                              </Button>
                              <Button asChild variant="outline" size="sm" className="h-7 px-3 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg shadow-sm">
                                <Link href={`/well-drilling/private/drinking/final-bill?id=${r.id}`} target="_blank"><ReceiptIndianRupee className="size-3 mr-1.5" /> Final Bill</Link>
                              </Button>
                           </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[9px] font-black bg-slate-100 text-slate-500 uppercase tracking-tighter">{r.workType || 'DRILLING'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px] block">{ownerName}</span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-1.5">
                             <Button variant="ghost" size="icon" onClick={() => setViewingReport(r)} className="size-8 rounded-lg bg-white ring-1 ring-slate-100 shadow-sm" title="View Saved Data"><Eye className="size-3.5 text-slate-400 hover:text-primary" /></Button>
                             <Button variant="ghost" size="icon" asChild disabled={!canModifyRecord} className="size-8 rounded-lg bg-white ring-1 ring-slate-100 shadow-sm" title={canModifyRecord ? 'Edit Record' : 'Access Restricted'}>
                               <Link href={canModifyRecord ? editUrl : '#'} className={!canModifyRecord ? "pointer-events-none opacity-50" : ""}><Edit3 className={cn("size-3.5", canModifyRecord ? "text-slate-400 hover:text-emerald-600" : "opacity-30")} /></Link>
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => canModifyRecord && setReportToDelete(r)} disabled={!canModifyRecord} className={cn("size-8 rounded-lg transition-colors bg-white ring-1 ring-slate-100", canModifyRecord ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50" : "opacity-20")} title={canModifyRecord ? 'Delete' : 'Access Restricted'}><Trash2 className="size-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-20"><FilterX className="size-16 mx-auto mb-4" /><p className="font-black uppercase text-sm">No drilling logs found</p></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t py-4 px-8 flex justify-between items-center text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {paginatedRecords.length} of {allRecords.length} Standalone Technical Logs</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8 rounded-lg font-bold text-[10px] uppercase border-slate-200 bg-white">Previous</Button>
                <div className="text-[10px] font-black text-slate-500 uppercase px-4 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">Page {currentPage} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-8 rounded-lg font-bold text-[10px] uppercase border-slate-200 bg-white">Next</Button>
              </div>
            )}
        </CardFooter>
      </Card>
      
      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-3xl rounded-[32px] overflow-hidden p-0 border-none shadow-2xl bg-white text-left text-left">
          <DialogHeader className="p-8 bg-slate-50/50 border-b text-left">
            <DialogTitle className="text-xl font-black uppercase text-slate-900">Technical Record: {viewingReport?.fileNo || 'Preview'}</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">Viewing all saved parameters for site: {viewingReport?.nameOfSite || viewingReport?.applicantName || viewingReport?.location}</DialogDescription>
          </DialogHeader>
          {viewingReport && (
            <ScrollArea className="max-h-[60vh]">
              <div className="py-2 px-8">
                {Object.entries(viewingReport).filter(([key, value]) => value !== undefined && value !== null && value !== '' && !keysToIgnore.includes(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[240px_1fr] items-start gap-4 py-3.5 border-b border-slate-100 last:border-b-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right pr-4">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span className="font-semibold text-slate-800 text-sm break-words">{String(value)}</span>
                    </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="border-t bg-slate-50/50 p-4 justify-end"><Button onClick={() => setViewingReport(null)} className="h-10 rounded-xl px-8 font-bold">Close Window</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent className="rounded-3xl p-8">
            <AlertDialogHeader className="flex flex-col items-center text-center">
                <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="size-8" /></div>
                <AlertDialogTitle className="text-2xl font-black text-slate-800 uppercase tracking-tight">Delete Drilling Record?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-lg mt-2">You are about to permanently delete the record for <strong>{reportToDelete?.fileNo || reportToDelete?.id}</strong>. This action cannot be reversed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex gap-3 sm:justify-center">
                <AlertDialogCancel onClick={() => setReportToDelete(null)} className="rounded-2xl h-12 px-8 border-slate-200">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-8 text-white font-bold shadow-lg shadow-red-200">Confirm Deletion</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}