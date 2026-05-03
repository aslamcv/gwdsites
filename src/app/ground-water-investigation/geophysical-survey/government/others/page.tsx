'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyGovernmentOthersPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Other Geophysical Surveys (Government)"
        backUrl="/ground-water-investigation/geophysical-survey/government"
        nextUrl="/ground-water-investigation/geophysical-survey/government/others/site-entry"
      />
    </div>
  );
}
