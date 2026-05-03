import { PageHeader } from '@/components/page-header';

export default function GeologicalSurveyPrivatePage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Private Geological Survey" />
      <div className="mt-4">
        <p>This is the page for private geological surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
