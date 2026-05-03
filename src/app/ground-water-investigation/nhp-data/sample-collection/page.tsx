'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Beaker, Calendar, MapPin, FlaskConical, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function NHPSampleCollectionPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    stationId: '',
    siteName: '',
    collectionDate: new Date().toISOString().split('T')[0],
    sampleType: 'chemical',
    containerType: '',
    preservation: 'None',
    collectedBy: '',
    remarks: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Sample Recorded",
      description: "Technical sample collection details have been successfully saved."
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
        <PageHeader title="NHP Water Quality Sample Collection" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 border-none shadow-sm ring-1 ring-primary/10">
            <CardHeader className="bg-primary/5 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Station Code</Label>
                <Input 
                  placeholder="e.g. MPM-WQ-01"
                  value={formData.stationId}
                  onChange={(e) => setFormData({...formData, stationId: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Site Name</Label>
                <Input 
                  placeholder="Enter location"
                  value={formData.siteName}
                  onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Date of Collection</Label>
                <Input 
                  type="date" 
                  value={formData.collectionDate}
                  onChange={(e) => setFormData({...formData, collectionDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Collected By</Label>
                <Input 
                  placeholder="Name of Staff"
                  value={formData.collectedBy}
                  onChange={(e) => setFormData({...formData, collectedBy: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-emerald-500/10">
            <CardHeader className="bg-emerald-500/5 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Sample Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Analysis Type</Label>
                <Select onValueChange={(v) => setFormData({...formData, sampleType: v})} defaultValue={formData.sampleType}>
                  <SelectTrigger className="border-emerald-100 bg-emerald-50/30 font-bold text-emerald-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chemical">Chemical Analysis</SelectItem>
                    <SelectItem value="isotope">Isotope Analysis</SelectItem>
                    <SelectItem value="trace_element">Trace Elements</SelectItem>
                    <SelectItem value="bacteriological">Bacteriological</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Container</Label>
                <Select onValueChange={(v) => setFormData({...formData, containerType: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bottle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plastic_500">500ml Plastic</SelectItem>
                    <SelectItem value="plastic_1000">1L Plastic</SelectItem>
                    <SelectItem value="glass">Glass Bottle</SelectItem>
                    <SelectItem value="sterile">Sterile Bag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-primary/10">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Observations & Remarks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Preservation Method</Label>
                <Input 
                  value={formData.preservation}
                  onChange={(e) => setFormData({...formData, preservation: e.target.value})}
                  placeholder="e.g. HNO3 Addition / Refridgeration"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Field Remarks</Label>
              <Textarea 
                placeholder="Note down any site conditions, smell, or color observed during collection..."
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2 px-12 h-14 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 text-white">
            <Save className="h-5 w-5" />
            Log Sample Entry
          </Button>
        </div>
      </form>
    </div>
  );
}
