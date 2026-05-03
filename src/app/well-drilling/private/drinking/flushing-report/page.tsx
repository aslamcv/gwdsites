
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
        workStart: report.dateOfInvestigation?.split(' - ')[0] || '',
        workEnd: report.dateOfInvestigation?.split(' - ')[1] || '',
        compressorWorkingHour: report.compressorWorkingHour || '',
        remarks: report.remarks || '',
        observations: report.observations || '',
        purpose: report.purpose || 'Well Flushing / Private / Drinking',
        sector: report.sector || 'PRIVATE',
        category: report.category || 'FLUSHING',
        staff: report.staffAssignment || {}
      };
    }
    return {
        fileNo: '',
        wellNumber: '',
        borewellSize: '',
        nameOfSite: '',
        lsgd: '',
        totalDepth: '',
        overburden: '',
        discharge: '0',
        waterLevel: '0',
        workStart: '',
        workEnd: '',
        compressorWorkingHour: '',
        remarks: '',
        observations: '',
        purpose: 'Well Flushing / Private / Drinking',
        sector: 'PRIVATE',
        category: 'FLUSHING',
        staff: {}
    };
  }, [report]);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'dd/MM/yyyy, HH:mm:ss'));
    if (report?.fileNo) {
      document.title = `Flushing-Report-${report.fileNo}`;
    }
  }, [report]);

  const technicalData = [
    { label: '1) ഫയൽ നമ്പർ', value: data.fileNo },
    { label: '2) കുഴൽ കിണറിന്റെ വ്യാസം', value: data.borewellSize },
    { label: '3) സൈറ്റിന്റെ പേര്', value: data.nameOfSite, upper: true },
    { label: '4) പഞ്ചായത്ത്/നഗരസഭ', value: data.lsgd, upper: true },
    { label: '5) ആകെ ഫ്ലഷ് ചെയ്ത ആഴം', value: `${data.totalDepth} m` },
    { label: '6) ഓവർബർഡൻ (OB)', value: `${data.overburden} m` },
    { label: '7) ഏകദേശ ജല ലഭ്യത (Yield)', value: `${data.discharge} LPH` },
    { label: '8) സ്ഥിര ജലനിരപ്പ് (SWL)', value: `${data.waterLevel} m` },
    { label: '9) പ്രവർത്തന കാലയളവ്', value: `${data.workStart} ${data.workEnd ? '- ' + data.workEnd : ''}` },
    { label: '10) കംപ്രസ്സർ പ്രവർത്തിച്ച സമയം', value: data.compressorWorkingHour },
    { label: '11) റിമാർക്സ്', value: data.remarks, upper: true },
  ];

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-container {
            width: 100%;
            height: auto;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
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

        <div className="report-container bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[12px] leading-tight text-black border border-slate-200 print:border-none overflow-hidden relative">
          
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

          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
            <div className="text-[9px] font-bold text-slate-500 w-1/3 text-left">{currentDate}</div>
            <div className="text-center w-1/3">
              <h2 className="text-[13px] font-bold underline underline-offset-4 invisible">Flushing Report – {data.fileNo}</h2>
            </div>
            <div className="text-right w-1/3"></div>
          </div>
          
          <div className="text-center space-y-0.5 mb-4">
            <h1 className="text-[15px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം.</h1>
            <h2 className="text-[12px] font-bold">കുഴൽ കിണർ ഫ്ലഷിംഗ് പൂർത്തീകരണ റിപ്പോർട്ട്</h2>
            <p className="text-[10px] text-slate-600">വകുപ്പ് വാഹനം (SKE DTH റിഗ്) ഉപയോഗിച്ച് നടത്തിയ കുഴൽ കിണർ ഫ്ലഷിംഗ് പ്രവർത്തി</p>
          </div>

          <div className="space-y-1.5 mb-4 px-2 text-left">
            {technicalData.map((item, index) => (
              <div key={index} className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="font-medium text-slate-700">{item.label} :</span>
                <span className={cn("font-bold text-right", item.upper && "uppercase")}>
                  {item.value || '--'}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-4 px-2 text-left">
            <h3 className="font-bold underline underline-offset-4 text-[11px] mb-1">Field Observations & Remarks:</h3>
            <p className="italic leading-snug text-justify text-[11px]">
              {data.observations || 'No additional observations recorded.'}
            </p>
          </div>

          <div className="mt-12 pb-2">
            <div className="grid grid-cols-4 gap-2 text-[8px] text-center font-bold mb-4">
              <div className="flex flex-col items-center">
                <div className="h-10 flex items-end justify-center font-black uppercase text-[10px]">
                  ({data.staff.unitInCharge || 'UNIT IN CHARGE'})
                </div>
                <p className="w-full border-t border-black pt-1 uppercase">Unit In-Charge<br/>(SKE DTH RIG)</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <p className="w-full border-t border-black pt-1 uppercase">Assistant<br/>Engineer</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <p className="w-full border-t border-black pt-1 uppercase">Asst. Executive<br/>Engineer</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10"></div>
                <p className="w-full border-t border-black pt-1 uppercase">District<br/>Officer</p>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200 text-[8px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-bold">
              <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
              <span>SYSTEM GENERATED TECHNICAL RECORD</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FlushingCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold animate-pulse">Loading technical data...</div>}>
      <ReportContent />
    </Suspense>
  );
}
