'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function OtherDistrictFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Other District Well Flushing"
        backUrl="/well-drilling/other-district"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
