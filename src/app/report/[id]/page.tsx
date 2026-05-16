'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { use, useEffect, Suspense } from 'react';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

function ReportTableRow({ label, value }: { label: string, value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[1.5fr_1fr] border-b border-black last:border-b-0 h-[22px]">
      <div className="border-r border-black px-2 font-malayalam text-[10px] leading-tight flex items-center text-left">{label}</div>
      <div className="px-2 font-bold text-[10px] leading-tight flex items-center uppercase text-left truncate">{value || ''}</div>
    </div>
  );
}

function ReportContent({ id }: { id: string }) {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  useEffect(() => {
    if (report) {
      document.title = `GIR-${report.fileNo || report.id.slice(0,6)}.pdf`;
      if (isPrintMode) {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [report, isPrintMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
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

  const renderNearbyDetails = () => {
    const bwExist = !report.noNearbyBorewells && (report.nearbyBorewell1Depth || report.nearbyBorewell2Depth || report.nearbyBorewell3Depth);
    const owExist = !report.noNearbyOpenwells && (report.nearbyOpenwell1Depth || report.nearbyOpenwell2Depth || report.nearbyOpenwell3Depth);

    if (!bwExist && !owExist) {
      return <p className="italic text-[10px] text-left">No nearby groundwater structures reported.</p>;
    }

    return (
      <div className="space-y-1 text-left">
        {bwExist && (
          <div>
            <p className="font-bold uppercase text-[9px] underline">BOREWELLS:</p>
            <div className="pl-2 space-y-0.5 text-[9px]">
              {report.nearbyBorewell1Depth && (
                <p><strong>BW1:</strong> Depth: {report.nearbyBorewell1Depth}m, Dia: {report.nearbyBorewell1Diameter || '--'}, Zones: {report.nearbyBorewell1Zones || '--'}</p>
              )}
              {report.nearbyBorewell2Depth && (
                <p><strong>BW2:</strong> Depth: {report.nearbyBorewell2Depth}m, Dia: {report.nearbyBorewell2Diameter || '--'}, Zones: {report.nearbyBorewell2Zones || '--'}</p>
              )}
              {report.nearbyBorewell3Depth && (
                <p><strong>BW3:</strong> Depth: {report.nearbyBorewell3Depth}m, Dia: {report.nearbyBorewell3Diameter || '--'}, Zones: {report.nearbyBorewell3Zones || '--'}</p>
              )}
            </div>
          </div>
        )}
        {owExist && (
          <div className="mt-1">
            <p className="font-bold uppercase text-[9px] underline">OPEN WELLS:</p>
            <div className="pl-2 space-y-0.5 text-[9px]">
              {report.nearbyOpenwell1Depth && (
                <p><strong>OW1:</strong> Depth: {report.nearbyOpenwell1Depth}m, WL: {report.nearbyOpenwell1WaterLevel || '--'}m, Type: {report.nearbyOpenwell1Type || '--'}</p>
              )}
              {report.nearbyOpenwell2Depth && (
                <p><strong>OW2:</strong> Depth: {report.nearbyOpenwell2Depth}m, WL: {report.nearbyOpenwell2WaterLevel || '--'}m, Type: {report.nearbyOpenwell2Type || '--'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecommendation = () => {
    if (report.recommendationType === 'borewell' || report.recommendationType === 'tubewell' || report.recommendationType === 'filterpoint') {
      return (
        <div className="space-y-1 w-full text-left font-bold text-[10px]">
          <p className="uppercase mb-1 underline">RECOMMENDED {report.recommendationType?.toUpperCase()}:</p>
          <p>* Proposed Total Depth: {report.recBorewellTotalDepth || '--'}m</p>
          <p>* Proposed Diameter: {report.recBorewellDiameter || '--'}</p>
          <p>* Expected Overburden: {report.expectedOverburden || '--'}m</p>
          {report.recommendationBorewell && (
            <div className="mt-1">
              <p className="text-justify leading-relaxed italic font-normal">{report.recommendationBorewell}</p>
            </div>
          )}
        </div>
      );
    } else if (report.recommendationType === 'openwell') {
      return (
        <div className="space-y-1 w-full text-left font-bold text-[10px]">
          <p className="uppercase mb-1 underline">RECOMMENDED OPEN WELL:</p>
          <p>* Proposed Total Depth: {report.recOpenwellTotalDepth || '--'}m</p>
          <p>* Proposed Diameter: {report.recOpenwellDiameter || '--'}m</p>
          {report.recommendationOpenwell && (
            <div className="mt-1">
              <p className="text-justify leading-relaxed italic font-normal">{report.recommendationOpenwell}</p>
            </div>
          )}
        </div>
      );
    } else if (report.recommendationType === 'not_feasible') {
      return (
        <div className="w-full text-left italic font-normal text-[10px]">
          SITE NOT FEASIBLE: Based on technical investigation and local hydrogeological conditions, the site is NOT recommended for the proposed groundwater structure.
        </div>
      );
    }
    return <p className="italic text-muted-foreground text-left text-[10px]">No recommendation provided.</p>;
  };

  const cleanStaffName = (name?: string) => {
    if (!name || name.includes("Name")) return '';
    return name.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/ground-water-investigation">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs px-6">
            <Printer className="h-3 w-3" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col border border-slate-200 print:border-none relative overflow-hidden">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'DOMESTIC').toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-0.5 mb-6">
          <h1 className="text-[18px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[14px] font-bold underline underline-offset-4 decoration-1">ഭൂജല പരിശോധന റിപ്പോർട്ട്</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-black">
                <div className="text-center font-bold border-b border-black p-1 text-[11px] bg-slate-50">I. അപേക്ഷകൻറ വിവരങ്ങൾ</div>
                <ReportTableRow label="സ്ഥലത്തിൻറെ പേര് & വിലാസം" value={report.nameOfSite} />
                <ReportTableRow label="ഫയൽ നമ്പർ" value={report.fileNo} />
                <ReportTableRow label="പരിശോധന തീയതി" value={report.dateOfInvestigation} />
                <ReportTableRow label="അപേക്ഷിച്ചിരിക്കുന്നത്" value={report.typeAppliedFor} />
                <ReportTableRow label="വില്ലേജ്" value={report.village} />
                <ReportTableRow label="വാർഡ് നമ്പർ" value={report.ward} />
                <ReportTableRow label="സർവേ നമ്പർ & വിസ്തീർണം" value={report.surveyNoArea} />
            </div>
            <div className="border border-black">
                <div className="text-center font-bold border-b border-black p-1 text-[11px] bg-slate-50">II. ഭൗമസ്ഥിതിവിവരങ്ങൾ</div>
                <ReportTableRow label="നിയമസഭ മണ്ഡലം" value={report.assembly} />
                <ReportTableRow label="പഞ്ചായത്ത്/മുനിസിപ്പാലിറ്റി" value={report.lsgd} />
                <ReportTableRow label="ബ്ലോക്ക്" value={report.block} />
                <ReportTableRow label="അക്ഷാംശം / രേഖാംശം" value={report.latitude && report.longitude ? `${report.latitude} / ${report.longitude}` : ''} />
                <ReportTableRow label="ഉയരം (കടൽ നിരപ്പിൽ നിന്ന്)" value={report.altitude} />
                <ReportTableRow label="ടോപ്പോഷീറ്റ്/ഭൂജല മാപ്പ്" value={report.toposheet} />
                <ReportTableRow label="ഗുണഭോക്താക്കളുടെ എണ്ണം" value={report.noOfBeneficiaries} />
                <ReportTableRow label="മൈക്രോ വാട്ടർ ഷെഡ്" value={report.microWatershed} />
            </div>
        </div>

        <div className="border border-black mb-4">
            <div className="border-b border-black p-1 font-bold text-[11px] bg-slate-50 text-left">III. സാങ്കേതിക വിശകലനം:</div>
            <div className="p-2 text-[10px] leading-tight min-h-[160px] text-left border-b border-black">
                <p className="font-bold mb-1">1. പ്രദേശത്തിൻറെ ഹൈഡ്രോജിയോളജിയും ഭൂവിജ്ഞാനവും:</p>
                <p className="pl-4 italic leading-relaxed">{report.hydrogeology || 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.'}</p>
            </div>
            <div className="p-2 text-[10px] leading-tight min-h-[100px] text-left">
                <p className="font-bold mb-1">2. സമീപമുള്ള ഭൂഗർഭജല ഘടനകളുടെ വിശദാംശങ്ങൾ:</p>
                <div className="pl-4">{renderNearbyDetails()}</div>
            </div>
        </div>

        <div className="border border-black mb-4">
            <div className="border-b border-black p-1 font-bold text-[11px] bg-slate-50 text-left">IV. അന്തിമ ശുപാർശ:</div>
            <div className="p-3 text-[10px] min-h-[120px] flex items-start text-left">
              {renderRecommendation()}
            </div>
        </div>

        {report.recommendedToGpSurvey && (
          <div className="border-[3px] border-black p-4 mb-4">
            <p className="text-[12px] font-bold text-center uppercase">
              recommended to GP survey - ({report.gpSurveyLocation || 'As per site observations'})
            </p>
          </div>
        )}

        {report.recommendedToPumpingTest && (
          <div className="border-[3px] border-black p-4 mb-4">
            <p className="text-[12px] font-bold text-center uppercase">
              recommended to pumping test
            </p>
          </div>
        )}

        <div className="flex-grow"></div>

        <div className="grid grid-cols-4 gap-4 text-center text-[9px] pt-12">
          <div className="flex flex-col items-center">
            <p className="font-bold min-h-[14px]">{cleanStaffName(report.staffAssignment?.geologicalAssistant as string)}</p>
            <div className="w-full border-t border-dotted border-black mt-1 mb-1"></div>
            <p className="font-medium">ജിയോളജിക്കൽ അസിസ്റ്റൻറ്</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-bold min-h-[14px]">{cleanStaffName(report.staffAssignment?.juniorHydrogeologist as string)}</p>
            <div className="w-full border-t border-dotted border-black mt-1 mb-1"></div>
            <p className="font-medium">ജൂനിയർ ഹൈഡ്രോജിയോളജിസ്റ്റ്</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-bold min-h-[14px]">{cleanStaffName(report.staffAssignment?.hydrogeologist as string)}</p>
            <div className="w-full border-t border-dotted border-black mt-1 mb-1"></div>
            <p className="font-medium">ഹൈഡ്രോജിയോളജിസ്റ്റ്</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-bold min-h-[14px]"></p>
            <div className="w-full border-t border-dotted border-black mt-1 mb-1"></div>
            <p className="font-medium">ജില്ലാ ഓഫീസർ</p>
          </div>
        </div>

        <div className="mt-8 pt-1.5 border-t border-slate-200 text-[8px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>Issued by Groundwater Department, Malappuram.</span>
          <span>This is a system generated technical record.</span>
        </div>

      </div>
    </div>
  );
}

export default function GroundwaterInvestigationReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Report...</div>}>
      <ReportContent id={resolvedParams.id} />
    </Suspense>
  );
}
