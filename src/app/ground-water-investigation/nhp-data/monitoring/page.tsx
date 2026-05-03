'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Activity, Calendar, MapPin, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NHPMonitoringPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    stationId: '',
    stationName: '',
    monitoringDate: new Date().toISOString().split('T')[0],
    monitoringTime: '',
    wellType: '',
    measuringPointHeight: '',
    depthToWaterLevel: '',
    recordedBy: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Data Recorded",
      description: "The NHP water level monitoring entry has been saved successfully."
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
        <PageHeader title="NHP Water Level Monitoring" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-primary/10">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Station Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Station ID / Site Code</Label>
              <Input 
                placeholder="e.g. MPM-PZ-042"
                value={formData.stationId}
                onChange={(e) => setFormData({...formData, stationId: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Station Name</Label>
              <Input 
                placeholder="Location Name"
                value={formData.stationName}
                onChange={(e) => setFormData({...formData, stationName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Type of Monitoring Well</Label>
              <Select onValueChange={(v) => setFormData({...formData, wellType: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piezometer">Piezometer</SelectItem>
                  <SelectItem value="observation_well">Observation Well</SelectItem>
                  <SelectItem value="dug_well">Dug Well</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Measuring Point Height (magl)</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Height in meters"
                value={formData.measuringPointHeight}
                onChange={(e) => setFormData({...formData, measuringPointHeight: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-blue-500/10">
          <CardHeader className="bg-blue-500/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Measurement Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Date of Monitoring</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  className="pl-9"
                  value={formData.monitoringDate}
                  onChange={(e) => setFormData({...formData, monitoringDate: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Time</Label>
              <Input 
                type="time" 
                value={formData.monitoringTime}
                onChange={(e) => setFormData({...formData, monitoringTime: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Depth to Water Level (mbmp)</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                className="font-bold text-blue-600"
                value={formData.depthToWaterLevel}
                onChange={(e) => setFormData({...formData, depthToWaterLevel: e.target.value})}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            <Input 
              placeholder="Observer Name" 
              className="h-8 w-48 text-xs border-transparent bg-transparent focus:bg-white"
              value={formData.recordedBy}
              onChange={(e) => setFormData({...formData, recordedBy: e.target.value})}
            />
          </div>
          <Button type="submit" className="gap-2 px-8 h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
            <Save className="h-4 w-4" />
            Save Monitoring Data
          </Button>
        </div>
      </form>
    </div>
  );
}
