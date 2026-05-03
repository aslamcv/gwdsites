'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function InstitutionDrillingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Government Institution Well Drilling"
        backUrl="/well-drilling/government/institution"
        nextUrl="/well-drilling/private/drinking/drilling-site-entry"
      />
    </div>
  );
}
