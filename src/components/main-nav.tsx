'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { 
  LayoutDashboard,
  SearchCode,
  Activity,
  ShieldCheck,
  History,
  Settings2,
  Ruler,
  FileText,
  Calculator,
  Pickaxe,
  Wind,
  Droplets,
  Waves,
  Wrench,
  Users,
  CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon?: any;
  subItems?: NavItem[];
};

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ground-water-investigation', label: 'Investigation', icon: SearchCode },
  { href: '/well-drilling', label: 'Well Drilling', icon: Activity },
  { href: '/pumping-test', label: 'Pumping Test', icon: Activity },
  { href: '/supervision', label: 'Supervision', icon: ShieldCheck },
  { href: '/estimate-measurement', label: 'Estimate / Measurement', icon: Ruler },
  { href: '/site-staff-attendance', label: 'Site Staff Attendance', icon: CalendarCheck },
  {
    href: '/services',
    label: 'Administration',
    icon: Settings2,
    subItems: [
      { href: '/establishment', label: 'District Establishment' },
      { href: '/settings', label: 'System Configuration' },
      { href: '/admin/users', label: 'User Management' },
      { href: '/services', label: 'Rates & Catalogs' },
      { 
        href: '/census', 
        label: 'Statistical Census',
        subItems: [
          { href: '/census/well-census', label: 'Well Census' },
          { href: '/census/spring-census', label: 'Spring Census' },
          { href: '/census/others', label: 'Others' },
        ]
      },
    ]
  }
];

function NavMenuSub({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item) => (
        item.subItems ? (
          <MenubarSub key={item.href}>
            <MenubarSubTrigger className="flex justify-between items-center group py-2 px-3 focus:bg-slate-50">
              <span className="text-slate-700 font-medium text-[11px] uppercase tracking-tighter">{item.label}</span>
            </MenubarSubTrigger>
            <MenubarSubContent className="bg-white border-slate-200 min-w-[220px] rounded-xl shadow-xl p-1 mt-[-4px]">
              <NavMenuSub items={item.subItems} />
            </MenubarSubContent>
          </MenubarSub>
        ) : (
          <MenubarItem key={item.href} asChild className="focus:bg-primary/5 focus:text-primary rounded-lg">
            <Link href={item.href} className="cursor-pointer py-2 px-3 flex items-center gap-2">
              {item.icon && <item.icon className="h-3.5 w-3.5 text-slate-400" />}
              <span className="text-slate-700 font-medium text-[11px] uppercase tracking-tighter">{item.label}</span>
            </Link>
          </MenubarItem>
        )
      ))}
    </>
  );
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="max-w-screen-2xl mx-auto w-full px-4 overflow-x-auto scrollbar-hide">
      <Menubar className="bg-transparent border-none h-12 gap-1 flex items-center justify-start">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <MenubarMenu key={item.href}>
              <MenubarTrigger className={cn(
                "bg-transparent hover:bg-slate-50 data-[state=open]:bg-slate-100/80 rounded-xl px-4 h-9 flex items-center gap-2.5 cursor-pointer border-none transition-all",
                isActive && "text-primary bg-primary/5 ring-1 ring-primary/10 shadow-inner"
              )}>
                {item.icon && <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-slate-400")} />}
                <span className={cn(
                  "font-bold text-[11px] uppercase tracking-widest leading-none",
                  isActive ? "text-primary" : "text-slate-600"
                )}>
                  {item.subItems ? (
                    <span>{item.label}</span>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </span>
              </MenubarTrigger>
              {item.subItems && (
                <MenubarContent className="bg-white border-slate-200 min-w-[240px] p-1.5 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
                  <NavMenuSub items={item.subItems} />
                </MenubarContent>
              )}
            </MenubarMenu>
          );
        })}
      </Menubar>
    </div>
  );
}
