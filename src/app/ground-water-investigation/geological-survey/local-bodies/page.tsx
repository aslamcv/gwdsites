'use client';

import { PageHeader } from '@/components/page-header';

export default function GeologicalSurveyLocalBodiesPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Local Bodies Geological Survey" />
      <div className="mt-4">
        <p>This is the page for Local Bodies geological surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
