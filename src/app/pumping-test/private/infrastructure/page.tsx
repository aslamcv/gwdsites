'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Droplet, Waves, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PumpingTestPrivateInfrastructurePage() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pumping-test/private">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader title="Infrastructure Pumping Test (Private)" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Waves className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">RECENT OPEN WELL/POND PUMPING TEST</CardTitle>
            <CardDescription>Manage yield records for open structures in private infrastructure projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11 font-bold uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700">
              <Link href="/pumping-test/private/infrastructure/open-well">
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
            <CardDescription>Record step-drawdown technical data for private infrastructure borewells.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full h-11 font-bold uppercase tracking-widest gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href="/pumping-test/private/infrastructure/bore-well">
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
