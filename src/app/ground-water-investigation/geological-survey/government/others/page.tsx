'use client';

import { GeologicalStaffAssignment } from '@/components/investigation/geological-staff-assignment';

export default function GeologicalSurveyGovernmentOthersPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeologicalStaffAssignment 
        title="Other Geological Survey (Government)"
        backUrl="/ground-water-investigation/geological-survey/government"
        nextUrl="/ground-water-investigation/geological-survey/government/others/site-entry"
      />
    </div>
  );
}