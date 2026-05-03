'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Pickaxe, 
  Wind, 
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function BWConstructionSupervisionPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 min-h-screen">
      <PageHeader title="Supervision(Borewell Construction)" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mt-6">
        {/* Drilling Supervision Card */}
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1e3a8a]" />
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-start">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Pickaxe className="h-7 w-7 text-[#1e3a8a]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Drilling Supervision</CardTitle>
            <CardDescription className="text-sm font-medium leading-relaxed">
              Record technical parameters and personnel deployment for construction supervision.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-8">
            <Button asChild className="w-full h-14 font-black uppercase tracking-widest gap-3 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 shadow-lg shadow-blue-900/20 rounded-xl">
              <Link href="/supervision/bw-construction/drilling-entry">
                START Drilling Supervision Entry
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Flushing Supervision Card */}
        <Card className="group hover:border-[#00aeef]/50 transition-all border-2 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00aeef]/20" />
          <CardHeader className="pb-4 pt-8">
            <div className="flex items-start">
              <div className="size-14 rounded-2xl bg-[#e0fbfc]/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wind className="h-7 w-7 text-[#00aeef]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Flushing Supervision</CardTitle>
            <CardDescription className="text-sm font-medium leading-relaxed">
              Log well development parameters and technical oversight details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-8">
            <Button variant="outline" asChild className="w-full h-14 font-black uppercase tracking-widest gap-3 border-[#00aeef]/30 text-[#1e3a8a] bg-[#e0fbfc]/20 hover:bg-[#e0fbfc]/40 rounded-xl">
              <Link href="/supervision/bw-construction/flushing-entry">
                START Flushing Supervision Entry
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
