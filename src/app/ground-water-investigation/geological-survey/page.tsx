import { PageHeader } from '@/components/page-header';

export default function GeologicalSurveyPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Geological Survey" />
      <div className="mt-4">
        <p>This is the page for Geological surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
