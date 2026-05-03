'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyGovernmentInfrastructurePage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Infrastructure Geophysical Survey (Government)"
        backUrl="/ground-water-investigation/geophysical-survey/government"
        nextUrl="/ground-water-investigation/geophysical-survey/government/infrastructure/site-entry"
      />
    </div>
  );
}
