import { PageHeader } from '@/components/page-header';

export default function GovernmentSurveyPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Government Survey" />
      <div className="mt-4">
        <p>This is the page for government surveys. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
