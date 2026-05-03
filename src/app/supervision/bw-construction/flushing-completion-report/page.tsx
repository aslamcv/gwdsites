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
  const firestore = useFirestore();
  const id = searchParams.get('id');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  useEffect(() => {
    if (report) {
      document.title = `BWF-Completion-${report.fileNo || report.id.slice(0,6)}.pdf`;
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
        <h1 className="text-xl font-bold text-slate-800">Supervision Record Not Found</h1>
        <Button asChild className="mt-6">
          <Link href="/supervision">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  const technicalRows = [
    { label: '1) ഫയൽ നമ്പർ', value: report?.fileNo },
    { label: '2) റിഗ്ഗിന്റെ പേര്', value: 'PRIVATE RIG', isStatic: true },
    { label: '3) കുഴൽ കിണറിന്റെ വ്യാസം', value: report?.borewellSize },
    { label: '4) സൈറ്റിന്റെ പേര്', value: report?.nameOfSite || report?.applicantName, upper: true },
    { label: '5) പഞ്ചായത്ത് / നഗരസഭ', value: report?.lsgd, upper: true },
    { label: '6) ആകെ ഫ്ലഷ് ചെയ്ത ആഴം', value: report?.totalDepth ? `${report.totalDepth} m` : '' },
    { label: '7) ഓവർബർഡൻ (OB)', value: report?.overburden ? `${report.overburden} m` : '' },
    { label: '8) ഏകദേശ ഫ്ലഷിംഗ് സമയത്തെ ജല ലഭ്യത (Yield)', value: report?.discharge ? `${report.discharge} LPH` : '' },
    { label: '9) സ്ഥിര ജലനിരപ്പ് (Static water level)', value: report?.waterLevel ? `${report.waterLevel} m` : '' },
    { label: '10) പ്രവർത്തിയുടെ കാലയളവ്', value: report?.dateOfInvestigation },
    { label: '11) കംപ്രസ്സർ പ്രവർത്തിച്ച സമയം', value: report?.compressorWorkingHour },
    { label: '12) കോൺട്രാക്ടറുടെ പേര്', value: report?.nameOfContractor, upper: true },
  ];

  const staff = report?.staffAssignment;

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/supervision">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[12.5px] leading-[1.4] border border-slate-200 print:border-none overflow-hidden relative">
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'FLUSHING').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-8">
          <h1 className="text-[18px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[18px] font-bold underline underline-offset-4 decoration-2 uppercase">കുഴൽ കിണർ ഫ്ലഷിംഗ് പൂർത്തീകരണ റിപ്പോർട്ട്</h2>
        </div>

        <div className="space-y-2 mb-8 text-left">
          {technicalRows.map((row, idx) => (
            <div key={idx} className="flex items-baseline">
              <span className="min-w-[320px] font-medium">{row.label} :</span>
              <span className={cn("font-bold ml-2", row.upper && "uppercase")}>{row.value || ''}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 text-left">
          <p><span className="font-bold">റിമാർക്സ് :</span> <span className="font-bold uppercase ml-2">{report?.remarks || 'NIL'}</span></p>
        </div>

        <div className="flex-grow"></div>

        <div className="grid grid-cols-4 gap-4 text-[10px] text-center font-black pt-2">
          <div className="flex flex-col items-center">
            <div className="h-12 font-bold flex items-end justify-center pb-1 uppercase">{staff?.supervisor}</div>
            <div className="w-full border-t border-black"></div>
            <p className="uppercase mt-1">SUPERVISOR</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 font-bold flex items-end justify-center pb-1 uppercase">{staff?.assistantEngineer}</div>
            <div className="w-full border-t border-black"></div>
            <p className="uppercase mt-1">ASSISTANT<br />ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 font-bold flex items-end justify-center pb-1 uppercase">{staff?.assistantExecutiveEngineer}</div>
            <div className="w-full border-t border-black"></div>
            <p className="uppercase mt-1">ASSISTANT EXECUTIVE<br />ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 font-bold flex items-end justify-center pb-1 uppercase"></div>
            <div className="w-full border-t border-black"></div>
            <p className="uppercase mt-1">DISTRICT<br />OFFICER</p>
          </div>
        </div>

        <div className="mt-6 text-[8px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
          <span>OFFICIAL FLUSHING RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function BWFCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}