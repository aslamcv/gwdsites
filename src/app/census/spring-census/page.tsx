'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  Waves, 
  MapPin, 
  Droplets,
  Zap,
  ShieldCheck,
  ClipboardList,
  Lock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function SpringCensusPage() {
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
    springName: '',
    location: '',
    village: '',
    lsgd: '',
    springType: '',
    flowType: 'Perennial',
    usage: '',
    protectionStatus: 'Protected',
    dischargeRate: '',
    remarks: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;

    startTransition(() => {
      toast({
        title: "Spring Census Recorded",
        description: "Spring data has been successfully saved to the statistical database."
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
          <PageHeader title="Statistical Spring Census" />
        </div>
        {!isAllowed && !isUserLoading && !isProfileLoading && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black uppercase text-[10px]">
            <Lock className="size-3.5" /> READ ONLY ACCESS
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-blue-500/10">
          <CardHeader className="bg-blue-500/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <Waves className="h-4 w-4" />
              General Spring Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Name of Spring</Label>
              <Input 
                disabled={!isAllowed}
                placeholder="Common Name"
                value={formData.springName}
                onChange={(e) => setFormData({...formData, springName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Location / Landmark</Label>
              <Input 
                disabled={!isAllowed}
                placeholder="Specific Site Location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Flow Type</Label>
              <Select disabled={!isAllowed} onValueChange={(v) => setFormData({...formData, flowType: v})} value={formData.flowType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Perennial">Perennial (Year-round)</SelectItem>
                  <SelectItem value="Seasonal">Seasonal (Monsoon only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Discharge Rate (LPM)</Label>
              <Input 
                disabled={!isAllowed}
                type="number"
                placeholder="Liters per minute"
                value={formData.dischargeRate}
                onChange={(e) => setFormData({...formData, dischargeRate: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-emerald-500/10">
          <CardHeader className="bg-emerald-500/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Usage & Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Primary Usage</Label>
                <Input 
                  disabled={!isAllowed}
                  placeholder="e.g. Community Drinking, Agriculture"
                  value={formData.usage}
                  onChange={(e) => setFormData({...formData, usage: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Protection Status</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => setFormData({...formData, protectionStatus: v})} value={formData.protectionStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Protected">Fully Protected (Masonry/Fencing)</SelectItem>
                    <SelectItem value="Semi-Protected">Semi-Protected</SelectItem>
                    <SelectItem value="Open">Unprotected / Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                <ClipboardList className="h-3 w-3" />
                Additional Field Observations
              </Label>
              <Textarea 
                disabled={!isAllowed}
                placeholder="Record notes on water clarity, surrounding vegetation, or contamination risks..."
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={!isAllowed || isPending} className="gap-2 px-12 h-14 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 text-white">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Spring Record
          </Button>
        </div>
      </form>
    </div>
  );
}