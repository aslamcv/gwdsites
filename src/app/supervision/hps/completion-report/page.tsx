'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect } from 'react';
import { Printer, ArrowLeft, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const firestore = useFirestore();
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  useEffect(() => {
    if (report) {
      document.title = `HPS-Completion-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!report && id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-slate-800">Technical Record Not Found</h1>
        <Button asChild className="mt-6">
          <Link href="/supervision">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  const technicalData = [
    { label: '1. Name of Place', value: report?.nameOfPlace || report?.nameOfSite },
    { label: '2. Name of Panchayath', value: report?.panchayathName || report?.lsgd },
    { label: '3. Size of Well', value: report?.wellSize },
    { label: '4. Type of Hand Pump', value: report?.typeOfHandPump },
    { label: '5. Static Water Level (m)', value: report?.staticWaterLevel },
    { label: '6. Depth of Pump Installed (m)', value: report?.depthOfPumpInstalled },
    { label: '7. Date of Completion', value: report?.reportDate },
    { label: '8. Size of Platform Constructed', value: report?.platformSize },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-sans text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/supervision">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs">
            <Printer className="h-3 w-3" />
            Print Completion Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[12px] border border-slate-200 print:border-none overflow-hidden relative">
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'HPS INSTALLATION').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-8 border-b-2 border-slate-900 pb-4">
          <h1 className="text-[18px] font-black text-slate-900 uppercase tracking-wide">GROUND WATER DEPARTMENT</h1>
          <h2 className="text-[14px] font-bold text-slate-600 uppercase">DISTRICT OFFICE, MALAPPURAM</h2>
          <div className="h-4"></div>
          <h3 className="text-[16px] font-black text-slate-900 underline underline-offset-8 uppercase">
            HPS COMPLETION REPORT
          </h3>
        </div>

        <div className="space-y-2 mb-8 px-4 text-left">
          {technicalData.map((item, i) => (
            <div key={i} className="flex border-b border-dotted border-slate-300 pb-1">
              <span className="font-bold text-slate-700 w-[240px] shrink-0">{item.label} :</span>
              <span className="font-black text-slate-900 uppercase truncate">{item.value || '__________________________'}</span>
            </div>
          ))}
        </div>

        <div className="mb-8 px-4 py-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nature of Work</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-900" />
              <span className="text-[11px] font-bold uppercase">Installation of Pump</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-900" />
              <span className="text-[11px] font-bold uppercase">Construction of Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-slate-900" />
              <span className="text-[11px] font-bold uppercase">Civil & Mech Works</span>
            </div>
          </div>
        </div>

        <div className="flex-grow"></div>

        <div className="grid grid-cols-3 gap-8 text-[10px] text-center font-black px-4 pt-10">
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.supervisor || '---'}</div>
            <p className="border-t border-slate-900 pt-2 uppercase">PREPARED BY</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.assistantEngineer || '---'}</div>
            <p className="border-t border-slate-900 pt-2 uppercase">VERIFIED BY</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase">---</div>
            <p className="border-t border-slate-900 pt-2 uppercase">APPROVED BY</p>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-slate-200 text-[8px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
          <span>OFFICIAL COMPLETION RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function HPSCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}