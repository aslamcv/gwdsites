'use client';

import { StaffAssignmentForm } from '@/components/well-drilling/staff-assignment-form';

export default function OtherDistrictDrillingStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <StaffAssignmentForm 
        title="Staff Assignment - Other District Well Drilling"
        backUrl="/well-drilling/other-district"
        nextUrl="/well-drilling/private/drinking/drilling-site-entry"
      />
    </div>
  );
}
