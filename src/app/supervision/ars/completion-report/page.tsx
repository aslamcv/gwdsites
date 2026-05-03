'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect, useMemo } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  MapPin, 
  Construction, 
  Activity, 
  Info,
  Settings,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const firestore = useFirestore();
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const isDugWellReport = report?.arsSubType === 'ARS_DUG_WELL_RECHARGE';

  useEffect(() => {
    if (report) {
      const prefix = isDugWellReport ? 'ARS-DugWell' : 'ARS-Pit';
      document.title = `${prefix}-Completion-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report, isDugWellReport]);

  const downloadExcel = () => {
    if (!report) return;
    
    const data = [
      ["GROUND WATER DEPARTMENT, MALAPPURAM"],
      [isDugWellReport ? "ARS DUG WELL COMPLETION REPORT" : "ARS PIT COMPLETION REPORT"],
      [],
      ["1. GENERAL DETAILS"],
      ["File No", report.fileNo || ''],
      ["Name of Site", report.nameOfSite || ''],
      ["LSGD/Panchayath", report.lsgd || ''],
      ["Ward No", report.ward || ''],
      ["Contractor", report.nameOfContractor || ''],
      ["Completion Date", report.reportDate || ''],
      [],
      ["2. TECHNICAL COMPONENTS"],
      ["Sl No", "Description", "Quantity", "Unit"],
      ...(report.workComponents?.map((c, i) => [i + 1, c.description, c.quantity, c.unit]) || []),
      [],
      ["3. FIELD OBSERVATIONS"],
      ["Remarks", report.remarks || 'Completed as per departmental specifications.']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completion Report");
    XLSX.writeFile(wb, `${isDugWellReport ? 'ARS-DugWell' : 'ARS-Pit'}-Report-${report.fileNo || 'Export'}.xlsx`);
  };

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[850px] bg-white shadow-xl rounded-none" />
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

  if (isDugWellReport && report) {
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
            <Button onClick={downloadExcel} variant="outline" className="gap-2 font-bold border-slate-300 h-8 text-xs px-4">
              <FileSpreadsheet className="h-3 w-3" />
              Export Excel
            </Button>
            <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs px-6">
              <Printer className="h-3 w-3" />
              Print Report
            </Button>
          </div>
        </div>

        <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[11px] leading-relaxed border border-slate-200 print:border-none overflow-hidden relative">
          <div className="absolute top-10 right-10 text-right uppercase">
            <p className="text-[12px] font-bold text-black leading-none">
              {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'ARS DUG WELL').toUpperCase()}
            </p>
          </div>

          <div className="text-center space-y-1 mb-8 border-b-2 border-slate-900 pb-4">
            <h1 className="text-[16px] font-bold font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
            <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-tight leading-none">ARS DUG WELL COMPLETION REPORT</h2>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">(ARTIFICIAL RECHARGE STRUCTURE)</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase text-[12px]">
                <div className="bg-blue-100 p-1 rounded-full"><Info className="h-3 w-3 text-blue-600" /></div> 1. GENERAL DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-2">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                    <span className="text-slate-500 font-medium">File No:</span>
                    <span className="font-bold uppercase">{report.fileNo || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                    <span className="text-slate-500 font-medium">Name of Site:</span>
                    <span className="font-bold uppercase text-right leading-tight">{report.nameOfSite || '---'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                    <span className="text-slate-500 font-medium">Grama Panchayath:</span>
                    <span className="font-bold uppercase">{report.lsgd || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                    <span className="text-slate-900 font-bold uppercase text-[9.5px]">NAME OF CONTRACTOR :</span>
                    <span className="font-bold uppercase text-right leading-tight">{report.nameOfContractor || '---'}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase text-[12px]">
                <div className="bg-blue-100 p-1 rounded-full"><MapPin className="h-3 w-3 text-blue-600" /></div> 2. LOCATION DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 px-4">
                <div className="flex justify-between border-b border-dotted border-slate-300"><span>Latitude:</span> <span className="font-bold">{report.latitude || '---'}</span></div>
                <div className="flex justify-between border-b border-dotted border-slate-300"><span>Longitude:</span> <span className="font-bold">{report.longitude || '---'}</span></div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase text-[12px]">
                <div className="bg-blue-100 p-1 rounded-full"><Construction className="h-3 w-3 text-blue-600" /></div> 3. STRUCTURE DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 px-4">
                <div className="flex justify-between border-b border-dotted border-slate-300"><span>Diameter of Well (m):</span> <span className="font-bold">{report.diameterOfWell || '---'}</span></div>
                <div className="flex justify-between border-b border-dotted border-slate-300"><span>Total Depth of Well (m):</span> <span className="font-bold">{report.depthOfWell || '---'}</span></div>
              </div>
            </section>
          </div>

          <div className="flex-grow"></div>

          <div className="mt-12 grid grid-cols-3 gap-8 text-[9.5px] text-center font-black pt-4">
            <div className="flex flex-col items-center">
              <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase">{report.staffAssignment?.supervisor || '---'}</div>
              <p className="mt-2">SUPERVISOR</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase">{report.staffAssignment?.assistantEngineer || '---'}</div>
              <p className="mt-2">ASSISTANT ENGINEER</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase"></div>
              <p className="mt-2">DISTRICT OFFICER</p>
            </div>
          </div>

          <div className="mt-10 pt-2 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-black">
            <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
            <span>OFFICIAL COMPLETION RECORD</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 print:bg-white print:p-0 font-sans text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/supervision">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={downloadExcel} variant="outline" className="gap-2 font-bold border-slate-300 h-8 text-xs px-4">
            <FileSpreadsheet className="h-3 w-3" />
            Export Excel
          </Button>
          <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs px-6">
            <Printer className="h-3 w-3" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[11px] border border-slate-200 print:border-none overflow-hidden relative">
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'ARS PIT').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
          <h1 className="text-[16px] font-bold font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-wide">ARS PIT COMPLETION REPORT</h2>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase">(Artificial Recharge Structure)</h3>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6 font-bold uppercase text-[9.5px] text-left">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
              <span className="text-slate-500">File No:</span>
              <span className="text-slate-900">{report?.fileNo || '---'}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
              <span className="text-slate-500">Grama Panchayath:</span>
              <span className="text-slate-900">{report?.lsgd || '---'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
              <span className="text-slate-500">Date of Completion:</span>
              <span className="text-slate-900">{report?.reportDate}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
              <span className="text-slate-500">Total Cost (INR):</span>
              <span className="text-slate-900">₹ {report?.totalCost || '---'}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ClipboardList className="h-3 w-3" /> Technical Observations & Remarks
          </h4>
          <p className="italic text-slate-700 leading-relaxed text-[10.5px] uppercase font-bold text-justify">
            {report?.remarks || 'THE ARS CONSTRUCTION WORK HAS BEEN CARRIED OUT AS PER DEPARTMENTAL REQUIREMENTS.'}
          </p>
        </div>

        <div className="flex-grow"></div>

        <div className="grid grid-cols-3 gap-8 text-[9px] text-center font-black pt-4">
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.supervisor || '---'}</div>
            <p className="mt-2 uppercase">SUPERVISOR</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.assistantEngineer || '---'}</div>
            <p className="mt-2 uppercase">ASSISTANT ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-900 flex items-end justify-center pb-1 uppercase">---</div>
            <p className="mt-2 uppercase">DISTRICT OFFICER</p>
          </div>
        </div>

        <div className="mt-8 pt-2 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-black">
          <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
          <span>OFFICIAL COMPLETION RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function ARSCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold text-primary animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}