'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { use, useEffect, useMemo, Suspense } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter
} from 'recharts';

function VESReportContent({ id }: { id: string }) {
  const firestore = useFirestore();
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  useEffect(() => {
    if (report) {
      document.title = `VES-Report-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  const chartData = useMemo(() => {
    if (!report?.vesData) return [];
    return report.vesData
      .map(row => ({
        x: row.ab2,
        y: parseFloat(row.ves1_ra || '0')
      }))
      .filter(d => d.y > 0);
  }, [report]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[210mm] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-slate-800">Report Not Found</h1>
        <Button asChild className="mt-6">
          <Link href="/ground-water-investigation">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 pt-12 pb-2 px-4 print:bg-white print:p-0 font-sans">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/ground-water-investigation">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs px-6">
          <Printer className="h-3 w-3" />
          Print Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none border border-slate-200 print:border-none p-[8mm] flex flex-col text-[10px] leading-none text-black overflow-hidden relative">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'DOMESTIC').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-0.5 mb-4">
          <h1 className="text-[16px] font-bold text-[#991b1b] font-malayalam">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[14px] font-black uppercase tracking-tight">GEOPHYSICAL INVESTIGATION REPORT</h2>
          <h3 className="text-[11px] font-black underline underline-offset-4 uppercase pt-0.5">VERTICAL ELECTRICAL SOUNDING</h3>
          <p className="text-[9px] font-bold mt-1 text-center">
            Electrode Configuration: <span className="font-medium italic">Schlumberger Configuration</span> | Instrument Used: <span className="font-medium italic">Aquameter CRM 20</span>
          </p>
        </div>

        <div className="border border-black grid grid-cols-[1.2fr_1fr_1.5fr] mb-1 font-bold text-[10px] text-left">
          <div className="border-r border-black p-1.5">File No: <span className="ml-1 uppercase font-medium">{report.fileNo}</span></div>
          <div className="border-r border-black p-1.5">Date: <span className="ml-1 font-medium">{formatToTechnicalDate(report.reportDate)}</span></div>
          <div className="p-1.5">Location: <span className="ml-1 uppercase font-medium truncate inline-block max-w-[220px] align-bottom">{report.location}</span></div>
        </div>

        <div className="mb-2 pl-1 font-bold text-[10px] uppercase italic text-left">
          {report.vesArea}
        </div>

        <div className="grid grid-cols-[1fr_220px] gap-3 mb-2 items-start text-left">
          <div className="border border-black">
            <table className="w-full text-center border-collapse">
              <thead className="bg-slate-50 border-b border-black">
                <tr className="font-bold text-[9px]">
                  <th className="border-r border-black p-1 w-8">S. No</th>
                  <th className="border-r border-black p-1">AB/2 (Meter)</th>
                  <th className="border-r border-black p-1">MN/2 (Meter)</th>
                  <th className="border-r border-black p-1">K</th>
                  <th className="border-r border-black p-1 w-14">R(Ohms)</th>
                  <th className="p-1 w-20">Ra(Ohm meter)</th>
                </tr>
              </thead>
              <tbody>
                {report.vesData?.map((row, i) => (
                  <tr key={i} className="border-b border-black last:border-b-0 h-[18px]">
                    <td className="border-r border-black p-0.5 text-[9.5px]">{row.sNo}</td>
                    <td className="border-r border-black p-0.5 text-[9.5px]">{row.ab2}</td>
                    <td className="border-r border-black p-0.5 text-[9.5px]">{row.mn2}</td>
                    <td className="border-r border-black p-0.5 text-[9.5px] text-slate-600">{row.k}</td>
                    <td className="border-r border-black p-0.5 text-[9.5px]">{row.ves1_r}</td>
                    <td className="p-0.5 text-[9.5px] font-bold">{row.ves1_ra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="border border-black text-[9px] overflow-hidden">
              <div className="grid grid-cols-[90px_1fr] border-b border-black">
                <div className="border-r border-black p-1 bg-slate-50 font-bold">Measuring Point</div>
                <div className="p-1 font-bold text-center">{report.latitude} {report.longitude}</div>
              </div>
              <div className="grid grid-cols-[90px_1fr]">
                <div className="border-r border-black p-1 bg-slate-50 font-bold">Spreading Direction</div>
                <div className="p-1 font-bold text-center uppercase">{report.spreadingDirection}</div>
              </div>
            </div>

            <div className="border border-black p-1.5 bg-white">
              <p className="text-[9px] font-bold uppercase text-center mb-1 border-b border-black pb-0.5">RESISTIVITY CURVE (LOG SCALE)</p>
              <div className="h-[280px] w-full mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 10, bottom: 10, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="AB/2" 
                      scale="log" 
                      domain={[1, 150]} 
                      ticks={[1, 10, 100]}
                      label={{ value: 'AB/2 (m)', position: 'insideBottom', offset: -5, fontSize: 9, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Ra" 
                      scale="log" 
                      domain={[10, 10000]}
                      ticks={[10, 100, 1000, 10000]}
                      label={{ value: 'Ra (Ωm)', angle: -90, position: 'insideLeft', fontSize: 9, fontWeight: 'bold', offset: 10 }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="VES Data" data={chartData} fill="#1e3a8a" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-1 space-y-1 text-left">
          <h4 className="font-bold underline underline-offset-4 text-[11px]">Report & Recommendations</h4>
          <div className="p-2 border border-black min-h-[80px] text-justify leading-relaxed text-[10.5px]">
            <p className="whitespace-pre-wrap">{report.vesRecommendation || report.recommendationBorewell || report.recommendationOpenwell}</p>
          </div>
        </div>

        <div className="mt-8 mb-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="h-12"></div>
              <p className="text-[9px] font-bold text-[#991b1b] uppercase">geophysical assistant</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12"></div>
              <p className="text-[9px] font-bold text-[#991b1b] uppercase">junior geophysicist</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12"></div>
              <p className="text-[9px] font-bold text-[#991b1b] uppercase">geophysicist</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12"></div>
              <p className="text-[11px] font-bold text-[#991b1b] font-malayalam">ജില്ലാ ഓഫീസർ</p>
            </div>
          </div>
        </div>

        <div className="flex-grow"></div>

        <div className="mt-2 pt-1.5 border-t border-slate-200 text-[7px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL GEOPHYSICAL TECHNICAL RECORD</span>
        </div>

      </div>
    </div>
  );
}

export default function GeophysicalInvestigationReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Geophysical Report...</div>}>
      <VESReportContent id={resolvedParams.id} />
    </Suspense>
  );
}
