'use client';

import { SupervisionStaffAssignment } from '@/components/supervision/staff-assignment-form';

export default function MWSSSupervisionStaffAssignmentPage() {
  return (
    <div className="p-4 sm:p-6">
      <SupervisionStaffAssignment 
        title="Supervision(MWSS Construction)"
        backUrl="/supervision"
        nextUrl="/supervision/mwss-reno/mwss-entry"
      />
    </div>
  );
}
