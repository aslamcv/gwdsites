'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, PlusCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GeologicalSurveyGovernmentLocalBodiesPage() {
  const [workStartDate, setWorkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [workEndDate, setWorkEndDate] = useState('');

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Local Bodies Geological Survey (Government)" />
      <CardDescription className="mt-2">
        Manage staff details and create new site entries for government local bodies geological surveys.
      </CardDescription>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View and manage staff assignments for geological surveys.
            </p>
            <Button asChild className="w-full">
              <Link href="/establishment">
                View Staff
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-500" />
              Site Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Date of work start
                </Label>
                <Input 
                  id="start-date"
                  type="date" 
                  value={workStartDate}
                  onChange={(e) => setWorkStartDate(e.target.value)}
                  className="bg-[#e0fbfc] border-cyan-100 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Date of work end (Optional)
                </Label>
                <Input 
                  id="end-date"
                  type="date" 
                  value={workEndDate}
                  onChange={(e) => setWorkEndDate(e.target.value)}
                  className="bg-[#e0fbfc] border-cyan-100 h-12"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Create a new site entry record for a government local bodies geological survey.
            </p>
            <Button asChild className="w-full h-12 font-bold uppercase tracking-wide">
              <Link href={`/ground-water-investigation/geological-survey/government/local-bodies/site-entry?startDate=${workStartDate}&endDate=${workEndDate}`}>
                Create Entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
