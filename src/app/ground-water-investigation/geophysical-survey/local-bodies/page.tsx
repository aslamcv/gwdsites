'use client';

import { PageHeader } from '@/components/page-header';

export default function GeophysicalSurveyLocalBodiesPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Local Bodies Geophysical Survey" />
      <div className="mt-4">
        <p>This is the page for local bodies geophysical surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
