'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function FlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Well Flushing"
        backUrl="/well-drilling/private/drinking"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
