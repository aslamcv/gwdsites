'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect, useMemo } from 'react';
import { Printer, ArrowLeft, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

function ReportContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const id = searchParams.get('id');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  const isReno = report?.purpose?.toLowerCase().includes('reno');

  useEffect(() => {
    if (report) {
      const type = isReno ? 'MWSS-Reno' : 'MWSS';
      document.title = `${type}-Completion-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report, isReno]);

  const technicalItems = useMemo(() => {
    if (isReno) {
      return [
        { label: 'Repair / Replacement of Submersible Pump', value: report?.pumpRepair, unit: 'No.' },
        { label: 'Replacement of Cable (mm)', value: report?.cableReplacement, unit: 'm' },
        { label: 'Replacement of UPVC Pipe (mm)', value: report?.upvcReplacement, unit: 'm' },
        { label: 'Repair of Distribution Line', value: report?.distLineTrenchRepair, unit: 'm' },
      ];
    }
    return [
      { label: '3HP Submersible Pump', value: report?.pump3hp, unit: 'No.' },
      { label: '4mm Cable', value: report?.cable4mm, unit: 'm' },
      { label: '50mm UPVC Pipe', value: report?.upvc50mm, unit: 'm' },
      { label: 'Water Tank', value: report?.tank, unit: 'Ltr' },
    ];
  }, [isReno, report]);

  const staff = report?.staffAssignment;

  const downloadExcel = () => {
    if (!report) return;
    const data = [
        ["MWSS COMPLETION REPORT"],
        ["Location", `${report.nameOfSite}, ${report.lsgd}`],
        ["File No", report.fileNo || '---'],
        ["Date", report.reportDate],
        [],
        ["Sl No", "Description", "Quantity", "Unit"],
        ...technicalItems.map((item, i) => [i + 1, item.label, item.value || '0', item.unit])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completion");
    XLSX.writeFile(wb, `MWSS-Report-${report.fileNo || 'Export'}.xlsx`);
  };

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
           <Button onClick={downloadExcel} variant="outline" className="gap-2 font-bold border-slate-300 h-8 text-xs">
            <FileSpreadsheet className="h-3 w-3" />
            Export Excel
          </Button>
          <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs">
            <Printer className="h-3 w-3" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[11px] leading-tight border border-slate-200 print:border-none overflow-hidden relative">
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'MWSS').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-6 border-b-2 border-[#1e3a8a] pb-4">
          <h1 className="text-[18px] font-black text-[#1e3a8a] uppercase tracking-wide">GROUND WATER DEPARTMENT</h1>
          <h2 className="text-[14px] font-bold text-slate-600 uppercase">DISTRICT OFFICE, MALAPPURAM</h2>
          <div className="h-4"></div>
          <h3 className="text-[16px] font-black text-[#1e3a8a] underline underline-offset-8">
            {isReno ? 'MWSS RENO COMPLETION REPORT' : 'MWSS COMPLETION REPORT'}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-8 mb-6 font-bold text-left">
          <div className="space-y-2">
            <div className="flex gap-2"><span className="text-slate-500 w-32 shrink-0">Location:</span><span className="uppercase">{report?.nameOfSite}, {report?.lsgd}</span></div>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-2"><span className="text-slate-500">File No:</span><span className="uppercase">{report?.fileNo || '---'}</span></div>
            <div className="flex justify-end gap-2"><span className="text-slate-500">Date:</span><span>{report?.reportDate}</span></div>
          </div>
        </div>

        <div className="border border-slate-300 flex-grow rounded-lg overflow-hidden text-left">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-[#f1f5f9] border-b border-slate-300">
              <tr className="h-10 text-[10px] font-black uppercase text-[#1e3a8a]">
                <th className="w-12 border-r border-slate-300 text-center">Sl.No</th>
                <th className="border-r border-slate-300 px-4">Description of Item</th>
                <th className="w-20 border-r border-slate-300 text-center">Qty</th>
                <th className="w-20 text-center">Unit</th>
              </tr>
            </thead>
            <tbody>
              {technicalItems.map((item, i) => (
                <tr key={i} className="border-b border-slate-200 h-[22px]">
                  <td className="border-r border-slate-300 text-center font-medium">{i + 1}</td>
                  <td className="border-r border-slate-300 px-4 font-bold text-[10px]">{item.label}</td>
                  <td className="border-r border-slate-300 text-center font-black text-[10px]">{item.value || '---'}</td>
                  <td className="text-center font-medium text-slate-500 uppercase text-[9px]">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
          <h4 className="font-black text-[#1e3a8a] text-[10px] uppercase mb-2">Technical Remarks</h4>
          <p className="italic text-slate-600 leading-relaxed text-[10.5px]">
            {report?.observations || 'Work completed successfully as per departmental standards.'}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-8 text-[9px] text-center font-black pt-4">
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-300 flex items-end justify-center pb-1 uppercase">{staff?.supervisor || '---'}</div>
            <p className="mt-2 uppercase">PREPARED BY</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-300 flex items-end justify-center pb-1 uppercase">{staff?.assistantEngineer || '---'}</div>
            <p className="mt-2 uppercase">VERIFIED BY</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full border-b border-slate-300 flex items-end justify-center pb-1 uppercase">---</div>
            <p className="mt-2 uppercase">DISTRICT OFFICER</p>
          </div>
        </div>

        <div className="mt-8 pt-2 border-t border-slate-200 text-[8px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-black">
          <span>GROUND WATER DEPARTMENT MALAPPURAM</span>
          <span>OFFICIAL COMPLETION RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function MWSSCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}