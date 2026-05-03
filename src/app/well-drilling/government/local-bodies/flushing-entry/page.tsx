'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function LocalBodyFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Government Local Body Well Flushing"
        backUrl="/well-drilling/government/local-bodies"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
