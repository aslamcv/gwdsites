'use client';

import { useState, useTransition } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, KeyRound, Mail, ShieldAlert, ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import Link from 'next/link';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    startTransition(async () => {
      try {
        await updatePassword(auth.currentUser!, newPassword);
        toast({
          title: 'Password Updated',
          description: 'Your security credentials have been refreshed successfully.',
        });
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/requires-recent-login') {
          toast({
            variant: 'destructive',
            title: 'Security Sync Required',
            description: 'Please logout and sign in again to verify your identity before changing your password.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update password. Please try again.',
          });
        }
      }
    });
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 bg-background min-h-screen max-w-4xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 border border-slate-200 bg-white">
          <Link href="/"><ArrowLeft className="size-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tight uppercase leading-none">Security Profile</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Manage Account Credentials & Security</p>
        </div>
      </div>

      <div className="px-2">
        <Breadcrumb />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Account Info */}
        <Card className="md:col-span-1 border-none shadow-sm ring-1 ring-slate-200 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b py-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Account Identity</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400">Email Address</Label>
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-hidden">
                <Mail className="size-4 text-primary shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400">Account Status</Label>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle2 className="size-4" />
                ACTIVE SESSION
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset */}
        <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white">
          <CardHeader className="bg-[#1e3a8a] text-white p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <KeyRound className="size-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Modify Security Credentials</CardTitle>
                <CardDescription className="text-blue-100 font-medium">Update your portal access password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
                <ShieldAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-amber-800 leading-relaxed uppercase">
                  <strong>Security Note:</strong> If you haven't logged in recently, you may be required to sign out and back in again to confirm this sensitive operation.
                </p>
              </div>

              <div className="flex pt-4">
                <Button type="submit" disabled={isPending} className="w-full h-14 rounded-2xl bg-[#1e3a8a] hover:bg-blue-900 text-white font-black uppercase tracking-widest text-[11px] gap-2 shadow-xl shadow-blue-900/20">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Update Credentials
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 px-8">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Technical Data Security Policy</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
