'use client';

import { LoginForm } from './login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-background');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src={loginBg?.imageUrl || "https://picsum.photos/seed/pond-login/1920/1080"}
          alt="Login Background"
          fill
          className="object-cover"
          priority
          data-ai-hint="water pond"
        />
        {/* Subtle overlay to soften the image for the login card and theme alignment */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="mx-auto border-none shadow-2xl rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white/90 backdrop-blur-md">
            <CardHeader className="text-center bg-slate-50/50 border-b pb-8">
                <div className="flex flex-col items-center justify-center mb-6 pt-4">
                    <Link href="/" className="flex flex-col items-center gap-4 text-foreground hover:opacity-90 transition-opacity">
                        <Logo />
                        <span className="font-ocr text-5xl md:text-6xl font-black tracking-tighter uppercase whitespace-nowrap drop-shadow-sm select-none text-[#1e3a8a]">
                          GWD SITES
                        </span>
                    </Link>
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-[#1e3a8a]">Login Portal</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-1">
                    Official Administrative Access
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <LoginForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
