'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function AgricultureFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Private Agriculture Well Flushing"
        backUrl="/well-drilling/private/agriculture"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
