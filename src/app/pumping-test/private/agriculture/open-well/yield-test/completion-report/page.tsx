'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
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
      document.title = `YT-Completion-OW-${report.fileNo || report.id.slice(0,6)}.pdf`;
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
          <Link href="/pumping-test">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  const tableData = [
    { label: 'Date of work', value: report?.reportDate },
    { label: 'Type of well', value: report?.typeOfWell || 'Open Well' },
    { label: 'Dia of the well (cm)', value: report?.diameterOfWell },
    { label: 'Depth of the well (m)', value: report?.depthOfWell },
    { label: 'Type of Pump', value: report?.typeOfPump },
    { label: 'Pump Capacity (HP)', value: report?.pumpCapacity },
    { label: 'Diameter of Pump (mm)', value: report?.diameterOfPump },
    { label: 'Diameter of Pumping line (mm)', value: report?.diameterOfPumpingLine },
    { label: 'Diameter of delivary pipe (mm)', value: report?.diameterOfDeliveryPipe },
    { label: 'Height of Measuring Point (magl)', value: report?.measuringPointHt },
    { label: 'Static Water Level (mbmp)', value: report?.staticWaterLevel },
    { label: 'Maximum Drawdown (mbmp)', value: report?.maxDrawdown },
    { label: 'Length of rods installed (mbgl)', value: report?.lengthOfRodsInstalled },
    { label: 'Pump set at (mbgl)', value: report?.pumpSetAt },
    { label: 'Initial Discharge (lpm)', value: report?.initialDischarge },
    { label: 'Final Discharge (lpm)', value: report?.finalDischarge },
    { label: 'Compressor started at', value: report?.compressorStartedAt },
    { label: 'Compressor stopped at', value: report?.compressorStoppedAt },
    { label: 'Duration of Pumping (min)', value: report?.periodPumped },
  ];

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

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[12px] leading-relaxed border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report?.sector || 'PRIVATE').toUpperCase()}/{(report?.category || 'OPEN WELL').toUpperCase()}
          </p>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="w-[180px]"></div>
          <div className="text-center flex-1 space-y-0.5">
            <h1 className="text-[16px] font-bold font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
            <h2 className="text-[12px] font-bold uppercase underline underline-offset-4">YIELD TESTING OF WELLS</h2>
            <h3 className="text-[12px] font-bold uppercase">WORK COMPLETION REPORT</h3>
          </div>
          <div className="w-[180px]"></div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6 text-left">
          <div className="space-y-2">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-bold text-slate-500">Location :</span>
              <span className="font-bold uppercase">= {report?.nameOfSite}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-bold text-slate-500">Address :</span>
              <span className="font-bold uppercase">= {report?.address}</span>
            </div>
            <div className="h-4"></div>
            <div className="grid grid-cols-[180px_1fr] gap-2">
              <span className="font-bold text-slate-500 text-[9px]">Panchayath/Municipality/Corporation :</span>
              <span className="font-bold uppercase">= {report?.lsgd}</span>
            </div>
            <div className="grid grid-cols-[180px_1fr] gap-2">
              <span className="font-bold text-slate-500">District :</span>
              <span className="font-bold uppercase">= {report?.district}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2 text-right">
            <div className="flex items-center justify-end gap-4">
              <span className="font-bold w-24">Latitude:</span>
              <span className="font-medium">{report?.latitude}</span>
            </div>
            <div className="flex items-center justify-end gap-4">
              <span className="font-bold w-24">Longitude:</span>
              <span className="font-medium">{report?.longitude}</span>
            </div>
          </div>
        </div>

        <div className="border border-black flex-grow overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} className="border-b border-black last:border-b-0 h-[22px]">
                  <td className="border-r border-black p-1 pl-3 font-medium text-[10px] w-1/2">{row.label}</td>
                  <td className="p-1 pl-4 font-bold text-[10px] uppercase truncate">{row.value || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <p className="font-bold text-slate-500 text-[10px] mb-1">Remarks</p>
          <div className="border border-black p-3 min-h-[80px] text-[10px] leading-relaxed uppercase font-bold italic">
            {report?.remarks || 'NIL'}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-4 gap-4 text-[9px] text-center font-black">
          <div className="flex flex-col items-center">
            <div className="h-12"></div>
            <p className="uppercase">UNIT IN-CHARGE<br />(PT UNIT)</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12"></div>
            <p className="uppercase">ASSISTANT<br />ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12"></div>
            <p className="uppercase">ASSISTANT EXECUTIVE<br />ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12"></div>
            <p className="uppercase">DISTRICT OFFICER</p>
          </div>
        </div>

        <div className="mt-6 pt-1.5 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL WORK COMPLETION RECORD - FORM YT-IV</span>
        </div>

      </div>
    </div>
  );
}

export default function YTCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold text-primary animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}