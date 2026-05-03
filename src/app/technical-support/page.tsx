'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Building2, User, ArrowLeft, Mail, Settings } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const supportList = [
  {
    name: "Mohammed Aslam C V",
    role: "Master Driller",
    phone: "9946474443",
    email: "aslamcv@gmail.com",
    office: "Malappuram District Office",
    dept: "Ground Water Department",
    initial: "M",
    color: "bg-blue-600"
  },
  {
    name: "Sihab Irukulangara",
    role: "Assistant Engineer",
    phone: "7592053886",
    email: "sihabirukulangara@gmail.com",
    office: "Malappuram District Office",
    dept: "Ground Water Department",
    initial: "S",
    color: "bg-emerald-600"
  }
];

export default function TechnicalSupportPage() {
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full border border-slate-200 shadow-sm">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Technical Support</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Ground Water Department | District Office, Malappuram</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {supportList.map((person, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden ring-1 ring-slate-200 bg-white group hover:ring-primary/30 transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "size-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-900/10 group-hover:scale-110 transition-transform",
                  person.color
                )}>
                  {person.initial}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                    {person.name}
                  </h2>
                  <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest mt-2">
                    {person.role}
                  </p>
                </div>
              </div>

              <div className="my-6 h-px bg-slate-100" />

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Department & Office</p>
                    <p className="font-bold text-slate-700 uppercase">{person.dept}</p>
                    <p className="font-medium text-slate-500">{person.office}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Contact Number</p>
                    <p className="font-bold text-slate-700 text-lg tracking-tighter">{person.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Email Address</p>
                    <p className="font-bold text-slate-700">{person.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button asChild className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-900/10">
                  <a href={`tel:${person.phone}`}>
                    <Phone className="size-3.5" />
                    Call Now
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-slate-50">
                  <MessageSquare className="size-3.5 text-blue-600" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-blue-900 uppercase">Availability</h4>
          <p className="text-xs text-blue-700 font-medium">Standard support is available during official working hours (10:00 AM - 5:00 PM). For emergency technical assistance regarding SKE Rig deployments, please use the direct mobile contacts above.</p>
        </div>
      </div>
    </div>
  );
}
