import { PageHeader } from '@/components/page-header';

export default function PrivateSurveyPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Private Survey" />
      <div className="mt-4">
        <p>This is the page for private surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
