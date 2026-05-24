'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';

function ReportContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const id = searchParams.get('id');
  const [currentDate, setCurrentDate] = useState('');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const data = useMemo(() => {
    if (report) {
      return {
        fileNo: report.fileNo || '',
        wellNumber: report.wellNumber || '',
        borewellSize: report.borewellSize || '',
        nameOfSite: report.nameOfSite || report.applicantName || '',
        lsgd: report.lsgd || '',
        totalDepth: report.totalDepth || '',
        overburden: report.overburden || '',
        discharge: report.discharge || '0',
        waterLevel: report.waterLevel || '0',
        workStart: formatToTechnicalDate(report.dateOfInvestigation?.split(' - ')[0]),
        workEnd: formatToTechnicalDate(report.dateOfInvestigation?.split(' - ')[1]),
        compressorWorkingHour: report.compressorWorkingHour || '',
        remarks: report.remarks || '',
        observations: report.observations || '',
        purpose: report.purpose || 'Well Flushing / Private / Drinking',
        sector: report.sector || 'PRIVATE',
        category: report.category || 'FLUSHING',
        staff: report.staffAssignment || {}
      };
    }
    return null;
  }, [report]);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'dd-MM-yyyy, HH:mm:ss'));
    if (report?.fileNo) {
      document.title = `Flushing-Report-${report.fileNo}`;
    }
  }, [report]);

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!data) return null;

  const technicalData = [
    { label: '1) ഫയൽ നമ്പർ', value: data.fileNo },
    { label: '2) കുഴൽ കിണറിന്റെ വ്യാസം', value: data.borewellSize },
    { label: '3) സൈറ്റിന്റെ പേര്', value: data.nameOfSite, upper: true },
    { label: '4) പഞ്ചായത്ത്/നഗരസഭ', value: data.lsgd, upper: true },
    { label: '5) ആകെ ഫ്ലഷ് ചെയ്ത ആഴം', value: `${data.totalDepth} m` },
    { label: '6) ഓവർബർഡൻ (OB)', value: `${data.overburden} m` },
    { label: '7) ഏകദേശ ജല ലഭ്യത (Yield)', value: `${data.discharge} LPH` },
    { label: '8) സ്ഥിര ജലനിരപ്പ് (SWL)', value: `${data.waterLevel} m` },
    { label: '9) പ്രവർത്തന കാലയളവ്', value: data.workStart },
    { label: '10) കംപ്രസ്സർ പ്രവർത്തിച്ച സമയം', value: data.compressorWorkingHour },
    { label: '11) റിമാർക്സ്', value: data.remarks, upper: true },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/well-drilling">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[12px] leading-tight text-black border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="absolute top-10 left-10 text-left">
          <p className="text-[12px] font-black text-black leading-none">
            ({data.wellNumber || '12'})
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">{currentDate}</p>
        </div>

        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {data.sector.toUpperCase()}/WELL FLUSHING
          </p>
        </div>

        <div className="text-center space-y-1 mb-8 pt-6">
          <h1 className="text-[16px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം.</h1>
          <h2 className="text-[14px] font-bold">കുഴൽ കിണർ ഫ്ലഷിംഗ് പൂർത്തീകരണ റിപ്പോർട്ട്</h2>
          <p className="text-[10px] text-slate-600 font-bold">വകുപ്പ് വാഹനം (SKE DTH റിഗ്) ഉപയോഗിച്ച് നടത്തിയ കുഴൽ കിണർ ഫ്ലഷിംഗ് പ്രവർത്തി</p>
        </div>

        <div className="space-y-1.5 mb-8 px-4 text-left">
          {technicalData.map((item, index) => (
            <div key={index} className="flex items-baseline border-b border-slate-50 pb-0.5">
              <span className="font-bold text-slate-700 min-w-[280px]">{item.label} :</span>
              <span className={cn("font-black text-slate-900 ml-2", item.upper && "uppercase")}>
                {item.value || '--'}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-10 px-4 text-left">
          <h3 className="font-black uppercase text-[11px] mb-2 underline">Field Observations & Remarks:</h3>
          <p className="italic leading-normal text-justify text-[11px] border-l-2 border-slate-200 pl-4 py-1 uppercase font-bold">
            {data.observations || 'No additional observations recorded.'}
          </p>
        </div>

        <div className="mt-auto pb-6">
          <div className="grid grid-cols-4 gap-4 text-[9px] text-center font-bold">
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-black uppercase text-[10px]">
                ({data.staff.unitInCharge || 'UNIT IN CHARGE'})
              </div>
              <p className="w-full border-t border-black pt-1 uppercase leading-tight font-black">Unit In-Charge<br/>(SKE DTH RIG)</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <p className="w-full border-t border-black pt-1 uppercase font-black">Assistant<br/>Engineer</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <p className="w-full border-t border-black pt-1 uppercase font-black">Asst. Executive<br/>Engineer</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <p className="w-full border-t border-black pt-1 uppercase font-black">District<br/>Officer</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between text-[8px] text-muted-foreground uppercase tracking-widest font-sans font-black">
            <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
            <span>OFFICIAL TECHNICAL COMPLETION RECORD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlushingCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold animate-pulse">Loading technical data...</div>}>
      <ReportContent />
    </Suspense>
  );
}
