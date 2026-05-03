'use client';

import { SupervisionStaffAssignment } from '@/components/supervision/staff-assignment-form';

export default function DrillingSupervisionStaffAssignmentPage() {
  return (
    <div className="p-4 sm:p-6">
      <SupervisionStaffAssignment 
        title="Supervision(Borewell Construction & Flushing)"
        backUrl="/supervision"
        nextUrl="/supervision/bw-construction/drilling-entry"
      />
    </div>
  );
}
