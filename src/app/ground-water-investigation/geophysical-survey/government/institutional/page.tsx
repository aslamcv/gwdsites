'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyGovernmentInstitutionalPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Institutional Geophysical Survey (Government)"
        backUrl="/ground-water-investigation/geophysical-survey/government"
        nextUrl="/ground-water-investigation/geophysical-survey/government/institutional/site-entry"
      />
    </div>
  );
}
