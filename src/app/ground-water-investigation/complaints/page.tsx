import { PageHeader } from '@/components/page-header';

export default function ComplaintsPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Complaints" />
      <div className="mt-4">
        <p>This is the page for complaints. Please select a category from the sidebar.</p>
      </div>
    </div>
  );
}
