'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function GovernmentOtherFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Government Other Well Flushing"
        backUrl="/well-drilling/government/others"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
