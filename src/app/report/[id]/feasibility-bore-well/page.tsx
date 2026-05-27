
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { use, useEffect, Suspense } from 'react';
import { Printer, ArrowLeft, MapPin, Construction, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      document.title = `Feasibility-BW-${report.fileNo || report.id.slice(0,6)}.pdf`;
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

  const normalizedRecType = (report?.recommendationType || '').toLowerCase().trim();
  const isBorewellCompatible = ['borewell', 'tubewell', 'filterpoint'].includes(normalizedRecType);

  if (!report || !isBorewellCompatible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Invalid Report Type</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Feasibility reports in this format are only available for Bore Well recommendations.</p>
        <Badge variant="outline" className="mt-4 uppercase font-bold text-xs bg-slate-50">Current Type: {report?.recommendationType || 'NOT SPECIFIED'}</Badge>
        <Button asChild className="mt-8 px-10 rounded-xl font-bold uppercase h-12">
          <Link href="/ground-water-investigation">Back to Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 pt-12 pb-4 px-4 print:bg-white print:p-0 font-malayalam">
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
            {(report.sector || 'PRIVATE').toUpperCase()}/{(report.category || 'BORE WELL').toUpperCase()}
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

        <div className="space-y-4 mb-8 text-left">
            <div className="flex flex-col">
                <p>പ്രേഷകൻ,</p>
                <p className="pl-16 font-bold">ജില്ലാ ഓഫീസർ,</p>
                <p className="pl-16 font-bold">ഭൂജല വകുപ്പ്, മലപ്പുറം</p>
            </div>
            <div className="flex flex-col">
                <p>സ്വീകർത്താവ്,</p>
                <div className="ml-16 mt-1 p-4 border border-black min-h-[65px] w-full max-w-[500px] uppercase font-bold text-[11px] flex flex-col justify-center items-start leading-tight">
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

        <div className="space-y-1.5 mb-8 ml-10 text-left">
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">വിഷയം :</span>
                <span>ഭൂജല വകുപ്പ് - മലപ്പുറം - ഫിസിബിലിറ്റി റിപ്പോർട്ട് - സംബന്ധിച്ച്.</span>
            </div>
            <div className="flex gap-4">
                <span className="font-bold shrink-0 min-w-[70px]">സൂചന :</span>
                <span>താങ്കളുടെ <span className="font-bold border-b border-black px-4">{formatToTechnicalDate(report.applicationDate) || '--'}</span> തീയതിയിലെ അപേക്ഷ.</span>
            </div>
        </div>

        <p className="mb-6 indent-20 text-justify">
            മേൽ സൂചനയിലേക്ക് ശ്രദ്ധ ക്ഷണിക്കുന്നു. താങ്കൾ അപേക്ഷിച്ച സ്ഥലത്ത് ഭൂജല സർവ്വേ പൂർത്തിയാക്കി ഫിസിബിലിറ്റി റിപ്പോർട്ട് താഴെ നൽകുന്നു.
        </p>

        <div className="text-center mb-6">
            <h3 className="font-bold text-[16px] underline underline-offset-4 inline-block uppercase">ഫിസിബിലിറ്റി റിപ്പോർട്ട്</h3>
        </div>

        <div className="space-y-6 mb-8 text-left">
            <div className="flex gap-4 items-start">
                <span className="font-bold shrink-0 pt-1">ലൊക്കേഷൻ:</span>
                <div className="border border-black p-3 flex-1 min-h-[50px] uppercase font-bold italic text-[11px] flex items-center leading-relaxed">
                    {report.recommendationBorewell || `${report.nameOfSite}, ${report.village}`}
                </div>
            </div>

            <div className="space-y-3 pl-8">
                <p>ശുപാർശ ചെയ്യുന്ന ആകെ ആഴം : <span className="font-bold border-b border-black min-w-[60px] inline-block text-center">{report.recBorewellTotalDepth || '--'}</span> m</p>
                <p>ശുപാർശ ചെയ്യുന്ന വ്യാസം : <span className="font-bold border-b border-black min-w-[120px] inline-block text-center">{report.recBorewellDiameter || '--'}</span></p>
                <p>പ്രതീക്ഷിക്കുന്ന മണ്ണ് പാളിയുടെ കനം : <span className="font-bold border-b border-black min-w-[60px] inline-block text-center">{report.expectedOverburden || '--'}</span> m</p>
                <p>ശുപാർശ ചെയ്യുന്ന കിണറിൻറെ തരം : <span className="font-bold">कुഴൽ കിണർ</span></p>
            </div>
        </div>

        <div className="space-y-4 mb-8 text-left">
            <h4 className="font-bold underline underline-offset-4 text-[13px]">നിബന്ധനകൾ</h4>
            <div className="space-y-4 text-[11.5px] leading-relaxed text-justify pr-2">
                <p>
                    1) കിണർ നിർമ്മിക്കുന്ന സ്ഥലവും നിർമ്മാണവും കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾക്കും നിലവിലുള്ള നിയമങ്ങൾക്കും അനുസരണമാണ് എന്ന് നിർമ്മാണത്തിന് മുമ്പായി ഉറപ്പ് വരുത്തേണ്ടതാണ്.
                </p>
                <p>
                    2) മലിനീകരണ സാധ്യത ഒഴിവാക്കുന്നതിനായി സപ്റ്റിക് ടാങ്ക്, മലിനജല ഉറവിടങ്ങൾ എന്നിവയിൽ നിന്നും പരമാവധി അകലം പാലിക്കേണ്ടതും ഏറ്റവും കുറഞ്ഞത് 7.5 മീറ്റർ ദൂരപരിധി പാലിക്കേണ്ടതും ആണ്. മലിനീകരണ സാധ്യത ഒഴിവാക്കുന്നതിനായി കിണറിൽ നിന്നും ഏകദേശം 30 മീറ്റർ വരെ അകലത്തിൽ സപ്റ്റിക് ടാങ്ക്, ചാലുകൾ എന്നിവയുടെ നിർമ്മാണം ഒഴിവാക്കുന്നത് ഉചിതമാകും.
                </p>
                <p>
                    3) കിണർ നിർമ്മാണത്തിന് ശേഷം പ്രസ്തുത കിണറിൽ യീൽഡ് ടെസ്റ്റ് ( Yield test ), ജല ഗുണനിലവാര പരിശോധന എന്നിവ നടത്തിയതിന് ശേഷം മാത്രമേ തുടർ നടപടികൾ സ്വീകരിക്കാവൂ.
                </p>
                <p>
                    4) നിർമ്മാണ ആവശ്യങ്ങൾക്കോ, അനുമതി ഇല്ലാത്ത മറ്റ് ആവശ്യങ്ങൾക്കോ കേരള സംസ്ഥാന ഭൂജല അതോറിറ്റിയുടെ അനുമതി ഇല്ലാതെ പ്രസ്തുത കിണറിൽ നിന്നും ഭൂജലം ഉപയോഗിക്കാൻ പാടില്ല.
                </p>
            </div>
        </div>

        <div className="mb-8 p-6 border border-slate-300 rounded-[20px] bg-slate-50/50 text-[#1e3a8a] text-[13.5px] leading-relaxed text-left">
            <p className="font-bold italic">
                * താങ്കളുടെ സൈറ്റ് ഈ ഓഫീസിലെ SKE റിഗ്ഗിന് അനുയോജ്യമാണെങ്കിൽ താങ്കൾ ആവശ്യപ്പെടുന്ന പക്ഷം കുഴൽ കിണർ നിർമ്മിക്കുന്നതിന് എസ്റ്റിമേറ്റ് നൽകുന്നതാണ്.
            </p>
        </div>

        <div className="space-y-4 mb-10 text-[11px] leading-[1.5] text-justify pr-2">
            <p className="font-bold italic">
                <span className="underline">കുറിപ്പ്</span> :- മേൽപ്പറഞ്ഞ ഗവേണഫലം വിശദമായ ഭൂജല പര്യവേക്ഷണത്തിന്റെ അടിസ്ഥാനത്തിലാണ്. എങ്കിലും ചില സാങ്കേതികകാരണങ്ങളാൽ പരാജയപ്പെടുകയും ചെയ്യാറുണ്ട്. ആയാൽ പരാജയപ്പെടുകയാണെങ്കിൽ യാതൊരുവിധ നഷ്ടപരിഹാരവും അനുവദിക്കുന്നതല്ല.
            </p>
            <p className="pl-6 font-bold">
                ഈ കിണറിൽ നിന്നും ജലം പമ്പ് ചെയ്യുമ്പോൾ സമീപ പ്രദേശത്തെ ഭൂജല സ്രോതസ്സുകളെ ബാധിക്കുന്നുണ്ടെന്ന് കണ്ടാൽ പമ്പിംഗ് ചെയ്യുന്നത് നിയന്ത്രണ വിധേയമാക്കുകയോ നിർത്തിവെക്കുകയോ ചെയ്യേണ്ടതാണ്.
            </p>
            <p className="pl-6 font-bold">
                28/05/2007 ലെ സർക്കാർ ഉത്തരവ് (ജലവിഭവ വകുപ്പ്) നമ്പർ 13033/GW1/07/WRD പ്രകാരം ഉപയോഗശൂന്യമായ തുറന്ന കിണറുകൾ/ജലസ്രോതസ്സുകൾ എന്നിവ ജനങ്ങൾക്ക് വിശേഷിച്ച് കുട്ടികൾക്ക് അപകടങ്ങൾ ഉണ്ടാകാത്ത തരത്തിൽ വശങ്ങൾ കെട്ടി സംരക്ഷിക്കേണ്ടതാണ്. ഉപയോഗശൂന്യമായ തുറന്ന കിണർ / കുഴൽ കിണർ എന്നിവ ഏതെങ്കിലും താങ്കളുടെ അധികാര പരിധിയിൽ ഉണ്ടെങ്കിൽ ആയത് മണ്ണുട്ട് മൂടുകയും ചെയ്യേണ്ടതാണ്.
            </p>
        </div>

        <div className="flex-grow"></div>

        <div className="mt-auto flex flex-col items-end pt-10">
            <div className="text-center min-w-[200px] space-y-1">
                <p className="font-bold">വിശ്വസ്തതയോടെ,</p>
                <div className="h-20"></div>
                <p className="font-bold text-[15px] uppercase border-t border-black pt-1">ജില്ലാ ഓഫീസർ.</p>
            </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-3 text-[9px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-black">
            <p>Groundwater Department District Office, Malappuram.</p>
            <p>This is a system generated technical record.</p>
        </div>

      </div>
    </div>
  );
}

export default function FeasibilityReportBoreWellPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Generating Feasibility Report...</div>}>
      <FeasibilityContent id={resolvedParams.id} />
    </Suspense>
  );
}
