'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function AgricultureDrillingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Agriculture Well Drilling"
        backUrl="/well-drilling/private/agriculture"
        nextUrl="/well-drilling/private/drinking/drilling-site-entry"
      />
    </div>
  );
}
