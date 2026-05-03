'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { useEffect, Suspense } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

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
      document.title = `Pumping-Data-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  const isBoreWell = report?.purpose?.toLowerCase().includes('bore well');
  const testType = isBoreWell ? 'Bore Well (SDT)' : 'Open Well / Pond (PYT/WPT)';

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
          <Link href="/pumping-test">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-sans text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/pumping-test">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[8mm] flex flex-col text-[11px] leading-tight border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report?.sector || 'PRIVATE').toUpperCase()}/{(report?.category || 'AGRICULTURE').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-0.5 mb-4">
          <h1 className="text-[16px] font-bold font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[13px] font-bold uppercase underline underline-offset-4">PUMPING DATA REPORT</h2>
        </div>

        <table className="w-full text-[10px] mb-4 border-collapse border border-black text-left">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold w-1/4">File No</td>
              <td className="border border-black p-1">{report?.fileNo}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Name of Site</td>
              <td className="border border-black p-1 uppercase">{report?.nameOfSite}</td>
            </tr>
             <tr>
              <td className="border border-black p-1 font-bold">Location</td>
              <td className="border border-black p-1 uppercase">{report?.address}, {report?.lsgd}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">Test Type</td>
              <td className="border border-black p-1">{testType}</td>
            </tr>
          </tbody>
        </table>

        <h4 className="font-bold text-[12px] mb-2 underline">Pumping Details</h4>
        <table className="w-full text-center border-collapse border border-black text-[9px]">
          <thead className="bg-slate-50">
            <tr className="font-bold">
              <th className="border border-black p-1">Time (min)</th>
              <th className="border border-black p-1">Water Level (mbmp)</th>
              <th className="border border-black p-1">Drawdown (m)</th>
              <th className="border border-black p-1">OBW-1</th>
              <th className="border border-black p-1">OBW-2</th>
              <th className="border border-black p-1">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {report?.pumpingData?.map((row, i) => (
              <tr key={i}>
                <td className="border border-black p-1">{row.timeSincePumpingStarted}</td>
                <td className="border border-black p-1">{row.depthToWaterLevel}</td>
                <td className="border border-black p-1 font-bold">{row.drawdown}</td>
                <td className="border border-black p-1">{row.obw1}</td>
                <td className="border border-black p-1">{row.obw2}</td>
                <td className="border border-black p-1 text-left px-2">{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="flex-grow"></div>

        <div className="flex justify-end pt-12">
            <div className="text-center">
                <div className="h-12"></div>
                <p className="border-t border-black pt-1 font-bold text-[11px] uppercase">Authorized Technical Officer</p>
            </div>
        </div>

        <div className="mt-8 pt-1.5 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>SYSTEM GENERATED PUMPING LOG RECORD</span>
        </div>

      </div>
    </div>
  );
}

export default function PumpingDataReportPage() {
    return (
      <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Pumping Data Report...</div>}>
        <ReportContent />
      </Suspense>
    );
  }