
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Breadcrumb() {
  const pathname = usePathname();
  // Don't show on root
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1.5">
        <li>
          <div>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </div>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          return (
            <li key={href}>
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 shrink-0" />
                <Link
                  href={href}
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    "ml-1.5",
                    isLast ? "font-medium text-foreground" : "hover:text-primary transition-colors"
                  )}
                >
                  {capitalize(segment)}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
