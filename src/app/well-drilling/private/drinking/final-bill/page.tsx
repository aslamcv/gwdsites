'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, ShieldAlert, FileOutput, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PDFDocument } from 'pdf-lib';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { convertNumberToMalayalam } from '@/ai/flows/malayalam-number-converter';

const formatTechnicalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  const date = parseISO(dateStr);
  if (isValid(date)) return format(date, 'dd-MM-yyyy');
  return dateStr;
};

function BillContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const router = useRouter();
  const id = searchParams.get('id');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
  const [malayalamBalanceWords, setMalayalamBalanceWords] = useState<string>('');

  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading: isReportLoading } = useDoc<GroundwaterReport>(reportRef);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'service_rates');
  }, [firestore]);

  const { data: cloudRates, isLoading: isRatesLoading } = useDoc(settingsRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email?.toLowerCase() === 'gwdmpm@gmail.com') return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const data = useMemo(() => {
    if (report) {
      const yieldStatus = (report.remarks || '').toLowerCase().trim();
      const isDry = yieldStatus === 'dry well' || yieldStatus === 'dry' || yieldStatus === 'collapsed well' || yieldStatus === 'collapsed';

      return {
        fileNo: report.fileNo || '',
        wellNumber: report.wellNumber || '',
        borewellSize: report.borewellSize || '',
        nameOfSite: report.nameOfSite || report.applicantName || '',
        lsgd: report.lsgd || '',
        address: report.address || '',
        totalDepth: report.totalDepth || '',
        overburden: report.overburden || '',
        pvc6kg: report.pvc6kg || '0',
        pvc10kg: report.pvc10kg || '0',
        discharge: isDry ? '0' : (report.discharge || '0'),
        waterLevel: report.waterLevel || '0',
        workStart: report.dateOfInvestigation?.split(' - ')[0] || '',
        workEnd: report.dateOfInvestigation?.split(' - ')[1] || '',
        remarks: report.remarks || '',
        observations: report.observations || '',
        purpose: report.purpose || 'Well Drilling / Private / Drinking',
        sector: report.sector || 'PRIVATE',
        category: report.category || 'DRINKING',
        subCategory: report.subCategory || '',
        staff: report.staffAssignment || {},
        reportDate: format(new Date(), 'yyyy-MM-dd')
      };
    }
    return null;
  }, [report]);

  const calc = useMemo(() => {
    if (!report || !cloudRates) return null;

    const isFlushing = report.workType === 'FLUSHING' || 
                       report.purpose?.toLowerCase().includes('flushing') || 
                       report.category?.toLowerCase().includes('flushing');

    const yieldStatus = (report.remarks || '').toLowerCase().trim();
    const isDryWell = yieldStatus === 'dry well' || yieldStatus === 'dry' || yieldStatus === 'collapsed well' || yieldStatus === 'collapsed';
    
    const sector = (report.sector || '').toLowerCase();
    const category = (report.category || '').toLowerCase();
    const subCategory = (report.subCategory || '').toLowerCase();
    const purpose = (report.purpose || '').toLowerCase();
    
    const isPrivate = sector === 'private';
    const isDomestic = subCategory.includes('domestic') || category.includes('drinking') || subCategory.includes('drinking') || purpose.includes('drinking') || purpose.includes('domestic');
    const isAgri = subCategory.includes('agriculture') || purpose.includes('agriculture');

    const isDryWellCondition = isDryWell && !isFlushing;
    const isEligibleSectorForSubsidy = isPrivate && (isDomestic || isAgri);
    
    const isEligibleFor75Subsidy = isDryWellCondition && isEligibleSectorForSubsidy;
    const isAgriSubsidy = isPrivate && isAgri && !isFlushing && !isDryWell;

    const findRate = (searchLabel: string) => {
      if (!cloudRates?.services) return null;
      const normalizeStr = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9\u0D00-\u0D7F]/g, ''); 
      const target = normalizeStr(searchLabel);

      for (const service of cloudRates.services) {
        for (const item of service.items) {
          if (normalizeStr(item.nameMl) === target || normalizeStr(item.nameEn) === target) {
            const from = item.dateFrom || '0000-00-00';
            const to = item.dateTo || '9999-99-99';
            const today = format(new Date(), 'yyyy-MM-dd');
            if (today >= from && today <= to) return item.rate;
          }
        }
      }
      return null;
    };

    const LABEL_DRILLING = '110 മില്ലിമീറ്റർ വ്യാസമുള്ള കുഴൽക്കിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്ജ്';
    const LABEL_FLUSHING = 'ഫ്ലഷിംഗ് നടത്തിയ ആകെ ആഴം';
    const LABEL_PVC_6KG = '140 മില്ലിമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം / ച. സെ. മീ. പിവിസി കെയ്‌സിംഗ് പൈപ്പിന്റെ വില';
    const LABEL_PVC_10KG = '140 മില്ലിമീറ്റർ വ്യാസമുള്ള 10 കി.ഗ്രാം / ച. സെ. മീ. പിവിസി കെയ്‌സിംഗ് പൈപ്പിന്റെ വില';
    const LABEL_END_CAP = '140 മില്ലിമീറ്റർ വ്യാസമുള്ള പിവിസി കുഴൽക്കിണർ അടപ്പിന്റെ വില';

    const rate6kg = findRate(LABEL_PVC_6KG) || 0;
    const rate10kg = findRate(LABEL_PVC_10KG) || 0;
    const rateEndCap = findRate(LABEL_END_CAP) || 0;

    const materialSubtotalForGst = (parseFloat(report.pvc6kg || '0') * rate6kg) + 
                                  (parseFloat(report.pvc10kg || '0') * rate10kg) + 
                                  (report.hasEndCap ? rateEndCap : 0);
    
    const isGstThresholdMet = materialSubtotalForGst > 5000;

    let rows: any[] = [];
    let drillingItemTotal = 0;
    let totalBaseAmount = 0;
    let totalGstAmount = 0;
    let totalGrandAmount = 0;

    const processItem = (label: string, qty: number, isDrilling: boolean = false, customQtyStr?: string) => {
        const rate = findRate(label);
        if (rate === null) return { error: true, label };
        const baseAmt = qty * rate;
        
        let gstPercent = 0;
        // Drilling is always 0% as per departmental policy
        if (!isDrilling && isGstThresholdMet) {
            gstPercent = 0.18;
        }

        const gstAmt = baseAmt * gstPercent;
        const total = baseAmt + gstAmt;
        
        rows.push({ 
            label, 
            qtyStr: customQtyStr || (isDrilling && isFlushing ? (report.compressorWorkingHour || '2.5 hrs') : `${qty} m`), 
            rate, 
            amount: baseAmt, 
            gst: gstAmt, 
            total 
        });
        
        totalBaseAmount += baseAmt;
        totalGstAmount += gstAmt;
        totalGrandAmount += total;
        if (isDrilling) drillingItemTotal = total;
        return { error: false };
    };

    if (isFlushing) {
      const hours = parseFloat((report.compressorWorkingHour || '2.5').replace(/[^0-9.]/g, '')) || 2.5;
      const res = processItem(LABEL_FLUSHING, hours, true);
      if (res.error) return { error: true, missingItem: res.label };
    } else {
      const res = processItem(LABEL_DRILLING, parseFloat(report.totalDepth || '0'), true);
      if (res.error) return { error: true, missingItem: res.label };
    }

    const pvc6 = parseFloat(report.pvc6kg || '0');
    if (pvc6 > 0) processItem(LABEL_PVC_6KG, pvc6);
    const pvc10 = parseFloat(report.pvc10kg || '0');
    if (pvc10 > 0) processItem(LABEL_PVC_10KG, pvc10);
    
    if (report.hasEndCap) {
        processItem(LABEL_END_CAP, 1, false, "1 No.");
    }

    const roundedGross = Math.ceil(totalGrandAmount);
    let subsidyAmount = 0;
    let netPayable = roundedGross;

    if (isEligibleFor75Subsidy) {
      subsidyAmount = Math.ceil(drillingItemTotal * 0.75);
      netPayable = roundedGross - subsidyAmount;
    } else if (isAgriSubsidy) {
      subsidyAmount = Math.ceil(drillingItemTotal * 0.5);
      netPayable = roundedGross - subsidyAmount;
    }

    const remitted = parseFloat(report.remittance || '0');
    const balance = remitted - netPayable;
    const isRefund = balance >= 0;

    return { 
        rows, 
        totalBaseAmount,
        totalGstAmount,
        totalGrandAmount,
        roundedGross,
        subsidyAmount,
        netPayable,
        remitted, 
        balance, 
        isAgriSubsidy,
        isDryWellCondition,
        isEligibleSectorForSubsidy,
        isEligibleFor75Subsidy,
        isGstThresholdMet,
        isRefund
    };
  }, [report, cloudRates]);

  useEffect(() => {
    if (calc && !calc.error) {
      const balanceAmount = Math.round(Math.abs(calc.balance));
      if (balanceAmount === 0) {
        setMalayalamBalanceWords('പൂജ്യം രൂപ മാത്രം');
        return;
      }
      
      startTransition(async () => {
        try {
          const result = await convertNumberToMalayalam({ number: balanceAmount });
          setMalayalamBalanceWords(result.text + ' രൂപ മാത്രം');
        } catch (e) {
          console.error('Failed to convert number to Malayalam:', e);
          setMalayalamBalanceWords(balanceAmount.toLocaleString('en-IN') + ' രൂപ മാത്രം');
        }
      });
    }
  }, [calc]);

  const handleFillPdf = async () => {
    if (!report || !calc || !data) return;
    setIsPdfLoading(true);
    try {
      const existingPdfBytes = await fetch('/final-bill.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      const sectorSubCat = `${data.sector}/${data.subCategory || data.category}`;

      let netPayableLabel = 'കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക :';
      if (calc.isEligibleFor75Subsidy && calc.isEligibleSectorForSubsidy) {
          netPayableLabel = 'കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക (ഡ്രില്ലിംഗ് ചാർജിന്റെ 25%+പൈപ്പ്, അടപ്പ് ഉള്‍പ്പെടെ) :';
      }

      const mapping: Record<string, string | undefined> = {
        'file_no': report.fileNo,
        'date': formatTechnicalDate(data.reportDate),
        'site_name': report.nameOfSite,
        'lsgd': report.lsgd,
        'address': report.address,
        'status': report.remarks,
        'total_cost': calc.roundedGross.toString(),
        'remittance': calc.remitted.toString(),
        'balance': Math.abs(calc.balance).toString(),
        'balance_words': malayalamBalanceWords,
        'well_number': data.wellNumber,
        'sector_subcategory': sectorSubCat.toUpperCase(),
        'due_label': calc.isRefund ? 'അപേക്ഷകന് തിരികെ ലഭിക്കുന്ന തുക :' : 'ഭൂജലവകുപ്പിന് തിരികെ ലഭിക്കേണ്ട തുക :',
        'net_payable_label': netPayableLabel
      };

      Object.entries(mapping).forEach(([field, val]) => {
        try { 
            const textField = form.getTextField(field);
            if (textField) textField.setText(String(val || '')); 
        } catch(e) {}
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "PDF Error", description: "Could not fill the template." });
    } finally { setIsPdfLoading(false); }
  };

  const handleSaveToCloud = () => {
    if (!report || !isAllowed || !firestore) return;
    startTransition(() => {
        const docRef = doc(firestore, 'groundwaterReports', report.id);
        updateDoc(docRef, { status: 'Published' })
          .then(() => {
            toast({ title: 'Report Published', description: 'Technical records updated in ledger.' });
            router.push('/well-drilling');
          })
          .catch((error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update' }));
          });
    });
  };

  if (isReportLoading || isRatesLoading) return <div className="p-12 flex justify-center"><Skeleton className="h-[800px] w-full max-w-[800px]" /></div>;
  if (!report || !calc || !data) return null;

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
              <Link href="/well-drilling"><ArrowLeft className="h-3 w-3" /> Back to Portal</Link>
            </Button>
            <div className="flex items-center gap-3">
              <Button onClick={handleFillPdf} disabled={isPdfLoading} variant="outline" className="gap-2 font-bold border-blue-200 text-blue-700 h-8 text-xs px-6 bg-blue-50">
                {isPdfLoading ? <Loader2 className="size-3 animate-spin" /> : <FileOutput className="size-3" />}
                OPEN AS FILLABLE PDF
              </Button>
              {!calc.error && <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs px-6 rounded-lg shadow-lg"><Printer className="h-3 w-3" /> Print Preview</Button>}
              <Button onClick={handleSaveToCloud} disabled={isPending} className="gap-2 font-bold bg-emerald-600 text-white h-8 text-xs px-6 rounded-lg shadow-lg">
                {isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Publish Record
              </Button>
            </div>
        </div>
        
        {calc.error && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 py-6 rounded-2xl">
            <ShieldAlert className="size-6 text-rose-600" />
            <AlertTitle className="text-sm font-black uppercase tracking-tight ml-2">Rate Configuration Missing</AlertTitle>
            <AlertDescription className="text-xs font-bold text-rose-800 ml-2 mt-2 leading-relaxed">
              No valid rate found for technical item: <span className="underline font-black">{calc.missingItem}</span>.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {!calc.error && (
        <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[12px] leading-tight text-black border border-slate-200 print:border-none relative">
          
          <div className="absolute top-[40px] left-[40px] text-left">
            <p className="text-[12px] font-black text-black leading-none">({data.wellNumber || 'WELL NUMBER'})</p>
          </div>

          <div className="absolute top-[40px] right-[40px] text-right uppercase">
            <p className="text-[12px] font-black text-black leading-none">{data.sector}/{data.subCategory || data.category}</p>
          </div>

          <div className="flex justify-between items-start mb-6 pt-8 text-left">
            <div className="flex-1">
                <h1 className="text-[16px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
                <h2 className="text-[12px] font-bold uppercase mt-1">കുഴൽ കിണർ നിർമ്മാണം - അന്തിമ ബിൽ</h2>
            </div>
            <div className="text-right text-[10px] leading-tight font-bold w-[220px]">
              <p>District Office</p>
              <p>Ground Water Department,</p>
              <p>B1-block, Civil Station, Malappuram -676505</p>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-black mb-6 text-[13px] text-left">
            <div className="border-r border-black p-2 px-4 flex justify-between"><span>ഫയൽ നമ്പർ:</span> <span className="font-bold">{report.fileNo}</span></div>
            <div className="p-2 px-4 flex justify-between"><span>തീയതി:</span> <span className="font-bold">{formatTechnicalDate(data.reportDate)}</span></div>
          </div>

          <div className="mb-6 border border-black text-[11px] text-left">
            {[
                { l: 'സൈറ്റിന്റെ പേര്', v: report.nameOfSite },
                { l: 'പഞ്ചായത്ത്/നഗസഭ', v: report.lsgd },
                { l: 'നിയമസഭ മണ്ഡലം', v: report.assembly },
                { l: 'വിലാസം', v: report.address },
                { l: 'കുഴൽ കിണറിന്റെ നിലവിലെ സ്ഥിതി', v: data.remarks },
            ].map((row, i) => (
                <div key={i} className="grid grid-cols-[200px_1fr] border-b border-black last:border-b-0">
                    <div className="border-r border-black p-2 px-4 font-medium">{row.l}</div>
                    <div className="p-2 px-4 font-bold uppercase truncate">{row.v}</div>
                </div>
            ))}
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse border border-black text-center text-[10px]">
              <thead className="bg-slate-50 border-b border-black">
                <tr className="font-bold h-10">
                  <th className="border-r border-black p-1 w-10">ക്രമ നമ്പർ</th>
                  <th className="border-r border-black p-1 text-left px-3">ഇനം</th>
                  <th className="border-r border-black p-1 w-18">അളവ്</th>
                  <th className="border-r border-black p-1 w-18">നിരക്ക്</th>
                  <th className="border-r border-black p-1 w-24">തുക</th>
                  <th className="border-r border-black p-1 w-16">GST</th>
                  <th className="p-1 w-24">മൊത്തം തുക</th>
                </tr>
              </thead>
              <tbody>
                {calc.rows.map((row, i) => (
                  <tr key={i} className="h-9 border-b border-black last:border-b-0">
                    <td className="border-r border-black">{i + 1}</td>
                    <td className="border-r border-black text-left px-3 font-medium uppercase text-[9px] leading-tight">{row.label}</td>
                    <td className="border-r border-black font-bold">{row.qtyStr}</td>
                    <td className="border-r border-black">{row.rate?.toFixed(2) ?? '0.00'}</td>
                    <td className="border-r border-black">₹{row.amount?.toFixed(2) ?? '0.00'}</td>
                    <td className="border-r border-black">₹{row.gst?.toFixed(2) ?? '0.00'}</td>
                    <td className="font-bold">₹{row.total?.toFixed(2) ?? '0.00'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-black bg-slate-50/30">
                <tr className="h-10 font-black text-black">
                   <td colSpan={4} className="border-r border-black text-right px-4 uppercase text-[9px]">Grand Total Calculation :</td>
                   <td className="border-r border-black text-center">₹{calc.totalBaseAmount.toFixed(2)}</td>
                   <td className="border-r border-black text-center">₹{calc.totalGstAmount.toFixed(2)}</td>
                   <td className="text-center bg-blue-50/20">₹{calc.totalGrandAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border border-black text-left font-bold text-[11px] leading-tight">
              <div className="flex justify-between items-center p-3 border-b border-black">
                  <span className="max-w-[480px]">കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തിയുടെ ആകെ ചിലവ് :</span>
                  <span className="font-black text-[13px]">₹ {calc.roundedGross.toFixed(2)}</span>
              </div>

              {calc.isEligibleFor75Subsidy && (
                <div className="flex justify-between items-center p-3 border-b border-black text-red-600 bg-red-50/20">
                    <span className="flex-1 uppercase text-[10px] tracking-tight">
                        ഫലശൂന്യമായ കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തി - ഡ്രില്ലിംഗ് ചാർജിന്റെ 75% ഇളവ് :
                    </span>
                    <span className="font-black text-[13px]">₹ {calc.subsidyAmount.toFixed(2)}</span>
                </div>
              )}

              {calc.isAgriSubsidy && !calc.isEligibleFor75Subsidy && (
                 <div className="flex justify-between items-center p-3 border-b border-black text-red-600 bg-red-50/20">
                    <span className="flex-1 uppercase text-[10px] tracking-tight">
                        നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള ധനസഹായം - ഡ്രില്ലിംഗ് ചാർജിന്റെ 50% :
                    </span>
                    <span className="font-black text-[13px]">₹ {calc.subsidyAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center p-3 border-b border-black text-[#1e3a8a] bg-blue-50/10">
                  <span className="max-w-[480px] uppercase text-justify">
                    {(calc.isEligibleFor75Subsidy)
                        ? "കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക (ഡ്രില്ലിംഗ് ചാർജിന്റെ 25%+പൈപ്പ്, അടപ്പ് ഉള്‍പ്പെടെ) :" 
                        : "കുഴൽക്കിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക :"
                    }
                  </span>
                  <span className="font-black text-[14px]">₹ {calc.netPayable.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-3 border-b border-black bg-slate-50">
                  <span className="text-slate-500 uppercase text-[10px]">അപേക്ഷകൻ മുൻകൂറായി അടച്ചിട്ടുള്ള തുക :</span>
                  <span className="font-black">₹ {calc.remitted.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white">
                  <span className="text-[#1e3a8a] font-black uppercase text-[11px]">
                    {calc.isRefund ? "അപേക്ഷകന് തിരികെ ലഭിക്കുന്ന തുക :" : "ഭൂജലവകുപ്പിന് തിരികെ ലഭിക്കേണ്ട തുക :"}
                  </span>
                  <div className="text-right">
                    <p className="font-black text-[16px] text-[#1e3a8a]">₹ {Math.abs(calc.balance).toFixed(2)}</p>
                    <p className="text-[9px] italic font-normal text-slate-500 mt-1">
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : malayalamBalanceWords}
                    </p>
                  </div>
              </div>
          </div>

          <div className="mt-auto flex flex-col items-end pt-16">
            <div className="text-center min-w-[200px] space-y-1">
              <p className="font-bold">വിശ്വസ്തതയോടെ,</p>
              <div className="h-16"></div>
              <p className="font-bold text-[14px] uppercase border-t border-black pt-1">ജില്ലാ ഓഫീസർ</p>
            </div>
          </div>

          <div className="mt-8 pt-2 border-t border-slate-200 text-[8px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-black">
            <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
            <span>OFFICIAL FINAL BILL RECORD</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinalBillPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-primary font-bold animate-pulse">Preparing Final Bill...</div>}>
      <BillContent />
    </Suspense>
  );
}
