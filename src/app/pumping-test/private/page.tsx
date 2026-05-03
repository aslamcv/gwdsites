import { PageHeader } from '@/components/page-header';

export default function PumpingTestPrivatePage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Private Pumping Test" />
      <div className="mt-4">
        <p>This is the page for private pumping tests. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
