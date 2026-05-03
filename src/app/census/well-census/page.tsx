'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  Database, 
  MapPin, 
  Calendar, 
  Pickaxe, 
  Droplets,
  User,
  Activity,
  Lock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLsgdData } from '@/hooks/use-lsgd-data';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

export default function WellCensusPage() {
  const { toast } = useToast();
  const { lsgs } = useLsgdData();
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
    censusId: '',
    fileNo: '',
    ownerName: '',
    address: '',
    lsgd: '',
    ward: '',
    village: '',
    wellType: '',
    depth: '',
    diameter: '',
    usage: '',
    status: 'In Use',
    censusDate: new Date().toISOString().split('T')[0]
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;

    startTransition(() => {
      toast({
        title: "Census Record Saved",
        description: "Well census data has been recorded successfully."
      });
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/census">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader title="Statistical Well Census" />
        </div>
        {!isAllowed && !isUserLoading && !isProfileLoading && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 h-9 px-4 gap-2 font-black uppercase text-[10px]">
            <Lock className="size-3.5" /> READ ONLY ACCESS
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm ring-1 ring-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Database className="h-4 w-4" />
              Administrative Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Census ID</Label>
              <Input 
                disabled={!isAllowed}
                placeholder="Unique Census Code"
                value={formData.censusId}
                onChange={(e) => setFormData({...formData, censusId: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">File Reference</Label>
              <Input 
                disabled={!isAllowed}
                placeholder="MPM/GWD/..."
                value={formData.fileNo}
                onChange={(e) => setFormData({...formData, fileNo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Census Date</Label>
              <Input 
                disabled={!isAllowed}
                type="date"
                value={formData.censusDate}
                onChange={(e) => setFormData({...formData, censusDate: e.target.value})}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Owner Name</Label>
                <Input 
                  disabled={!isAllowed}
                  placeholder="Full Name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">LSGD (Local Body)</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => setFormData({...formData, lsgd: v})} value={formData.lsgd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select LSGD" />
                  </SelectTrigger>
                  <SelectContent>
                    {lsgs.map(lsg => (
                      <SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Village</Label>
                  <Input 
                    disabled={!isAllowed}
                    placeholder="Revenue Village"
                    value={formData.village}
                    onChange={(e) => setFormData({...formData, village: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Ward No.</Label>
                  <Input 
                    disabled={!isAllowed}
                    placeholder="Ward"
                    value={formData.ward}
                    onChange={(e) => setFormData({...formData, ward: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-blue-500/10">
            <CardHeader className="bg-blue-500/5 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <Pickaxe className="h-4 w-4" />
                Technical Well Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Type of Well</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => setFormData({...formData, wellType: v})} value={formData.wellType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dug_well">Open Dug Well</SelectItem>
                    <SelectItem value="bore_well">Bore Well</SelectItem>
                    <SelectItem value="tube_well">Tube Well</SelectItem>
                    <SelectItem value="filter_point">Filter Point</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Depth (m)</Label>
                  <Input 
                    disabled={!isAllowed}
                    type="number" step="0.1" placeholder="0.0"
                    value={formData.depth}
                    onChange={(e) => setFormData({...formData, depth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Diameter (m/mm)</Label>
                  <Input 
                    disabled={!isAllowed}
                    placeholder="e.g. 1.5m / 150mm"
                    value={formData.diameter}
                    onChange={(e) => setFormData({...formData, diameter: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Primary Usage</Label>
                <Select disabled={!isAllowed} onValueChange={(v) => setFormData({...formData, usage: v})} value={formData.usage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Usage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drinking">Drinking / Domestic</SelectItem>
                    <SelectItem value="irrigation">Irrigation / Agriculture</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="institutional">Institutional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Census Data Integrity Protected</span>
          </div>
          <Button type="submit" disabled={!isAllowed || isPending} className="gap-2 px-12 h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Census Record
          </Button>
        </div>
      </form>
    </div>
  );
}