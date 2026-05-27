'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { use, useEffect, Suspense } from 'react';
import { Printer, ArrowLeft, MapPin, Construction, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatToTechnicalDate } from '@/lib/malayalam-utils';

function FeasibilityContent({ id }: { id: string }) {
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
      document.title = `Feasibility-OW-${report.fileNo || report.id.slice(0,6)}.pdf`;
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

  const normalizedRecType = (report?.recommendationType || '').toLowerCase().trim().replace(/\s+/g, '');
  const isOpenWellCompatible = normalizedRecType === 'openwell';

  if (!report || !isOpenWellCompatible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Invalid Report Type</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Feasibility reports in this format are only available for Open Well recommendations.</p>
        <Badge variant="outline" className="mt-4 uppercase font-bold text-xs bg-slate-50">Current Type: {report?.recommendationType || 'NOT SPECIFIED'}</Badge>
        <Button asChild className="mt-8 px-10 rounded-xl font-bold uppercase h-12">
          <Link href="/ground-water-investigation">Return to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 pt-12 pb-4 px-4 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[800px] mx-auto mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
          <Link href="/ground-water-investigation">
            <ArrowLeft className="h-3 w-3" />
            Back to Portal
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" className="gap-2 font-bold border-slate-300 h-8 text-xs">
            <Printer className="h-3 w-3" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none print:max-w-none border border-slate-200 print:border-none px-[20mm] py-[15mm] print:px-[20mm] print:py-[15mm] flex flex-col text-[12px] leading-[1.5] text-black relative">
        
        <div className="absolute top-10 right-10 text-right uppercase">
          <p className="text-[12px] font-bold text-black leading-none">
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'OPEN WELL').toUpperCase()}
          </p>
        </div>

        <div className="text-center mb-4">
            <p className="font-bold underline underline-offset-4 text-[13px]">ഭരണഭാഷ - മാതൃഭാഷ</p>
        </div>

        <div className="flex justify-between items-start mb-8 text-left">
            <div className="space-y-1">
                <p className="flex items-end gap-1">ഫയൽ നമ്പർ: <span className="font-bold border-b border-black min-w-[120px] inline-block text-center">{report.fileNo}</span></p>
            </div>
            <div className="text-right space-y-0.5 leading-tight text-[11px]">
                <p className="font-bold">ജില്ലാ ഓഫീസ്, ഭൂജല വകുപ്പ്,</p>
                <p>മലപ്പുറം - 676 505</p>
                <p>ഫോൺ നമ്പർ - 0483-2731450</p>
                <p>ഇമെയിൽ: gwdmpm@gmail.com</p>
                <p className="pt-2">തീയതി: <span className="font-bold border-b border-black min-w-[120px] inline-block text-center">{formatToTechnicalDate(report.dateOfFeasibility || report.reportDate)}</span></p>
            </div>
        </div>

        <div className="space-y-6 mb-8 text-left text-[12px]">
            <div className="flex flex-col">
                <p>പ്രേഷകൻ,</p>
                <p className="pl-16 font-bold">ജില്ലാ ഓഫീസർ, ഭൂജല വകുപ്പ്, മലപ്പുറം</p>
            </div>
            <div className="flex flex-col">
                <p>സ്വീകർത്താവ്,</p>
                <div className="ml-16 mt-2 p-6 border border-black min-h-[80px] w-full max-w-[500px] uppercase font-bold text-[11.5px] flex flex-col justify-center items-start leading-tight">
                    {(() => {
                      const text = (report.applicantNameAddress || report.applicantName || '').trim();
                      const firstCommaIndex = text.indexOf(',');
                      if (firstCommaIndex === -1) return <span>{text}</span>;
                      return (
                        <>
                          <span>{text.substring(0, firstCommaIndex + 1)}</span>
                          <span className="mt-1">{text.substring(firstCommaIndex + 1).trim()}</span>
                        </>
                      );
                    })()}
                </div>
            </div>
        </div>

        <p className="mb-4 text-left">സർ,</p>

        <div className="space-y-2 mb-8 ml-10 text-left">
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">വിഷയം :</span>
                <span>ഭൂജല വകുപ്പ് - മലപ്പുറം - ഫിസിബിലിറ്റി റിപ്പോർട്ട് - സംബന്ധിച്ച്.</span>
            </div>
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">സൂചന :</span>
                <span>താങ്കളുടെ <span className="font-bold border-b border-black px-4">{formatToTechnicalDate(report.applicationDate) || '--'}</span> തീയതിയിലെ അപേക്ഷ.</span>
            </div>
        </div>

        <p className="mb-8 indent-20 text-justify text-[12px] leading-relaxed">
            മേൽ സൂചനയിലേക്ക് ശ്രദ്ധ ക്ഷണിക്കുന്നു. താങ്കൾ അപേക്ഷിച്ച സ്ഥലത്ത് ഭൂജല സർവ്വേ പൂർത്തിയാക്കി ഫിസിബിലിറ്റി റിപ്പോർട്ട് താഴെ നൽകുന്നു.
        </p>

        <div className="text-center mb-6">
            <h3 className="font-bold text-[15px] underline underline-offset-4 inline-block uppercase tracking-wide">ഫിസിബിലിറ്റി റിപ്പോർട്ട്</h3>
        </div>

        <div className="space-y-6 mb-10 text-left">
            <div className="flex gap-4 items-start">
                <span className="font-bold shrink-0 pt-1">ലൊക്കേഷൻ:</span>
                <div className="border border-black p-4 flex-1 min-h-[50px] uppercase font-bold italic text-[11px] flex items-center leading-relaxed">
                    {report.recommendationOpenwell || `${report.nameOfSite}, ${report.village}`}
                </div>
            </div>

            <div className="space-y-3 pl-8">
                <p>ശുപാർശ ചെയ്യുന്ന ആകെ ആഴം : <span className="font-bold border-b border-black min-w-[60px] inline-block text-center">{report.recOpenwellTotalDepth || '--'}</span> m അല്ലെങ്കിൽ ഉറച്ച പാറ കാണുന്നത് വരെ ആയിരിക്കണം.</p>
                <p>ശുപാർശ ചെയ്യുന്ന വ്യാസം : <span className="font-bold border-b border-black min-w-[60px] inline-block text-center">{report.recOpenwellDiameter || '--'}</span> m</p>
                <p>ശുപാർശ ചെയ്യുന്ന കിണറിൻറെ തരം : <span className="font-bold">തുറന്ന കിണർ</span></p>
            </div>
        </div>

        <div className="space-y-4 mb-12 text-left">
            <h4 className="font-bold underline underline-offset-4 text-[13px]">നിബന്ധനകൾ</h4>
            <div className="space-y-4 text-[11.5px] leading-relaxed text-justify pr-2">
                <p>
                    1. കിണർ നിർമ്മിക്കാൻ ഉദ്ദേശിക്കുന്ന സ്ഥലത്തിന്റെ 7.5 മീറ്റർ ദൂരപരിധിയിൽ ഉള്ള വീട്, റോഡ്, മലിനീകരണസ്രോതസ്സുകളായ സപ്റ്റിക് ടാങ്ക്, വേസ്റ്റ് ടാങ്ക് തുടങ്ങിയ എല്ലാ നിർമ്മിതികളും ലൊക്കേഷൻ സ്കെച്ചിൽ, ആയതിൽ നിന്നുള്ള ദൂരം ഉൾപ്പെടെ, രേഖപ്പെടുത്തി ഒരു അംഗീകൃത സിവിൽ എഞ്ചിനീയർ സാക്ഷ്യപ്പെടുത്തി ലഭ്യമാക്കി, നിയമപ്രകാരമുള്ള ദൂര പരിധി പാലിക്കുന്നുണ്ട് എന്ന് ഉറപ്പ് വരുത്തിയാൽ മാത്രം, കിണർ നിർമ്മാണം പരിഗണിക്കുന്നതാണ് ഉചിതം.
                </p>
                <p>
                    2. കിണർ നിർമ്മാണം വേനൽ കാലത്ത് പൂർത്തീകരിക്കേണ്ടതും കിണറിന്റെ താഴ്ച നിർമ്മാണ സമയത്തു കിണറിൽ 4 മീറ്റർ കനത്തിൽ വെള്ളം ഉണ്ടാകുന്ന രീതിയിലോ കട്ടിയുള്ള കളിമണ്ണ് കാണുന്ന രീതിയിലോ ഏതാണോ കുറവ് അത്രയും താഴ്ചയിൽ നിജപ്പെടുത്താവുന്നതാണ്.
                </p>
                <p>
                    3. ഭൂജല മലിനീകരണ സാധ്യത ഒഴിവാക്കുന്നതിനും ജലലഭ്യത ഉറപ്പ് വരുത്തുന്നതിനുമായി കിണറിന് ആൾമറ കെട്ടേണ്ടതും കിണറിന്റെ ആൾമറയുടെ മുകൾ വശത്ത് നിന്നും കിണറിന്റെ വശങ്ങളിലൂടെ കിണറിലേക്ക് വെള്ളം ഇറങ്ങാത്ത രീതിയിൽ വാട്ടർ ടൈറ്റ് ( water tight ) ആയുള്ള നിർമ്മാണ രീതികൾ അവലംബിക്കേണ്ടതും ആയതിന് താഴോട്ട് ഭൂജലം ഉൾക്കൊള്ളുന്ന ഫോർമേഷനുമായി (formation) നല്ല സമ്പർക്കം നിലനിർത്തുന്ന രീതിയിൽ വേണ്ടത്ര സഷിരങ്ങൾ ഉൾക്കൊള്ളിച്ചുള്ള നിർമ്മാണ രീതികൾ അവലംബിക്കേണ്ടതും ആണ്.
                </p>
                <p>
                    4. ഭൂജല മലിനീകരണ സാധ്യത ഒഴിവാക്കുന്നതിനായി കിണറിന് ചുറ്റും 1 മീറ്റർ വീതിയിൽ, പുറം വശത്തേക്ക് ചരിവോടെ, സിമന്റ് പ്ലാറ്റ്ഫോം ( cement platform ) നിർമ്മിക്കുന്നത് ഉചിതമാണ്.
                </p>
            </div>
        </div>

        <div className="mt-auto flex flex-col items-end pt-10">
            <div className="text-center min-w-[200px] space-y-1">
                <p className="font-bold">വിശ്വസ്തതയോടെ,</p>
                <div className="h-20"></div>
                <p className="font-bold text-[15px] uppercase border-t border-black pt-1">ജില്ലാ ഓഫീസർ.</p>
            </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-3 text-[9px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans">
            <p>Groundwater Department District Office, Malappuram.</p>
            <p>This is a system generated feasibility report.</p>
        </div>

      </div>
    </div>
  );
}

export default function FeasibilityReportOpenWellPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Feasibility Report...</div>}>
      <FeasibilityContent id={resolvedParams.id} />
    </Suspense>
  );
}
