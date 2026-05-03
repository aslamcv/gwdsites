'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pickaxe, Wind, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PrivateIrrigationWellPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <PageHeader title="Private Irrigation Well Operations" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        <Card className="group hover:border-primary/50 transition-all border-2 shadow-sm">
          <CardHeader className="pb-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Pickaxe className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Recent Irrigation Well Drilling</CardTitle>
            <CardDescription>Record new construction details, staff deployment, and technical yield parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12 font-bold uppercase tracking-widest gap-2">
              <Link href="/well-drilling/private/irrigation/drilling-entry">
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
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Recent Irrigation Well Flushing</CardTitle>
            <CardDescription>Log well cleaning, development, and maintenance activities for existing structures.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full h-12 font-bold uppercase tracking-widest gap-2 border-accent/20 text-primary hover:bg-accent/5">
              <Link href="/well-drilling/private/irrigation/flushing-entry">
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
