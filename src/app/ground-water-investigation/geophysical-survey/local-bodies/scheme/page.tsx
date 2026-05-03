'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyLocalBodiesSchemePage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Scheme Geophysical Survey (Local Bodies)"
        backUrl="/ground-water-investigation/geophysical-survey/local-bodies"
        nextUrl="/ground-water-investigation/geophysical-survey/local-bodies/scheme/site-entry"
      />
    </div>
  );
}
