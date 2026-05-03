'use client';

import { GeophysicalStaffAssignment } from '@/components/investigation/geophysical-staff-assignment';

export default function GeophysicalSurveyLocalBodiesInstitutionPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeophysicalStaffAssignment 
        title="Institution Geophysical Survey (Local Bodies)"
        backUrl="/ground-water-investigation/geophysical-survey/local-bodies"
        nextUrl="/ground-water-investigation/geophysical-survey/local-bodies/institution/site-entry"
      />
    </div>
  );
}
