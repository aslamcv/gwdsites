'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Droplet, Waves, PlusCircle, ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PumpingTestOtherDistrictPage() {
  const districts = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Kozhikode', 
    'Wayanad', 'Kannur', 'Kasaragod'
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pumping-test">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader title="Other District Pumping Test Operations" />
        </div>
        
        <Select>
          <SelectTrigger className="w-[220px] h-11 border-primary/30 bg-white text-primary font-black uppercase tracking-widest text-[10px] shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <SelectValue placeholder="Select District" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            {districts.map(d => (
              <SelectItem key={d} value={d} className="font-bold text-xs uppercase">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl">
        {/* Open Well Card */}
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Waves className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Open Well / Pond</CardTitle>
            <CardDescription>Manage yield and recovery tests for open groundwater structures in external districts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11 font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700">
              <Link href="/pumping-test/other-district/open-well">
                <PlusCircle className="mr-2 h-4 w-4" />
                Site Entry
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Bore Well Card */}
        <Card className="group hover:border-emerald-500/50 transition-all border-2 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Droplet className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Bore Well (SDT)</CardTitle>
            <CardDescription>Record Step Drawdown Test data and technical summaries for borewells outside Malappuram.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11 font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700">
              <Link href="/pumping-test/other-district/bore-well">
                <PlusCircle className="mr-2 h-4 w-4" />
                Site Entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* District Selection Context */}
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-bold text-slate-800">Inter-District Operations</h3>
          <p className="text-sm text-muted-foreground">Ensure the correct district is selected within the technical form for accurate billing and records.</p>
        </div>
        <Button variant="secondary" className="font-black uppercase tracking-widest gap-2">
          View Past External Tests
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
