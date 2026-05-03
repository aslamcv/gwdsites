'use client';

import { PumpingTestStaffAssignment } from '@/components/pumping-test/staff-assignment-form';

export default function BoreWellStaffEntryPage() {
  return (
    <div className="p-4 sm:p-6">
      <PumpingTestStaffAssignment 
        title="Staff Assignment - Private Agriculture Bore Well Pumping Test"
        backUrl="/pumping-test/private/agriculture"
        nextUrl="/pumping-test/private/agriculture/bore-well/yield-test"
      />
    </div>
  );
}
