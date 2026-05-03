'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyPrivateIndustrialPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Industrial Geophysical Survey (Private)"
        backUrl="/ground-water-investigation/geophysical-survey/private"
        nextUrl="/ground-water-investigation/geophysical-survey/private/industrial/site-entry"
      />
    </div>
  );
}
