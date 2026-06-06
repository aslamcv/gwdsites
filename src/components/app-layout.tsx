'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { Button } from './ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from './logo';
import { MainNav } from './main-nav';
import { AuthGuard } from './auth-guard';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User as UserIcon, LogOut, Settings, HelpCircle, KeyRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const MASTER_ADMIN_EMAIL = 'gwdmpm@gmail.com';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const headerBg = PlaceHolderImages.find(img => img.id === 'header-background');

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return doc(firestore, 'appSettings', 'global_data');
  }, [firestore, isUserLoading, user]);

  const { data: cloudSettings } = useDoc(settingsRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email.toLowerCase().trim());
  }, [firestore, user?.email]);
  const { data: userProfile } = useDoc(userProfileRef);

  const displayRole = useMemo(() => {
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return 'System Administrator';
    const rawRole = userProfile?.role || 'User';
    return `District ${rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()}`;
  }, [user, userProfile]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleOpenManual = (lang: 'malayalam' | 'english') => {
    const cloudUrl = cloudSettings?.manuals?.[lang];
    if (cloudUrl) {
      window.open(cloudUrl, '_blank');
    } else {
      window.open(`/manuals/${lang}.pdf`, '_blank');
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-slate-50/50">
        <header className="relative border-b border-slate-200 sticky top-0 z-[60] h-20 overflow-hidden bg-white">
          <div className="absolute inset-0 z-0">
            <Image 
              src={headerBg?.imageUrl || "https://picsum.photos/seed/water-source-banner/1600/400"} 
              alt="Departmental Banner" 
              fill 
              className="object-cover"
              priority
              data-ai-hint="water surface"
            />
            <div className="absolute inset-0 bg-white/40" />
          </div>

          <div className="relative z-10 flex items-center justify-between px-8 h-full max-w-screen-2xl mx-auto w-full">
            <div className="flex items-center gap-4 min-w-[280px]">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <Logo />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.2em] leading-none mb-1 text-left">Government of Kerala</span>
                  <span className="text-[14px] font-bold text-slate-900 tracking-tight leading-none text-left">Ground Water Department</span>
                </div>
              </Link>
            </div>

            <div className="flex-1 flex justify-center items-center px-4 overflow-hidden text-left">
              <span className="font-ocr text-3xl md:text-4xl lg:text-6xl font-black text-[#1e3a8a] tracking-tighter whitespace-nowrap drop-shadow-sm select-none">
                GWD SITES
              </span>
            </div>

            <div className="flex items-center gap-4 min-w-[280px] justify-end">
              <div className="hidden lg:flex items-center gap-1 bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 text-[11px] font-black px-4 rounded-xl uppercase tracking-widest text-slate-800">Manuals</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl border-slate-200 shadow-xl">
                    <DropdownMenuLabel>User Manuals</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleOpenManual('malayalam')} className="cursor-pointer font-bold text-[10px] uppercase">MALAYALAM</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleOpenManual('english')} className="cursor-pointer font-bold text-[10px] uppercase">ENGLISH</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" className="h-9 text-[11px] font-black px-4 rounded-xl uppercase tracking-widest text-slate-800" asChild>
                  <Link href="/technical-support">Technical Support</Link>
                </Button>
              </div>
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 border-2 border-white/50 bg-white/20 hover:bg-white/40 shadow-sm backdrop-blur-sm">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary text-[10px] text-primary-foreground font-bold">{user.email?.charAt(0).toUpperCase() || <UserIcon className="size-4" />}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 rounded-2xl border-slate-200 shadow-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-4 text-left">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-black leading-none text-[#1e3a8a] uppercase tracking-tight">{displayRole}</p>
                        <p className="text-xs leading-none text-slate-700 truncate font-bold">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer m-1 py-3">
                      <Link href="/profile" className="flex items-center"><KeyRound className="mr-3 h-4 w-4 text-slate-600" /><span className="font-bold text-xs uppercase">Security Profile</span></Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer m-1 py-3">
                      <Link href="/settings" className="flex items-center"><Settings className="mr-3 h-4 w-4 text-slate-600" /><span className="font-bold text-xs uppercase">System Configuration</span></Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-rose-600 focus:bg-rose-50 focus:text-rose-600 rounded-xl cursor-pointer font-black text-xs uppercase m-1 py-3">
                      <LogOut className="mr-3 h-4 w-4" /><span>Logout Session</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-20 z-50">
          <MainNav />
        </div>
        <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 px-8">
          <div className="max-w-screen-2xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">© 2025 Ground Water Department Kerala | District Office, Malappuram</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isPublicReport = pathname?.startsWith('/report');
  const isCompletionReport = pathname?.includes('completion-report');
  const isFinalBill = pathname?.includes('final-bill');
  const isFlushingReport = pathname?.includes('flushing-report');

  if (isLoginPage || isPublicReport || isCompletionReport || isFinalBill || isFlushingReport) {
    return <div className="bg-background">{children}</div>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}