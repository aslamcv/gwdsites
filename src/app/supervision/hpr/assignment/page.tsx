'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SupervisionStaffAssignment } from '@/components/supervision/staff-assignment-form';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';

function HPSHPRStaffAssignmentPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  const isHPS = type === 'hps';

  const title = isHPS ? "Staff Assignment - HPS (Installation)" : "Staff Assignment - HPR (Repair)";
  const nextUrl = isHPS ? "/supervision/hps/site-entry" : "/supervision/hpr/site-entry";
  const backUrl = "/supervision";

  return (
    <div className="p-4 sm:p-6">
      <SupervisionStaffAssignment 
        title={title}
        backUrl={backUrl}
        nextUrl={nextUrl}
      />
    </div>
  );
}

function HPSHPRStaffAssignmentFallback() {
    return (
        <div className="p-4 sm:p-6 space-y-8">
            <PageHeader title="Loading Staff Assignment..." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
             </div>
        </div>
    )
}

export default function HPSHPRStaffAssignment() {
    return (
        <Suspense fallback={<HPSHPRStaffAssignmentFallback />}>
            <HPSHPRStaffAssignmentPage />
        </Suspense>
    )
}
