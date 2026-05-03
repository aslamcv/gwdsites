'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pickaxe, Wind, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OtherDistrictWellPage() {
  const districts = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ].filter(d => d !== 'Malappuram');

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <PageHeader 
        title="Other District Well Operations" 
        actions={
          <div className="flex items-center gap-2">
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
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Pickaxe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Other District Drilling Entry</CardTitle>
            <CardDescription>Record construction details for sites outside Malappuram district.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 font-bold uppercase tracking-widest gap-2">
              <Link href="/well-drilling/other-district/drilling-entry">
                Start Drilling Entry
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:border-accent/50 transition-all border-2 shadow-sm">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Wind className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Other District Flushing Entry</CardTitle>
            <CardDescription>Log well cleaning and maintenance for external district projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full h-12 font-bold uppercase tracking-widest gap-2 border-accent/20 text-primary hover:bg-accent/5">
              <Link href="/well-drilling/other-district/flushing-entry">
                Start Flushing Entry
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
