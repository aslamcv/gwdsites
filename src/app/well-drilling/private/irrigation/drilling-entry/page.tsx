'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function IrrigationDrillingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Irrigation Well Drilling"
        backUrl="/well-drilling/private/irrigation"
        nextUrl="/well-drilling/private/drinking/drilling-site-entry"
      />
    </div>
  );
}
