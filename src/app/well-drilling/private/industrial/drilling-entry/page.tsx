'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function IndustrialDrillingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Industrial Well Drilling"
        backUrl="/well-drilling/private/industrial"
        nextUrl="/well-drilling/private/drinking/drilling-site-entry"
      />
    </div>
  );
}
