
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';

function ReportContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const id = searchParams.get('id');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport, isLoading: isReportLoading } = useDoc<GroundwaterReport>(reportRef);

  useEffect(() => {
    if (cloudReport?.fileNo) {
      document.title = `Completion-Report-${cloudReport.fileNo}`;
    }
  }, [cloudReport?.fileNo]);

  const data = useMemo(() => {
    if (cloudReport) {
      const totalPvcValue = (parseFloat(cloudReport.pvc6kg || '0') || 0) + (parseFloat(cloudReport.pvc10kg || '0') || 0);
      
      return {
        ...cloudReport,
        totalPvc: totalPvcValue.toFixed(2),
        reportDateFormatted: formatToTechnicalDate(cloudReport.reportDate || cloudReport.createdAt?.split('T')[0]),
        investigationDateFormatted: formatToTechnicalDate(cloudReport.dateOfInvestigation?.split(' - ')[0])
      };
    }
    return null;
  }, [cloudReport]);

  if (isReportLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-left">
      <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Record Not Found</h1>
      <Button asChild className="mt-8 px-10 rounded-xl font-bold uppercase text-xs h-12">
        <Link href="/well-drilling">Back to Portal</Link>
      </Button>
    </div>
  );

  const technicalRows = [
    { label: '1) ഫയൽ നമ്പർ', value: data.fileNo },
    { label: '2) റിഗ്ഗിന്റെ പേര്', value: 'SKE DTH RIG Unit (Department Rig)' },
    { label: '3) കുഴൽ കിണറിന്റെ വ്യാസം', value: data.borewellSize },
    { label: '4) സൈറ്റിന്റെ പേര്', value: data.nameOfSite || data.applicantName, upper: true },
    { label: '5) പഞ്ചായത്ത് / നഗരസഭ', value: data.lsgd, upper: true },
    { label: '6) ആകെ കുഴിച്ച ആഴം', value: data.totalDepth ? `${data.totalDepth} m` : '' },
    { label: '7) overburden കുഴിച്ചത്', value: data.overburden ? `${data.overburden} m` : '' },
    { label: '8) 140 mm 6 kg/cm², PVC പൈപ്പ് ഉപയോഗിച്ചത്', value: data.pvc6kg ? `${data.pvc6kg} m` : '' },
    { label: '9) 140 mm 10 kg/cm², PVC പൈപ്പ് ഉപയോഗിച്ചത്', value: data.pvc10kg ? `${data.pvc10kg} m` : '' },
    { label: '10) ആകെ PVC പൈപ്പ് ഉപയോഗിച്ചത്', value: `${data.totalPvc} m`, boldUnderline: true },
    { label: '11) ഏകദേശ ഡ്രില്ലിംഗ് സമയത്തെ ജല ലഭ്യത (Yield)', value: data.discharge ? `${data.discharge} LPH` : '' },
    { label: '12) ജലധാര മേഖലയുടെ വിവരങ്ങൾ (Zones)', value: data.zoneDepth ? `${data.zoneDepth} m` : '' },
    { label: '13) സ്ഥിര ജലനിരപ്പ് (Static water level)', value: data.waterLevel ? `${data.waterLevel} m` : '' },
    { label: '14) പ്രവൃത്തിയുടെ കാലയളവ്', value: data.investigationDateFormatted },
  ];

  return (
    <div className="min-h-screen bg-slate-100/50 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black text-left text-[12px]">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/well-drilling">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs px-6">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[12px] leading-tight text-black border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="absolute top-10 left-10 text-left uppercase">
          <p className="text-[13px] font-black text-black leading-none">
            (SKE/240)
          </p>
        </div>

        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(data.sector || 'PRIVATE').toUpperCase()}/WELL DRILLING
          </p>
        </div>

        <div className="text-center space-y-1 mb-8 pt-6">
          <h1 className="text-[16px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം.</h1>
          <h2 className="text-[16px] font-bold underline underline-offset-4 decoration-2 uppercase">കുഴൽ കിണർ പൂർത്തീകരണ റിപ്പോർട്ട്</h2>
        </div>

        <div className="space-y-2 mb-8 px-4">
          {technicalRows.map((item, index) => (
            <div key={index} className="flex items-baseline">
              <span className={cn("min-w-[240px] font-medium", item.boldUnderline && "font-bold underline underline-offset-2")}>
                {item.label} :
              </span>
              <span className={cn("font-bold ml-1", item.upper && "uppercase", item.boldUnderline && "underline underline-offset-2")}>
                {item.value || '--'}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4 px-4">
          <p><span className="font-bold">റിമാർക്സ് :</span> <span className="font-bold uppercase ml-1">{data.remarks || 'NIL'}</span></p>
        </div>

        <div className="space-y-1 mb-8 px-4">
          <h3 className="font-bold underline underline-offset-4 text-[13px]">Field Observations & Remarks:</h3>
          <p className="italic leading-normal text-justify whitespace-pre-wrap uppercase font-bold text-slate-700">{data.observations || 'WORK EXECUTED ACCORDING TO DEPARTMENTAL STANDARDS. YIELD RECORDED DURING CONSTRUCTION.'}</p>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-4 gap-4 text-[9.5px] text-center font-black pb-8">
            <div className="flex flex-col items-center">
              <div className="h-10 flex items-end justify-center font-black uppercase text-[10.5px]">({(typeof data.staffAssignment?.unitInCharge === 'string' ? data.staffAssignment.unitInCharge : (Array.isArray(data.staffAssignment?.unitInCharge) ? data.staffAssignment.unitInCharge[0] : '')) || '---'})</div>
              <div className="w-full border-t border-black pt-2 uppercase leading-tight">Unit In-Charge<br/>(SKE DTH RIG UNIT)</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <div className="w-full border-t border-black pt-2 uppercase leading-tight">Assistant<br/>Engineer</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <div className="w-full border-t border-black pt-2 uppercase leading-tight">Assistant Executive<br/>Engineer</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-10"></div>
              <div className="w-full border-t border-black pt-2 uppercase leading-tight">District<br/>Officer</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between text-[8px] text-muted-foreground uppercase tracking-widest font-sans font-black">
            <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
            <span>OFFICIAL TECHNICAL COMPLETION RECORD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
