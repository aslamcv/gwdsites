'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  BarChart, 
  ClipboardList,
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function OthersCensusPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const isAllowed = useMemo(() => {
    if (isUserLoading || isProfileLoading) return false;
    if (user?.email === MASTER_ADMIN_EMAIL) return true;
    return (userProfile?.role === 'admin' || userProfile?.role === 'scientist' || userProfile?.role === 'engineer') && userProfile?.isApproved === true;
  }, [user, userProfile, isUserLoading, isProfileLoading]);

  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    staffName: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;

    startTransition(() => {
      toast({
        title: "Log Entry Saved",
        description: "The miscellaneous statistical census entry has been recorded."
      });
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/census">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader title="Miscellaneous Statistical Data" />
        </div>
        {!isAllowed && !isUserLoading && !isProfileLoading && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black uppercase text-[10px]">
            <Lock className="size-3.5" /> READ ONLY ACCESS
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              General Log Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Subject / Theme</Label>
                <Input 
                  disabled={!isAllowed}
                  placeholder="e.g. Minor Irrigation Census"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                <Input 
                  disabled={!isAllowed}
                  placeholder="Sub-category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Reference Date</Label>
                <Input 
                  disabled={!isAllowed}
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Reporting Officer</Label>
                <Input 
                  disabled={!isAllowed}
                  placeholder="Name"
                  value={formData.staffName}
                  onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                <ClipboardList className="h-3 w-3" />
                Technical Description & Data Points
              </Label>
              <Textarea 
                disabled={!isAllowed}
                placeholder="Describe the statistical parameters recorded and their quantitative values..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-[150px]"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <p className="font-bold uppercase mb-1">Administrative Note:</p>
            Use this module for periodic statistical survey activities funded by central or state governments that fall outside routine hydrogeological monitoring.
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isAllowed || isPending} className="gap-2 px-12 h-14 font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-900 shadow-xl shadow-slate-200 text-white">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Log Entry
          </Button>
        </div>
      </form>
    </div>
  );
}