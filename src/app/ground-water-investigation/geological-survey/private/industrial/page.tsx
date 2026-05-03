'use client';

import { GeologicalStaffAssignment } from '@/components/investigation/geological-staff-assignment';

export default function GeologicalSurveyPrivateIndustrialPage() {
  return (
    <div className="p-4 sm:p-6">
      <GeologicalStaffAssignment 
        title="Industrial Geological Survey (Private)"
        backUrl="/ground-water-investigation/geological-survey/private"
        nextUrl="/ground-water-investigation/geological-survey/private/industrial/site-entry"
      />
    </div>
  );
}