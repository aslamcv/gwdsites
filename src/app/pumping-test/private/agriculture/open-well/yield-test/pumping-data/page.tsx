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
      document.title = `Pumping-Data-OW-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[210mm] bg-white shadow-xl rounded-none" />
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

  const staff = report?.staffAssignment;
  const techName = typeof staff?.hydrogeologist === 'string' ? staff.hydrogeologist : (Array.isArray(staff?.hydrogeologist) ? staff.hydrogeologist.join(', ') : '--');
  const observerName = typeof staff?.unitInCharge === 'string' ? staff.unitInCharge : (Array.isArray(staff?.unitInCharge) ? staff.unitInCharge.join(', ') : '--');

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 print:bg-white print:p-0 font-sans text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/pumping-test">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs px-6">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[8mm] flex flex-col text-[11px] leading-tight border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="flex justify-between items-start mb-4">
          <div className="w-[180px]"></div>
          <div className="text-center flex-1 space-y-0.5">
            <h1 className="text-[16px] font-bold font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
            <h2 className="text-[13px] font-bold uppercase underline underline-offset-4">YIELD TEST (PYT/WPT)</h2>
            <h3 className="text-[12px] font-bold">PUMPING DATA</h3>
          </div>
          <div className="w-[180px] text-right text-[8.5px] font-bold text-slate-800 uppercase leading-none">
            {(report?.sector || 'PRIVATE').toUpperCase()}/{(report?.category || 'OPEN WELL/POND').toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-1 mb-6 items-start text-left">
          <div className="space-y-1">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="font-bold">Location :</span>
              <span className="border-b border-dotted border-black font-medium">{report?.nameOfSite}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="font-bold">Panchayath :</span>
              <span className="border-b border-dotted border-black font-medium uppercase">{report?.lsgd}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="font-bold">Name of GA/JHG/HG :</span>
              <span className="border-b border-dotted border-black font-medium truncate uppercase">{techName}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="font-bold">Name of Observer :</span>
              <span className="border-b border-dotted border-black font-medium uppercase">{observerName}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="font-bold">Capacity of Pump (HP) :</span>
              <span className="border-b border-dotted border-black font-medium">{report?.pumpCapacity}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
              <span className="font-bold text-right">Date :</span>
              <span className="border border-black px-2 h-6 flex items-center bg-white font-medium">{report?.reportDate}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
              <span className="font-bold text-right">Type of well :</span>
              <span className="border border-black px-2 h-6 flex items-center bg-white font-medium uppercase">{report?.typeOfWell || 'OPEN WELL'}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
              <span className="font-bold text-right">Depth of the well (m) :</span>
              <span className="border border-black px-2 h-6 flex items-center bg-white font-medium">{report?.depthOfWell}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 items-center">
              <span className="font-bold text-right">Static water level (mbmp) :</span>
              <span className="border border-black px-2 h-6 flex items-center bg-white font-medium">{report?.staticWaterLevel}</span>
            </div>
          </div>
        </div>

        <div className="border border-black flex-1 overflow-hidden">
          <table className="w-full text-center border-collapse table-fixed">
            <thead className="bg-slate-50 border-b border-black">
              <tr className="font-bold text-[9.5px] uppercase tracking-tighter h-10">
                <th className="border-r border-black p-1 w-16">Date</th>
                <th className="border-r border-black p-1 w-16">Time (hr:min)</th>
                <th className="border-r border-black p-1 w-20 leading-none">Time since pumping started (min)</th>
                <th className="border-r border-black p-1 w-20 leading-none">Depth to Water Level (mbmp)</th>
                <th className="border-r border-black p-1 w-16">Drawdown (m)</th>
                <th className="border-r border-black p-1 w-16">OBW-1 (mbmp)</th>
                <th className="p-1">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {report?.pumpingData?.map((row, i) => (
                <tr key={i} className="border-b border-black last:border-b-0 h-[18px]">
                  <td className="border-r border-black p-0.5 text-[9px]">{row.date}</td>
                  <td className="border-r border-black p-0.5 text-[9px]">{row.timeHrMin}</td>
                  <td className="border-r border-black p-0.5 text-[10px] font-bold">{row.timeSincePumpingStarted}</td>
                  <td className="border-r border-black p-0.5 text-[10px]">{row.depthToWaterLevel}</td>
                  <td className="border-r border-black p-0.5 text-[10px]">{row.drawdown}</td>
                  <td className="border-r border-black p-0.5 text-[9px]">{row.obw1}</td>
                  <td className="p-0.5 text-[9px] leading-none text-left pl-1 truncate">{row.remarks}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 35 - (report?.pumpingData?.length || 0)) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="border-b border-black last:border-b-0 h-[18px]">
                  <td className="border-r border-black p-0.5"></td>
                  <td className="border-r border-black p-0.5"></td>
                  <td className="border-r border-black p-0.5"></td>
                  <td className="border-r border-black p-0.5"></td>
                  <td className="border-r border-black p-0.5"></td>
                  <td className="border-r border-black p-0.5"></td>
                  <td className="p-0.5"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-1.5 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL TECHNICAL RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function OpenWellPumpingDataReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold text-primary animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}