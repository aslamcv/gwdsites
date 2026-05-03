'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, ClipboardList, Settings, Wrench, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function NHPOthersPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    siteId: '',
    activityType: '',
    workDate: new Date().toISOString().split('T')[0],
    details: '',
    staffInvolved: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Log Saved",
      description: "The miscellaneous NHP activity log has been recorded."
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ground-water-investigation/nhp-data">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader title="Other NHP Field Activities" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Activity Log
            </CardTitle>
            <CardDescription>Record maintenance, calibration, or site inspection activities.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Site ID / Station</Label>
                <Input 
                  placeholder="e.g. MPM-NHP-ST-05"
                  value={formData.siteId}
                  onChange={(e) => setFormData({...formData, siteId: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Activity Category</Label>
                <Input 
                  placeholder="e.g. Sensor Calibration / Site Clearing"
                  value={formData.activityType}
                  onChange={(e) => setFormData({...formData, activityType: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Date</Label>
                <Input 
                  type="date" 
                  value={formData.workDate}
                  onChange={(e) => setFormData({...formData, workDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Staff Involved</Label>
                <Input 
                  placeholder="Names of staff"
                  value={formData.staffInvolved}
                  onChange={(e) => setFormData({...formData, staffInvolved: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                <ClipboardList className="h-3 w-3" />
                Work Details & Observations
              </Label>
              <Textarea 
                placeholder="Describe the technical work performed..."
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                className="min-h-[150px]"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-bold uppercase mb-1">Notice:</p>
            This module is intended for capturing metadata and non-routine activities that are not covered by standard Monitoring or Sample Collection forms.
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2 px-12 h-14 font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-900 shadow-xl shadow-slate-200 text-white">
            <Save className="h-5 w-5" />
            Save Activity Log
          </Button>
        </div>
      </form>
    </div>
  );
}
