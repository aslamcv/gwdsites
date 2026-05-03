'use client';

import { GeologicalStaffAssignment } from '@/components/investigation/geological-staff-assignment';

export default function GeologicalSurveyGovernmentInfrastructurePage() {
  return (
    <div className="p-4 sm:p-6">
      <GeologicalStaffAssignment 
        title="Infrastructure Geological Survey (Government)"
        backUrl="/ground-water-investigation/geological-survey/government"
        nextUrl="/ground-water-investigation/geological-survey/government/infrastructure/site-entry"
      />
    </div>
  );
}