'use client';

import { SupervisionStaffAssignment } from '@/components/supervision/staff-assignment-form';

export default function MWSSRenoSupervisionStaffAssignmentPage() {
  return (
    <div className="p-4 sm:p-6">
      <SupervisionStaffAssignment 
        title="Supervision(MWSS Renovation)"
        backUrl="/supervision"
        nextUrl="/supervision/mwss-reno/reno-entry"
      />
    </div>
  );
}
