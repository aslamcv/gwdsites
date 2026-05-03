'use client';

import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ClipboardList
} from 'lucide-react';
import type { GroundwaterReport } from '@/lib/types';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  report: GroundwaterReport | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ report, isOpen, onOpenChange }: ReportDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!report) return null;

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { 
      scale: 2,
      useCORS: true,
      logging: false
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${report.reportType}-Report-${report.fileNo || 'Record'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadExcel = () => {
    const wsData = report.works?.map((w, i) => ({
      'Sl No': i + 1,
      'Description': w.description,
      'Qty': w.qty,
      'Unit': w.unit,
      'Rate': w.rate,
      'Amount': w.amount
    })) || [];
    
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Technical Details");
    XLSX.writeFile(workbook, `${report.reportType}-Data-${report.fileNo || 'Export'}.xlsx`);
  };

  const isEstimate = report.reportType === 'ESTIMATE';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1000px] h-[90vh] p-0 flex flex-col overflow-hidden bg-slate-100/50 border-none shadow-2xl">
        <DialogHeader className="p-8 pt-16 bg-white border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              isEstimate ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            )}>
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                {report.reportType} REPORT PREVIEW
              </DialogTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Ref: {report.fileNo || (report.id ? report.id.slice(0, 8) : 'PREVIEW')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <button 
              onClick={downloadExcel} 
              className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest text-slate-600"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" /> EXCEL
            </button>
            <button 
              onClick={downloadPDF} 
              className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest text-slate-600"
            >
              <Download className="size-3.5 text-blue-600" /> DOWNLOAD PDF
            </button>
            <button 
              onClick={handlePrint} 
              className="h-9 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all inline-flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest"
            >
              <Printer className="size-3.5" /> PRINT
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-10 flex flex-col items-center">
          <div 
            ref={reportRef}
            className="w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-2xl border border-slate-300 flex flex-col text-black font-sans leading-tight print:shadow-none print:border-none relative"
          >
            <div className="absolute top-10 right-10 text-right uppercase">
              <p className="text-[12px] font-bold text-black leading-none">
                {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'ESTIMATE_MEASUREMENT').toUpperCase()}
              </p>
            </div>

            <div className="text-center space-y-1 mb-4">
              <h2 className="text-[14px] font-black uppercase tracking-widest">GROUND WATER DEPARTMENT</h2>
              <h3 className="text-[11px] font-bold uppercase text-slate-600">DISTRICT OFFICE, MALAPPURAM</h3>
              <div className="h-6" />
              <h1 className={cn(
                "text-[26px] font-black underline underline-offset-[12px] uppercase tracking-[0.1em]",
                isEstimate ? "text-blue-700" : "text-emerald-700"
              )}>
                {report.reportType} REPORT
              </h1>
            </div>

            <div className="h-0.5 bg-black w-full mb-8" />

            <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-8 text-[11px] font-bold">
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">NAME OF SITE:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.nameOfSite || report.applicantName || '---'}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">FILE NO:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.fileNo || '---'}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">LSGD / LOCAL BODY:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.lsgd || '---'}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">DATE:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.reportDate}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">CONTRACTOR:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.nameOfContractor || '---'}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter shrink-0">CONVEYANCE:</span>
                  <div className="flex-1 border-b border-dotted border-black text-right font-black uppercase pb-0.5">
                    {report.conveyance || '---'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 border border-slate-400 rounded-[24px] overflow-hidden bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-400">
                  <tr className="h-12 text-[10px] font-black uppercase text-slate-700">
                    <th className="w-12 text-center border-r border-slate-400">SL</th>
                    <th className="px-4 border-r border-slate-400 text-left">DESCRIPTION OF TECHNICAL WORK</th>
                    <th className="w-20 text-center border-r border-slate-400 text-red-600">SITE</th>
                    <th className="w-16 border-r border-slate-400"></th>
                    <th className="w-24 border-r border-slate-400"></th>
                    <th className="w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {(report.works?.length ? report.works : Array(5).fill({ description: '(Enter technical parameters...)' })).map((item, i) => (
                    <tr key={i} className="h-14 border-b border-slate-200 last:border-b-0 text-[11px]">
                      <td className="text-center border-r border-slate-400 font-black text-blue-700">{i + 1}</td>
                      <td className="px-4 border-r border-slate-400 font-bold text-slate-600 lowercase italic">
                        {item.description}
                      </td>
                      <td className="text-center border-r border-slate-400 font-black text-red-600 text-[12px]">
                        {i + 1}
                      </td>
                      <td className="border-r border-slate-400"></td>
                      <td className="border-r border-slate-400"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-12 p-6 border border-slate-200 rounded-[24px] bg-slate-50/30">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ClipboardList className="size-3" /> TECHNICAL OBSERVATIONS & REMARKS
              </h4>
              <p className="text-[11px] leading-relaxed italic font-bold uppercase text-slate-700 text-justify">
                {report.remarks || 'RECORDED AS PER FIELD MEASUREMENTS AND TECHNICAL SPECIFICATIONS AT SITE. ALL WORKS VERIFIED ACCORDING TO DEPARTMENTAL STANDARDS.'}
              </p>
            </div>

            <div className="flex-grow" />

            <div className="grid grid-cols-3 gap-12 text-[10px] text-center font-black pb-4">
              <div className="flex flex-col items-center">
                <div className="h-16 w-full border-b border-black flex items-end justify-center pb-1 uppercase font-black text-slate-900">
                  {report.staffAssignment?.supervisor || '---'}
                </div>
                <p className="mt-3">PREPARED BY</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">(Supervisor / Technician)</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-full border-b border-black flex items-end justify-center pb-1 uppercase font-black text-slate-900">
                  {report.staffAssignment?.assistantEngineer || '---'}
                </div>
                <p className="mt-3">VERIFIED BY</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">(Assistant Engineer)</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-full border-b border-black flex items-end justify-center pb-1 uppercase font-black text-slate-900">
                  ---
                </div>
                <p className="mt-3">APPROVED BY</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">(District Officer)</p>
              </div>
            </div>

            <div className="mt-8 pt-2 border-t border-slate-200 text-[7.5px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-black">
              <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
              <span>OFFICIAL TECHNICAL RECORD - MODEL EM-IX</span>
            </div>
          </div>
        </div>
        <DialogFooter className="bg-white border-t p-4 flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="rounded-xl px-8 font-bold">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}