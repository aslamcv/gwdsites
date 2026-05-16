'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FileStack, Loader2, ArrowRight } from 'lucide-react';

/**
 * Dialog component to search for records by File No and generate a consolidated feasibility report.
 */
export function ConsolidatedFeasibilityDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [fileNo, setFileNo] = useState('');

  const handleGenerate = () => {
    if (!fileNo.trim()) return;
    const encodedFileNo = encodeURIComponent(fileNo.trim());
    window.open(`/report/consolidated-feasibility?fileNo=${encodedFileNo}`, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader>
          <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <FileStack className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Consolidated Report</DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase text-slate-400 mt-2 tracking-widest">
            Generate a single feasibility report for multiple sites under the same File Reference.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Official File Number</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                <Input 
                    value={fileNo}
                    onChange={(e) => setFileNo(e.target.value)}
                    placeholder="e.g. MPM/GWD/2024/..." 
                    className="h-12 pl-10 bg-slate-50 border-slate-100 rounded-xl font-bold uppercase focus:bg-white transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button 
            onClick={handleGenerate} 
            disabled={!fileNo.trim()}
            className="w-full h-14 rounded-2xl bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[11px] gap-2 shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-95"
          >
            GENERATE CONSOLIDATED REPORT
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
