'use client';

import { GeologicalStaffAssignment } from '@/components/investigation/geological-staff-assignment';

export default function GeologicalSurveyLocalBodiesInstitutionPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeologicalStaffAssignment 
        title="Institution Geological Survey (Local Bodies)"
        backUrl="/ground-water-investigation/geological-survey/local-bodies"
        nextUrl="/ground-water-investigation/geological-survey/local-bodies/institution/site-entry"
      />
    </div>
  );
}