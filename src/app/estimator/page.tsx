import { PageHeader } from '@/components/page-header';
import { EstimatorForm } from './estimator-form';

export default function EstimatorPage() {
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Drilling Cost Estimator" />
      <div className="mt-4 max-w-2xl mx-auto">
        <EstimatorForm />
      </div>
    </div>
  );
}
