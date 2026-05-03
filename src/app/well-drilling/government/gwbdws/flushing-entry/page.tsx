'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function GwbdwsFlushingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Government GWBDWS Well Flushing"
        backUrl="/well-drilling/government/gwbdws"
        nextUrl="/well-drilling/private/drinking/flushing-site-entry"
      />
    </div>
  );
}
