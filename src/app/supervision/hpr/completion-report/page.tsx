'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect, useMemo } from 'react';
import { Printer, ArrowLeft, Settings, ClipboardList } from 'lucide-react';
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
      document.title = `HPR-Completion-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  const sparesList = useMemo(() => {
    if (!report) return [];
    
    const possibleSpares = [
      { key: 'pullOutReerection', label: 'Pull out and reerection of India Mark II' },
      { key: 'headAssemblyComplete', label: 'Head assembly complete' },
      { key: 'headWeldedComponents', label: 'Head with welded components only w/o cover' },
      { key: 'handle', label: 'Handle' },
      { key: 'additionalPlate', label: 'Additional Plate' },
      { key: 'frontCover', label: 'Front cover' },
      { key: 'axle', label: 'Axle' },
      { key: 'ballBearing6204Z', label: 'Ball Bearing 6204 Z' },
      { key: 'chainWithCoupling', label: 'Chain with coupling' },
      { key: 'washerForAxilPin', label: 'washer for Axil pin' },
      { key: 'm12x20HexBolt', label: 'M 12 X 20 Hex Bolt' },
      { key: 'm12x40HexBolt', label: 'M 12 X 40 Hex Bolt' },
      { key: 'm12Nut', label: 'M 12 Nut' },
      { key: 'm12Washer', label: 'M 12 Washer' },
      { key: 'm10x40HtBolt', label: 'M 10 X 40 H t Bolt' },
      { key: 'm10NylocNut', label: 'M 10 Nyloc Nut' },
      { key: 'specialWasherForAxle', label: 'Special washer for axle' },
      { key: 'cylinderAssemblyComplete', label: 'Cylinder assembly complete' },
      { key: 'cylinderBodyWithLiner', label: 'Cylinder body with liner' },
      { key: 'plungerRoadSS', label: 'Plunger road S S' },
      { key: 'reducerCup', label: 'Reducer cup' },
      { key: 'plungerYokeBody', label: 'Plunger yoke body' },
      { key: 'spacerForAxilPin', label: 'Spacer for Axil pin' },
      { key: 'follower', label: 'follower' },
      { key: 'upperValve', label: 'upper valve' },
      { key: 'checkValveGuide', label: 'check valve guide' },
      { key: 'checkValveSeat', label: 'check valve seat' },
      { key: 'rubberSeatRetainer', label: 'Rubber seat retainer' },
      { key: 'sealingRing', label: 'Sealing ring' },
      { key: 'rubberSeatingUpperValve', label: 'Rubber seating upper valve' },
      { key: 'rubberSeatingChekValve', label: 'Rubber seating chek valve' },
      { key: 'pumpBucket', label: 'Pump bucket' },
      { key: 'upperValveAssembly', label: 'Upper valve assembly' },
      { key: 'lowerValveAssembly', label: 'Lower Valve assembly' },
      { key: 'waterTank', label: 'Water Tank' },
      { key: 'pipeSocket32mm', label: 'Pipe socket (32mm Dia.)' },
      { key: 'pedestal', label: 'Pedestal' },
      { key: 'connectingRod3m', label: '12mm dia X 1.75 X 3 M connecting rod' },
      { key: 'hexCoupler12x50', label: 'Hex. Coupler 12 X 50 mm' },
      { key: 'raiserPipe3m', label: '32 mm GI Raiser pipe 3M (one socket)' },
    ];

    return possibleSpares
      .map(spare => ({
        label: spare.label,
        qty: (report as any)[spare.key] || ''
      }))
      .filter(item => item.qty !== '');
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
          <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs">
            <Printer className="h-3 w-3" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[11px] leading-tight border border-slate-200 print:border-none overflow-hidden relative">
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'HPR REPAIR').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
          <h1 className="text-[16px] font-black text-slate-900 uppercase tracking-wide">GROUND WATER DEPARTMENT</h1>
          <h2 className="text-[14px] font-bold text-slate-600 uppercase">DISTRICT OFFICE, MALAPPURAM</h2>
          <div className="h-4"></div>
          <h3 className="text-[15px] font-black text-slate-900 underline underline-offset-8 uppercase">
            HPR COMPLETION REPORT
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-12 mb-6 text-left">
          <div className="space-y-2">
            <div className="flex border-b border-dotted border-slate-300 pb-0.5">
              <span className="font-bold text-slate-500 w-[120px] shrink-0 uppercase text-[9px]">File No :</span>
              <span className="font-bold text-slate-900 uppercase">{report?.fileNo || '---'}</span>
            </div>
            <div className="flex border-b border-dotted border-slate-300 pb-0.5">
              <span className="font-bold text-slate-500 w-[120px] shrink-0 uppercase text-[9px]">Site Name :</span>
              <span className="font-bold text-slate-900 uppercase truncate">{report?.nameOfSite}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex border-b border-dotted border-slate-300 pb-0.5">
              <span className="font-bold text-slate-500 w-[140px] shrink-0 uppercase text-[9px]">Supervision Date :</span>
              <span className="font-bold text-slate-900">{report?.reportDate}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex-1 text-left">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Settings className="h-3 w-3 text-blue-600" /> List of Replaced Spares
          </h4>
          <div className="border border-slate-900 rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-100 border-b border-slate-900">
                <tr className="h-8 text-[9px] font-black uppercase text-slate-700">
                  <th className="w-12 text-center border-r border-slate-900">Sl No</th>
                  <th className="px-4 border-r border-slate-900">Description of Item</th>
                  <th className="w-24 text-center">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {sparesList.map((item, i) => (
                  <tr key={i} className="border-b border-slate-200 last:border-b-0 h-[24px]">
                    <td className="text-center border-r border-slate-900 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 border-r border-slate-900 font-bold text-slate-800 text-[10px] uppercase">{item.label}</td>
                    <td className="text-center font-black text-slate-900 text-[11px] bg-slate-50/50">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ClipboardList className="h-3 w-3" /> Technical Observations & Remarks
          </h4>
          <p className="italic text-slate-700 leading-relaxed text-[10.5px] uppercase font-bold">
            {report?.remarks || 'The hand pump repair work has been carried out as per departmental requirements.'}
          </p>
        </div>

        <div className="flex-grow"></div>

        <div className="grid grid-cols-3 gap-8 text-[9px] text-center font-black pt-4">
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.supervisor || '---'}</div>
            <p className="mt-2 uppercase">SUPERVISOR</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase font-black text-slate-900">{report?.staffAssignment?.assistantEngineer || '---'}</div>
            <p className="mt-2 uppercase">ASSISTANT ENGINEER</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center pb-1 uppercase">---</div>
            <p className="mt-2 uppercase">DISTRICT OFFICER</p>
          </div>
        </div>

        <div className="mt-8 pt-2 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-black">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL REPAIR RECORD</span>
        </div>
      </div>
    </div>
  );
}

export default function HPRCompletionReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating HPR Completion Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}