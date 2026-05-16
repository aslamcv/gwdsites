
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { GroundwaterReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function numberToMalayalamWords(num: number): string {
  if (num <= 0) return 'പൂജ്യം രൂപ മാത്രം';
  const rounded = Math.round(num);
  return `${rounded.toLocaleString('en-IN')} രൂപ (അക്ഷരത്തിൽ)`;
}

function BillContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const id = searchParams.get('id');
  
  const reportRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groundwaterReports', id);
  }, [firestore, id]);

  const { data: report, isLoading } = useDoc<GroundwaterReport>(reportRef);

  // Fetch central service rates from appSettings/service_rates
  const ratesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'appSettings', 'service_rates');
  }, [firestore]);

  const { data: cloudRates, isLoading: isRatesLoading } = useDoc(ratesRef);

  const calc = useMemo(() => {
    if (!report) return null;

    const isFlushing = report.workType === 'FLUSHING' || 
                       report.purpose?.toLowerCase().includes('flushing') || 
                       report.category?.toLowerCase().includes('flushing');

    const yieldStatus = (report.remarks || '').toLowerCase().trim();
    const isDryWell = yieldStatus === 'dry well' || yieldStatus === 'dry' || yieldStatus === 'collapsed well' || yieldStatus === 'collapsed';
    const isPrivate = report.sector?.toLowerCase() === 'private';
    const isAgri = (report.subCategory || report.category || report.purpose)?.toLowerCase().includes('agriculture');

    const isDryWellPrivate = isPrivate && isDryWell && !isFlushing;
    const isAgriSubsidy = isPrivate && isAgri && !isFlushing && ['low yield', 'medium yield', 'high yield'].includes(yieldStatus);

    // HELPER: Normalize date for reliable comparison (YYYY-MM-DD)
    const normalizeDate = (d: string) => {
      if (!d) return '';
      const trimmed = d.trim();
      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      // Handle DD-MM-YYYY or DD/MM/YYYY
      const parts = trimmed.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return trimmed;
    };

    // Reference Date: Strictly use End Date (Opt) -> fallback to start or report date if missing
    // We access report.endDate/startDate directly from the document fields
    const rawWorkEndDate = (report.endDate || report.startDate || report.reportDate || '').trim();
    const refDate = normalizeDate(rawWorkEndDate);

    const findRate = (keywords: string[]) => {
      if (!cloudRates?.services || !refDate) return null;
      
      const normalizeKeyword = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedKeywords = keywords.map(kw => normalizeKeyword(kw));

      for (const service of cloudRates.services) {
        for (const item of service.items) {
          const normalizedItemName = normalizeKeyword(item.name);
          const isMatch = normalizedKeywords.every(kw => normalizedItemName.includes(kw));
          
          if (isMatch) {
            const from = item.dateFrom || '0000-00-00';
            const to = item.dateTo || '9999-99-99';
            
            // STRICT Date Range Matching: refDate >= from AND refDate <= to
            if (refDate >= from && refDate <= to) {
              return item.rate;
            }
          }
        }
      }
      return null;
    };

    const diameter = (report.borewellSize || '').match(/\d+/)?.[0] || '150';

    const rawRates = {
      drilling: findRate([diameter, 'Drilling']),
      pvc6: findRate(['6kg']),
      pvc10: findRate(['10kg']),
      endCap: findRate(['End Cap']),
      flushingMin: findRate(['Flushing'])
    };

    // Validation: Strict matching - if rate is null, return error context
    if (!isFlushing && rawRates.drilling === null) return { error: true, refDate };
    if (isFlushing && rawRates.flushingMin === null) return { error: true, refDate };

    let rows: any[] = [];
    let finalDrillingAmt = 0;
    
    if (isFlushing) {
      const workingHoursStr = report.compressorWorkingHour || '2.5';
      const hours = parseFloat(workingHoursStr.replace(/[^0-9.]/g, '')) || 2.5;
      const baseRate = rawRates.flushingMin!;
      const hourlyRate = baseRate / 2.5;
      const flushingCharge = hours > 2.5 ? (hourlyRate * hours) : baseRate;

      rows.push({ 
        label: 'ഫ്ലഷിംഗ് നടത്തിയ ആകെ ആഴം', 
        qty: `${report.totalDepth || '0'} m`, 
        rate: flushingCharge, 
        unit: 'Lump Sum',
        isSpecial: true,
        extraInfo: `(Compressor working time: ${workingHoursStr})`,
        amount: flushingCharge,
        total: flushingCharge
      });
      finalDrillingAmt = flushingCharge;
    } else {
      const drillingQty = parseFloat(report.totalDepth || '0');
      const baseRate = rawRates.drilling!;
      const baseDrillingAmt = drillingQty * baseRate;
      finalDrillingAmt = baseDrillingAmt;
      
      if (isDryWellPrivate) {
          finalDrillingAmt = Math.ceil(baseDrillingAmt * 0.25);
      } else if (isAgriSubsidy) {
          finalDrillingAmt = Math.ceil(baseDrillingAmt * 0.5);
      }

      rows.push({ 
        label: 'ഡ്രില്ലിംഗ് നടത്തിയ ആകെ ആഴം', 
        qty: `${drillingQty} m`, 
        rate: baseRate, 
        unit: 'm',
        amount: baseDrillingAmt,
        total: finalDrillingAmt 
      });
    }

    if (!isDryWellPrivate) {
      const pvc6Qty = parseFloat(report.pvc6kg || '0');
      if (pvc6Qty > 0) {
        if (rawRates.pvc6 === null) return { error: true, refDate };
        const amt = pvc6Qty * rawRates.pvc6;
        rows.push({ label: '140 മി.മീ PVC Pipe (6kg/cm²)', qty: `${pvc6Qty} m`, rate: rawRates.pvc6, unit: 'm', amount: amt, total: amt });
      }
      const pvc10Qty = parseFloat(report.pvc10kg || '0');
      if (pvc10Qty > 0) {
        if (rawRates.pvc10 === null) return { error: true, refDate };
        const amt = pvc10Qty * rawRates.pvc10;
        rows.push({ label: '140 മി.മീ PVC Pipe (10kg/cm²)', qty: `${pvc10Qty} m`, rate: rawRates.pvc10, unit: 'm', amount: amt, total: amt });
      }
      if (pvc6Qty > 0 || pvc10Qty > 0) {
        if (rawRates.endCap === null) return { error: true, refDate };
        const amt = rawRates.endCap;
        rows.push({ label: 'End Cap', qty: '1 No.', rate: rawRates.endCap, unit: 'No.', amount: amt, total: amt });
      }
    } else {
        rows.push({ label: '140 മി.മീ PVC Pipe (6kg/cm²)', qty: '---', rate: '---', unit: 'm', amount: 0, total: 0, isPlaceholder: true });
        rows.push({ label: 'End Cap', qty: '---', rate: '---', unit: 'No.', amount: 0, total: 0, isPlaceholder: true });
    }

    const grandTotal = rows.reduce((sum, r) => sum + (r.isPlaceholder ? 0 : r.total), 0);
    const remitted = parseFloat(report.remittance || '0');
    const balance = remitted - grandTotal;

    return { 
        rows, 
        grandTotal, 
        remitted, 
        balance, 
        isFlushing, 
        isDryWellPrivate, 
        isAgriSubsidy,
        finalDrillingAmt,
        refDate
    };
  }, [report, cloudRates]);

  if (isLoading || isRatesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <Skeleton className="h-[1000px] w-full max-w-[800px] bg-white shadow-xl rounded-none" />
      </div>
    );
  }

  if (!report || !calc) return null;

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-4 pt-12 print:bg-white print:p-0 font-malayalam text-black">
      <div className="max-w-[210mm] mx-auto mb-2 flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2 text-slate-600 h-8 text-xs">
              <Link href="/well-drilling">
                <ArrowLeft className="h-3 w-3" />
                Back to Portal
              </Link>
            </Button>
            {!calc.error && (
              <Button onClick={() => window.print()} className="gap-2 font-bold bg-[#1e3a8a] text-white h-8 text-xs px-6 rounded-lg">
                <Printer className="h-3 w-3" />
                Print Final Bill
              </Button>
            )}
        </div>
        
        {calc.error ? (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 py-6 rounded-2xl animate-in fade-in zoom-in duration-300">
            <ShieldAlert className="size-6 text-rose-600" />
            <AlertTitle className="text-sm font-black uppercase tracking-tight ml-2">Rate Configuration Missing</AlertTitle>
            <AlertDescription className="text-xs font-bold text-rose-800 ml-2 mt-2 leading-relaxed">
              No valid rate found for the selected End Date (Opt): <span className="underline">{calc.refDate}</span>. 
              <br/>Please update the <strong>Services & Rates Catalog</strong> in the Administration panel to include a validity period for this date.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-blue-50 border-blue-200 py-3 rounded-xl">
              <AlertCircle className="size-4 text-blue-600" />
              <AlertDescription className="text-[11px] font-black text-blue-800 uppercase tracking-tight">
                  Rate applied based on End Date (Opt): {calc.refDate}
              </AlertDescription>
          </Alert>
        )}
      </div>

      {!calc.error && (
        <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-[15mm] flex flex-col text-[13px] leading-tight text-black border border-slate-200 print:border-none overflow-hidden relative">
          
          <div className="absolute top-10 left-10 text-left uppercase">
            <p className="text-[12px] font-black text-black leading-none">
              ({report.wellNumber || 'WELL NUMBER'})
            </p>
          </div>

          <div className="absolute top-10 right-10 text-right uppercase">
            <p className="text-[12px] font-bold text-black leading-none">
              {(report.sector || 'PRIVATE').toUpperCase()}/{(report.subCategory || report.category || (calc.isFlushing ? 'FLUSHING' : 'DRILLING')).toUpperCase()}
            </p>
          </div>

          <div className="flex justify-between items-start mb-4">
            <div className="text-center flex-1 pr-4 pl-12">
              <h1 className="text-[18px] font-bold">ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്, മലപ്പുറം</h1>
              <h2 className="text-[14px] font-bold underline underline-offset-4 decoration-1 uppercase">
                അന്തിമ ബിൽ ({report.borewellSize || '150 മി.മീ.'}) - {calc.isFlushing ? 'കുഴൽ കിണർ ഫ്ലഷിംഗ്' : 'കുഴൽ കിണർ നിർമ്മാണം'}
              </h2>
            </div>
            <div className="text-right text-[10px] leading-tight font-bold italic w-[180px]">
              <p>District Office</p>
              <p>Ground Water Department,</p>
              <p>B1-block, Civil Station,</p>
              <p>Malappuram - 676505</p>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-black mb-4 text-[14px] text-left">
            <div className="border-r border-black p-2 px-4">ഫയൽ നമ്പർ: <span className="font-bold ml-2">{report.fileNo}</span></div>
            <div className="p-2 px-4 text-right">തീയതി: <span className="font-bold ml-2">{report.reportDate}</span></div>
          </div>

          <div className="mb-4 text-left">
            <div className="border border-black text-[14px]">
              <div className="grid grid-cols-[200px_1fr] border-b border-black">
                <div className="border-r border-black p-2 px-4 font-bold bg-slate-50 text-[11px] uppercase">സൈറ്റിന്റെ പേര്</div>
                <div className="p-2 px-4 font-bold uppercase">{report.nameOfSite}</div>
              </div>
              <div className="grid grid-cols-[200px_1fr] border-b border-black">
                <div className="border-r border-black p-2 px-4 font-bold bg-slate-50 text-[11px] uppercase">പഞ്ചായത്ത് / നഗരസഭ</div>
                <div className="p-2 px-4 font-bold uppercase">{report.lsgd}</div>
              </div>
              <div className="grid grid-cols-[200px_1fr]">
                <div className="border-r border-black p-2 px-4 font-bold bg-slate-50 text-[11px] uppercase">വിലാസം</div>
                <div className="p-2 px-4 font-bold uppercase truncate">{report.address}</div>
              </div>
            </div>
          </div>

          <div className="mb-4 text-left">
            <table className="w-full border-collapse border border-black text-center text-[12px]">
              <thead className="bg-slate-50">
                <tr className="font-bold h-10">
                  <th className="border border-black p-2 w-12">ക്ര.നം</th>
                  <th className="border border-black p-2 text-left">ഇനം</th>
                  <th className="border border-black p-2 w-24">അളവ്</th>
                  <th className="border border-black p-2 w-24">നിരക്ക്</th>
                  <th className="border border-black p-2 w-32">ആകെ തുക</th>
                </tr>
              </thead>
              <tbody>
                {calc.rows.map((row, i) => (
                  <tr key={i} className="min-h-[32px]">
                    <td className="border border-black p-2">{i + 1}</td>
                    <td className="border border-black p-2 text-left font-bold relative">
                      {row.label}
                      {row.extraInfo && <span className="block text-[10px] font-normal italic mt-1">{row.extraInfo}</span>}
                    </td>
                    <td className="border border-black p-2 font-bold">{row.isPlaceholder ? '---' : row.qty}</td>
                    <td className="border border-black p-2 font-black">{row.isPlaceholder ? '---' : (typeof row.rate === 'number' ? row.rate.toFixed(2) : row.rate)}</td>
                    <td className="border border-black p-2 font-bold">{row.isPlaceholder ? '---' : (row.amount || row.total).toFixed(2)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 5 - calc.rows.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="h-8">
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(calc.isDryWellPrivate || calc.isAgriSubsidy) && (
            <div className="mb-4 p-4 border-x border-b border-black text-left font-bold text-[11.5px] leading-tight">
              <div className="flex justify-between items-start">
                  <span className={cn("max-w-[400px]", calc.isAgriSubsidy && "text-red-600")}>
                      {calc.isDryWellPrivate 
                          ? "കുഴൽ കിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് വകുപ്പിന് ലഭിക്കേണ്ട തുക (ഡ്രില്ലിംഗ് ചാർജിന്റെ 25%):"
                          : "ഡ്രില്ലിംഗ് ചാർജ്ജ് സബ് സിഡി തുക( 50%)"
                      }
                  </span>
                  <div className="text-right font-mono text-[13px]">
                    <p>= {calc.finalDrillingAmt.toFixed(2)}/-</p>
                  </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mb-6 text-left">
            <div className="w-[400px] border border-black font-bold text-[14px]">
              <div className="grid grid-cols-[1fr_140px] border-b border-black">
                <div className="border-r border-black p-2 px-4 text-right font-medium">മൊത്തം തുക :</div>
                <div className="p-2 text-center">
                  ₹ {calc.grandTotal.toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_140px] border-b border-black">
                <div className="border-r border-black p-2 px-4 text-right uppercase text-[10px]">Total Amount Remitted :</div>
                <div className="p-2 text-center font-black">₹ {calc.remitted.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-[1fr_140px] border-b border-black bg-slate-50">
                <div className="border-r border-black p-2 px-4 text-right">അപേക്ഷകന് തിരികെ നൽകേണ്ട തുക :</div>
                <div className="p-2 text-center font-black text-primary">₹ {calc.balance.toFixed(2)}</div>
              </div>
              <div className="p-2 px-4 text-right italic font-normal text-[11px] leading-tight">
                {numberToMalayalamWords(calc.balance)}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end pt-6 text-left">
            <div className="text-center min-w-[200px]">
              <div className="h-20 w-full"></div>
              <p className="font-bold text-[14px] uppercase border-t border-black pt-1">ജില്ലാ ഓഫീസർ</p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 text-[9px] text-muted-foreground flex justify-between uppercase tracking-widest font-sans font-bold">
            <span>GROUND WATER DEPARTMENT DISTRICT OFFICE, MALAPPURAM</span>
            <span>OFFICIAL TECHNICAL RECORD</span>
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
