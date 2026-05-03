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

function ReportContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const id = searchParams.get('id');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: cloudReport, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const data = useMemo(() => {
    if (cloudReport) {
      return {
        fileNo: cloudReport.fileNo || '',
        wellNumber: cloudReport.wellNumber || '',
        borewellSize: cloudReport.borewellSize || '',
        nameOfSite: cloudReport.nameOfSite || cloudReport.applicantName || '',
        lsgd: cloudReport.lsgd || '',
        totalDepth: cloudReport.totalDepth || '',
        overburden: cloudReport.overburden || '',
        pvc6kg: cloudReport.pvc6kg || '0',
        pvc10kg: cloudReport.pvc10kg || '0',
        discharge: cloudReport.discharge || '0',
        zoneDepth: cloudReport.zoneDepth || '0',
        waterLevel: cloudReport.waterLevel || '0',
        workStart: cloudReport.dateOfInvestigation?.split(' - ')[0] || '',
        workEnd: cloudReport.dateOfInvestigation?.split(' - ')[1] || '',
        remarks: cloudReport.remarks || '',
        observations: cloudReport.observations || '',
        purpose: cloudReport.purpose || 'Well Drilling / Private / Drinking',
        sector: cloudReport.sector || 'PRIVATE',
        category: cloudReport.category || 'DRINKING',
        staff: cloudReport.staffAssignment || {}
      };
    }
    return {
      fileNo: searchParams.get('fileNo') || '',
      wellNumber: searchParams.get('wellNumber') || '',
      borewellSize: searchParams.get('borewellSize') || '',
      nameOfSite: searchParams.get('nameOfSite') || '',
      lsgd: searchParams.get('lsgd') || '',
      totalDepth: searchParams.get('totalDepth') || '',
      overburden: searchParams.get('overburden') || '',
      pvc6kg: searchParams.get('pvc6kg') || '0',
      pvc10kg: searchParams.get('pvc10kg') || '0',
      discharge: searchParams.get('discharge') || '0',
      zoneDepth: searchParams.get('zoneDepth') || '0',
      waterLevel: searchParams.get('waterLevel') || '0',
      workStart: searchParams.get('workStart') || '',
      workEnd: searchParams.get('workEnd') || '',
      remarks: searchParams.get('remarks') || '',
      observations: searchParams.get('observations') || '',
      purpose: searchParams.get('purpose') || 'Well Drilling / Private / Drinking',
      sector: searchParams.get('sector') || 'PRIVATE',
      category: searchParams.get('category') || 'DRINKING',
      staff: {}
    };
  }, [cloudReport, searchParams]);

  useEffect(() => {
    if (data.fileNo) {
      document.title = `Completion-Report-${data.fileNo}`;
    }
  }, [data.fileNo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  const totalPvcValue = (parseFloat(data.pvc6kg) || 0) + (parseFloat(data.pvc10kg) || 0);

  return (
    <div className="min-h-screen bg-slate-100/50 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
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

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[12px] leading-tight text-black border border-slate-200 print:border-none overflow-hidden relative">
        
        <div className="absolute top-10 left-10 text-left uppercase">
          <p className="text-[12px] font-black text-black leading-none">
            ({data.wellNumber || 'WELL NUMBER'})
          </p>
        </div>

        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {data.sector.toUpperCase()}/{data.category.toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-6">
          <h1 className="text-[16px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം.</h1>
          <h2 className="text-[16px] font-bold underline underline-offset-4 decoration-2 uppercase">കുഴൽ കിണർ പൂർത്തീകരണ റിപ്പോർട്ട്</h2>
        </div>

        <div className="space-y-1.5 mb-6 text-left">
          {[
            { label: '1) ഫയൽ നമ്പർ :', value: data.fileNo },
            { label: '2) റിഗ്ഗിന്റെ പേര് :', value: 'SKE DTH RIG Unit (Department Rig)' },
            { label: '3) കുഴൽ കിണറിന്റെ വ്യാസം :', value: data.borewellSize },
            { label: '4) സൈറ്റിന്റെ പേര് :', value: data.nameOfSite, upper: true },
            { label: '5) പഞ്ചായത്ത് / നഗരസഭ :', value: data.lsgd, upper: true },
            { label: '6) ആകെ കുഴിച്ച ആഴം :', value: `${data.totalDepth} m` },
            { label: '7) overburden കുഴിച്ചത് :', value: `${data.overburden} m` },
            { label: '8) 140 mm 6 kg/cm², PVC പൈപ്പ് ഉപയോഗിച്ചത് :', value: `${data.pvc6kg} m` },
            { label: '9) 140 mm 10 kg/cm², PVC പൈപ്പ് ഉപയോഗിച്ചത് :', value: `${data.pvc10kg} m` },
            { label: '10) ആകെ PVC പൈപ്പ് ഉപയോഗിച്ചത് :', value: `${totalPvcValue.toFixed(2)} m`, boldUnderline: true },
            { label: '11) ഏകദേശ ഡ്രില്ലിംഗ് സമയത്തെ ജല ലഭ്യത (Yield) :', value: `${data.discharge} LPH` },
            { label: '12) ജലധാര മേഖലയുടെ വിവരങ്ങൾ (Zones) :', value: `${data.zoneDepth} m` },
            { label: '13) സ്ഥിര ജലനിരപ്പ് (Static water level) :', value: `${data.waterLevel} m` },
            { label: '14) പ്രവൃത്തിയുടെ കാലയളവ് :', value: `${data.workStart} ${data.workEnd ? '- ' + data.workEnd : ''}` },
          ].map((item, index) => (
            <div key={index} className={cn("grid grid-cols-[300px_1fr] gap-x-2 items-center")}>
              <span className={cn(item.boldUnderline && "font-bold underline underline-offset-2")}>{item.label}</span>
              <span className={cn("font-bold", item.upper && "uppercase", item.boldUnderline && "underline underline-offset-2")}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mb-4 text-left">
          <p><span className="font-bold">റിമാർക്സ് :</span> <span className="font-bold uppercase">{data.remarks || 'NIL'}</span></p>
        </div>

        <div className="space-y-1 mb-8 text-left">
          <h3 className="font-bold underline underline-offset-4 text-[13px]">Field Observations & Remarks:</h3>
          <p className="italic leading-normal text-justify whitespace-pre-wrap">{data.observations || 'No additional observations recorded.'}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 text-[9px] text-center font-bold pb-6">
          <div className="flex flex-col items-center">
            <div className="h-10 flex items-end justify-center font-black uppercase text-[10px]">
              ({data.staff.unitInCharge || 'UNIT IN CHARGE'})
            </div>
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

        <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL TECHNICAL COMPLETION RECORD</span>
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