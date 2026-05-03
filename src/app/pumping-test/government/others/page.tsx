'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, ArrowLeft, Droplet, Waves, ArrowRight, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PumpingTestGovernmentOthersPage() {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState('Pumping test for government water supply scheme.');
  const [tempPurpose, setTempPurpose] = useState('');
  const [isPurposeDialogOpen, setIsPurposeDialogOpen] = useState(false);

  useEffect(() => {
    const savedPurpose = localStorage.getItem('gwd_others_pumping_test_purpose');
    if (savedPurpose) {
      setPurpose(savedPurpose);
    }
  }, []);

  const handleSavePurpose = () => {
    setPurpose(tempPurpose);
    localStorage.setItem('gwd_others_pumping_test_purpose', tempPurpose);
    setIsPurposeDialogOpen(false);
    toast({
      title: "Purpose Updated",
      description: "The pumping test purpose details have been successfully saved.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pumping-test/government">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader title="Other Pumping Tests (Government)" />
        </div>
        
        <Dialog open={isPurposeDialogOpen} onOpenChange={setIsPurposeDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setTempPurpose(purpose)} className="font-bold border-primary/20 text-primary">
              <ClipboardList className="mr-2 h-4 w-4" />
              Project Purpose
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Pumping Test Purpose</DialogTitle>
              <DialogDescription>
                Define the specific objectives for this government pumping test category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="purpose-text">Purpose Details</Label>
                <Textarea 
                  id="purpose-text" 
                  placeholder="e.g., 24-hour constant discharge test..." 
                  className="min-h-[150px]"
                  value={tempPurpose}
                  onChange={(e) => setTempPurpose(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPurposeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePurpose}>
                <Save className="mr-2 h-4 w-4" />
                Save Purpose
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 max-w-2xl">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Defined Mission</h4>
        <p className="text-sm italic text-muted-foreground">{purpose || "No specific purpose defined yet."}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl">
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Waves className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">RECENT OPEN WELL/POND PUMPING TEST</CardTitle>
            <CardDescription>Record yield data for miscellaneous government open structures.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11 font-bold uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700">
              <Link href="/pumping-test/government/others/open-well">
                START PUMPING TEST ENTRY
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-emerald-500/50 transition-all border-2 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Droplet className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">RECENT BORE WELL PUMPING TEST</CardTitle>
            <CardDescription>Log technical pumping logs for miscellaneous government borewells.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full h-11 font-bold uppercase tracking-widest gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href="/pumping-test/government/others/bore-well">
                START PUMPING TEST ENTRY
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
