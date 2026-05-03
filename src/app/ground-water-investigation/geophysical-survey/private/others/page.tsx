
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Employee } from '@/lib/types';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function GeophysicalSurveyPrivateOthersPage() {
  const [workStartDate, setWorkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [workEndDate, setWorkEndDate] = useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Role detection using email indexing
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  
  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false; 
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return userProfile?.role === 'admin' || userProfile?.role === 'scientist';
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const showViewOnly = !isUserLoading && !isProfileLoading && !isAllowed;

  // FETCH: Centralized root collection for district-wide visibility
  const employeesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'employees');
  }, [firestore]);

  const { data: employees } = useCollection<Employee>(employeesCollection);

  const roles = [
    { id: 'geophysicist', label: 'Geophysicist' },
    { id: 'juniorGeophysicist', label: 'Junior Geophysicist' },
    { id: 'geophysicalAssistant', label: 'Geophysical Assistant' },
    { id: 'lascar', label: 'Lascar' },
    { id: 'other', label: 'Other Staffs' },
    { id: 'slr1', label: 'SLR-1' },
    { id: 'slr2', label: 'SLR-2' },
    { id: 'clr1', label: 'CLR-1' },
    { id: 'clr2', label: 'CLR-2' },
    { id: 'clr3', label: 'CLR-3' },
    { id: 'clr4', label: 'CLR-4' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Other Geophysical Surveys (Private)" />
        {showViewOnly && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black">
            <Lock className="size-3.5" />
            VIEW ONLY ACCESS
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-primary">Date of Work Start</Label>
          <Input 
            type="date" 
            value={workStartDate}
            onChange={(e) => setWorkStartDate(e.target.value)}
            disabled={!isAllowed}
            className="bg-[#e0fbfc]/30 border-cyan-100 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-primary">Date of Work End (Optional)</Label>
          <Input 
            type="date" 
            value={workEndDate}
            onChange={(e) => setWorkEndDate(e.target.value)}
            disabled={!isAllowed}
            className="bg-[#e0fbfc]/30 border-cyan-100 h-12"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/50 ring-1 ring-slate-200">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2 underline underline-offset-8">
            <Users className="h-5 w-5 text-primary" />
            Staff details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.slice(0, 3).map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id={role.id} disabled={!isAllowed} />
                  <Label htmlFor={role.id} className="font-bold text-slate-700">{role.label}</Label>
                </div>
                <Select disabled={!isAllowed}>
                  <SelectTrigger className="bg-white border-cyan-100 h-10"><SelectValue placeholder="Name" /></SelectTrigger>
                  <SelectContent>{employees?.map((emp) => (<SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:pr-[33%]">
            {roles.slice(3, 5).map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id={role.id} disabled={!isAllowed} />
                  <Label htmlFor={role.id} className="font-bold text-slate-700">{role.label}</Label>
                </div>
                <Select disabled={!isAllowed}>
                  <SelectTrigger className="bg-white border-cyan-100 h-10"><SelectValue placeholder="Name" /></SelectTrigger>
                  <SelectContent>{employees?.map((emp) => (<SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:pr-[33%]">
            {roles.slice(5, 7).map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id={role.id} disabled={!isAllowed} />
                  <Label htmlFor={role.id} className="font-bold text-slate-700">{role.label}</Label>
                </div>
                <Select disabled={!isAllowed}>
                  <SelectTrigger className="bg-white border-cyan-100 h-10"><SelectValue placeholder="Name" /></SelectTrigger>
                  <SelectContent>{employees?.map((emp) => (<SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {roles.slice(7).map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id={role.id} disabled={!isAllowed} />
                  <Label htmlFor={role.id} className="font-bold text-slate-700 text-xs">{role.label}</Label>
                </div>
                <Select disabled={!isAllowed}>
                  <SelectTrigger className="bg-white border-cyan-100 h-10"><SelectValue placeholder="Name" /></SelectTrigger>
                  <SelectContent>{employees?.map((emp) => (<SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button size="lg" asChild disabled={!isAllowed} className="px-12 bg-[#00aeef] hover:bg-[#00aeef]/90 text-white font-bold uppercase tracking-widest gap-2 rounded-xl shadow-lg">
          <Link href={`/ground-water-investigation/geophysical-survey/private/others/site-entry?startDate=${workStartDate}&endDate=${workEndDate}`}>
            Next
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
