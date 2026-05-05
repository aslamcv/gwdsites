'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Suspense, useEffect, useMemo } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

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
      document.title = `Yield-Test-Report-${report.fileNo || report.id.slice(0,6)}.pdf`;
    }
  }, [report]);

  const reportData = useMemo(() => {
      if (!report) return [];
      return [
        { label: '1. അപേക്ഷകന്റെ പേരും വിലാസവും', value: report.applicantNameAddress || report.applicantAddress || report.address },
        { label: '2. കിണറിന്റെ സ്ഥാനം', value: report.nameOfSite },
        { label: '3. അക്ഷാംശം (Latitude)', value: report.latitude },
        { label: '4. രേഖാംശം (Longitude)', value: report.longitude },
        { label: '5. കിണറിന്റെ ആകെ താഴ്ച (മീറ്റർ)', value: report.depthOfWell },
        { label: '6. കിണറിന്റെ വ്യാസം (മീറ്റർ)', value: report.diameterOfWell },
        { label: '7. ടെസ്റ്റ് നടത്തിയ തീയ്യതി', value: report.reportDate },
        { label: '8. സ്റ്റാറ്റിക് വാട്ടർ ലെവൽ (മീറ്റർ)', value: report.staticWaterLevel },
        { label: '9. പമ്പിംഗ് വാട്ടർ ലെവൽ (മീറ്റർ)', value: '' }, 
        { label: '10. ആകെ ഡ്രോഡൗൺ (മീറ്റർ)', value: report.maxDrawdown },
        { label: '11. ശരാശരി ഡിസ്ചാർജ് റേറ്റ് (ലിറ്റർ / മണിക്കൂർ)', value: report.averageDischarge },
        { label: '12. ആകെ പമ്പ് ചെയ്ത വെള്ളത്തിന്റെ അളവ് (ലിറ്റർ)', value: '' }, 
        { label: '13. ആകെ വെള്ളം പമ്പ് ചെയ്ത സമയം (മിനിറ്റ്)', value: report.periodPumped },
        { label: '14. റിക്കവറി തുടർച്ചയായി നിരീക്ഷിച്ച സമയം (മിനിറ്റ്)', value: report.periodOfRecovery },
        { label: '15. ആകെ റിക്കവറി (മീറ്റർ)', value: '' }, 
        { label: '16. 24 മണിക്കൂറിൽ സംഭവിച്ച റിക്കവറി (%)', value: '' }, 
        { label: '17. ടെസ്റ്റ് പ്രകാരം കിണറിന്റെ പരമാവധി യീൽഡ് (ലിറ്റർ / മണിക്കൂർ)', value: '' }, 
        { label: '18. ശുപാർശ ചെയ്യുന്ന ഡിസ്ചാർജ് റേറ്റ് (ലിറ്റർ / മണിക്കൂർ)', value: '' },
        { label: '19. ദിവസവും പമ്പ് ചെയ്യാവുന്ന സമയം (മണിക്കൂർ)', value: '' },
        { label: '20. പമ്പ് സെറ്റ് സ്ഥാപിക്കാവുന്ന താഴ്ച (മീറ്റർ)', value: report.depthOfPump },
        { label: '21. പരാമർശം', value: report.remarks },
      ];
  },[report]);

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
          <Link href="/pumping-test">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/pumping-test">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2 font-bold bg-primary text-white h-8 text-xs">
          <Printer className="h-3 w-3" />
          Print Yield Test Report
        </Button>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[12mm] flex flex-col text-[12px] leading-tight border border-slate-200 print:border-none relative overflow-hidden">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report?.sector || 'PRIVATE').toUpperCase()}/{(report?.category || 'AGRICULTURE').toUpperCase()}
          </p>
        </div>

        <div className="flex justify-between items-start mb-4">
          <p className="font-bold">File No.: {report?.fileNo}</p>
        </div>

        <div className="text-center space-y-1 mb-4">
          <h1 className="text-[18px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
          <h2 className="text-[16px] font-bold underline underline-offset-4 decoration-1 uppercase">യീൽഡ് ടെസ്റ്റ് റിപ്പോർട്ട്</h2>
        </div>

        <div className="border border-black flex-grow overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} className="border-b border-black last:border-b-0 h-[22px]">
                  <td className="border-r border-black p-1 pl-3 font-medium text-[11px] w-1/2 leading-none">{row.label}</td>
                  <td className="p-1 pl-4 font-bold text-[11px] uppercase truncate leading-none">{row.value || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-left">
            <p className="text-[12px]"><span className="font-bold underline">ശുപാർശ:</span> <span className="font-bold uppercase ml-2 italic">{report?.recommendation || '---'}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-[12px] pt-8">
          <div className="text-left space-y-0.5">
            <p>സ്ഥലം : മലപ്പുറം</p>
            <p>തീയ്യതി : {report?.reportDate}</p>
          </div>
          <div className="text-center">
             <div className="h-10"></div>
             <p className="font-bold underline underline-offset-4 decoration-1 uppercase leading-tight">ജൂനിയർ ഹൈഡ്രോജിയോളജിസ്റ്റ് / ജില്ലാ ഓഫീസർ</p>
          </div>
        </div>

        <div className="mt-6 pt-1.5 border-t border-slate-200 text-[7px] text-slate-400 flex justify-between uppercase tracking-widest font-sans font-bold">
          <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
          <span>OFFICIAL TECHNICAL RECORD - MODEL YT-REP-A</span>
        </div>

      </div>
    </div>
  );
}

export default function YieldTestReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Yield Test Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}
