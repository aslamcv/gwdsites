import { PageHeader } from '@/components/page-header';
import { CreateInvoiceForm } from './create-invoice-form';
import { customers } from '@/lib/data';

export default function CreateInvoicePage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Create Invoice" />
      <div className="mt-4 max-w-4xl mx-auto">
        <CreateInvoiceForm customers={customers} />
      </div>
    </div>
  );
}
