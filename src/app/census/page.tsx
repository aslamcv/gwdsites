import { PageHeader } from '@/components/page-header';

export default function CensusPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Census" />
      <div className="mt-4">
        <p>This is the page for census. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
