'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect } from 'react';
import { Printer, ArrowLeft, MapPin, Construction, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function ConsolidatedReportContent() {
  const searchParams = useSearchParams();
  const fileNo = searchParams.get('fileNo');
  const firestore = useFirestore();
  
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !fileNo) return null;
    return query(
      collection(firestore, 'groundwaterReports'),
      where('fileNo', '==', fileNo)
    );
  }, [firestore, fileNo]);

  const { data: reports, isLoading } = useCollection<GroundwaterReport>(reportsQuery);

  // Use the first record for common header info (Applicant details etc)
  const masterReport = reports?.[0];

  useEffect(() => {
    if (fileNo) {
      document.title = `Consolidated-Feasibility-${fileNo.replace(/\//g, '-')}.pdf`;
    }
  }, [fileNo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Record Not Found</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">No technical investigations found for File No: <span className="font-bold">{fileNo}</span></p>
        <Button asChild className="mt-8 px-10 rounded-xl font-bold uppercase text-xs h-12">
          <Link href="/ground-water-investigation">Back to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 pt-12 pb-10 px-4 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/ground-water-investigation">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs px-6 rounded-lg shadow-lg">
          <Printer className="h-3 w-3" />
          Print Consolidated Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[15mm] flex flex-col border border-slate-200 print:border-none relative">
        
        {/* Header Section */}
        <div className="text-center mb-4">
            <p className="font-bold underline underline-offset-4 text-[13px] mb-2">ഭരണഭാഷ - മാതൃഭാഷ</p>
            <h1 className="text-[17px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
        </div>

        <div className="flex justify-between items-start mb-6">
            <div>
                <p className="flex items-center gap-1 font-bold">ഫയൽ നമ്പർ: {fileNo}</p>
            </div>
            <div className="text-right space-y-0.5 leading-tight text-[11px]">
                <p className="font-bold">ജില്ലാ ഓഫീസ്, മലപ്പുറം - 676 505</p>
                <p>ഫോൺ: 0483-2731450</p>
                <p>തീയതി: {masterReport?.dateOfFeasibility || masterReport?.reportDate || format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
        </div>

        <div className="space-y-4 mb-6 text-left text-[12px]">
            <div className="flex flex-col">
                <p>പ്രേഷകൻ,</p>
                <p className="pl-16 font-bold">ജില്ലാ ഓഫീസർ, ഭൂജല വകുപ്പ്, മലപ്പുറം</p>
            </div>
            <div className="flex flex-col">
                <p>അപേക്ഷകൻ,</p>
                <div className="ml-16 mt-1 p-5 border border-black min-h-[60px] w-full max-w-[550px] uppercase font-bold text-[11.5px] flex items-center leading-relaxed">
                    {masterReport?.applicantNameAddress || masterReport?.applicantName || '---'}
                </div>
            </div>
        </div>

        <p className="mb-3 text-left">സർ,</p>

        <div className="space-y-1.5 mb-6 ml-10 text-left text-[12px]">
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">വിഷയം :</span>
                <span>ഭൂജല വകുപ്പ് - മലപ്പുറം - സംയോജിത ഫിസിബിലിറ്റി റിപ്പോർട്ട് - സംബന്ധിച്ച്.</span>
            </div>
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">സൂചന :</span>
                <span>താങ്കളുടെ <span className="font-bold border-b border-black px-4">{masterReport?.applicationDate || '--'}</span> തീയതിയിലെ അപേക്ഷ.</span>
            </div>
        </div>

        <p className="mb-6 indent-20 text-justify text-[12px] leading-relaxed">
            മേൽ സൂചനയിലേക്ക് ശ്രദ്ധ ക്ഷണിക്കുന്നു. താങ്കൾ അപേക്ഷിച്ച സ്ഥലങ്ങളിൽ ഭൂജല സർവ്വേ പൂർത്തിയാക്കി ഓരോ സൈറ്റിന്റെയും ഫിസിബിലിറ്റി വിവരങ്ങൾ താഴെ നൽകുന്നു.
        </p>

        <div className="text-center mb-6">
            <h3 className="font-bold text-[15px] underline underline-offset-4 inline-block uppercase tracking-wide">സംയോജിത ഫിസിബിലിറ്റി റിപ്പോർട്ട്</h3>
        </div>

        {/* Dynamic Sites Section */}
        <div className="space-y-8 mb-10">
          {reports.map((site, index) => {
            const isBore = site.recommendationType === 'borewell' || site.recommendationType === 'tubewell' || site.recommendationType === 'filterpoint';
            const isNo = site.recommendationType === 'not_feasible';
            
            return (
              <div key={site.id} className="border border-slate-400 rounded-[20px] p-6 bg-slate-50/30 break-inside-avoid shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                  <Badge className="bg-slate-900 text-white font-black px-4 h-6 rounded-lg uppercase text-[10px]">SITE {index + 1}</Badge>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{site.village || 'VILLAGE NOT RECORDED'}</span>
                </div>
                
                <div className="grid grid-cols-[120px_1fr] gap-4 mb-4 text-left">
                  <span className="font-bold text-slate-400 uppercase text-[9px] pt-1">Location Details:</span>
                  <span className="font-black uppercase text-[13px] text-slate-900 leading-tight">{site.nameOfSite}</span>
                </div>

                {isNo ? (
                  <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl">
                    <p className="text-rose-800 font-bold text-center text-[12px] uppercase">ഈ സൈറ്റിൽ കുഴൽ കിണറോ തുറന്ന കിണറോ അനുവദനീയമല്ല.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-[12px] text-left">
                    <div className="space-y-3">
                       <p className="flex justify-between border-b border-dotted border-slate-300 pb-1.5">
                          <span className="text-slate-500 font-medium">കിണറിൻറെ തരം:</span>
                          <span className="font-bold uppercase">{isBore ? 'കുഴൽ കിണർ' : 'തുറന്ന കിണർ'}</span>
                       </p>
                       <p className="flex justify-between border-b border-dotted border-slate-300 pb-1.5">
                          <span className="text-slate-500 font-medium">ആകെ ആഴം (m):</span>
                          <span className="font-bold">{isBore ? site.recBorewellTotalDepth : site.recOpenwellTotalDepth} m</span>
                       </p>
                    </div>
                    <div className="space-y-3">
                       <p className="flex justify-between border-b border-dotted border-slate-300 pb-1.5">
                          <span className="text-slate-500 font-medium">വ്യാസം:</span>
                          <span className="font-bold">{isBore ? site.recBorewellDiameter : site.recOpenwellDiameter}</span>
                       </p>
                       {isBore && (
                         <p className="flex justify-between border-b border-dotted border-slate-300 pb-1.5">
                            <span className="text-slate-500 font-medium">Overburden:</span>
                            <span className="font-bold">{site.expectedOverburden || '---'} m</span>
                         </p>
                       )}
                    </div>
                  </div>
                )}
                
                {(site.recommendationBorewell || site.recommendationOpenwell) && (
                  <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 text-[11.5px] italic text-slate-800 leading-relaxed text-justify shadow-inner">
                    <p className="font-bold mb-1 underline uppercase text-[9px] not-italic text-slate-400">Technical Details:</p>
                    {site.recommendationBorewell || site.recommendationOpenwell}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-grow"></div>

        <div className="mt-auto flex flex-col items-end pt-12">
            <div className="text-center min-w-[220px] space-y-1">
                <p className="font-bold text-[12px]">വിശ്വസ്തതയോടെ,</p>
                <div className="h-20"></div>
                <p className="font-bold text-[15px] uppercase border-t border-black pt-1">ജില്ലാ ഓഫീസർ.</p>
            </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-3 text-[8px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-black">
            <p>Groundwater Department District Office, Malappuram.</p>
            <p>CONSOLIDATED TECHNICAL RECORD - {fileNo}</p>
        </div>
      </div>
    </div>
  );
}

export default function ConsolidatedFeasibilityReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse uppercase tracking-[0.3em]">Processing Combined Records...</div>}>
      <ConsolidatedReportContent />
    </Suspense>
  );
}
