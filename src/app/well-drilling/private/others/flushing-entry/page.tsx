'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function OtherFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Other Well Flushing"
        backUrl="/well-drilling/private/others"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
