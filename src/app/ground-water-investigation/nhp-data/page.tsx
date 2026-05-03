import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Beaker, FileSpreadsheet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NHPDataPage() {
  const categories = [
    {
      title: "Monitoring",
      description: "Periodic water level monitoring from piezometers and observation wells.",
      href: "/ground-water-investigation/nhp-data/monitoring",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Sample Collection",
      description: "Water quality sample collection for isotope and chemical analysis.",
      href: "/ground-water-investigation/nhp-data/sample-collection",
      icon: Beaker,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Others",
      description: "Miscellaneous data collection, site inspections, and maintenance logs.",
      href: "/ground-water-investigation/nhp-data/others",
      icon: FileSpreadsheet,
      color: "text-slate-600",
      bgColor: "bg-slate-50"
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <PageHeader title="NHP Data Collection (National Hydrology Project)" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Card key={cat.title} className="group hover:border-primary/50 transition-all border-2 shadow-sm">
            <CardHeader className="pb-4">
              <div className={`size-12 rounded-xl ${cat.bgColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <cat.icon className={`h-6 w-6 ${cat.color}`} />
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">{cat.title}</CardTitle>
              <CardDescription>{cat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full h-11 font-bold uppercase tracking-widest gap-2">
                <Link href={cat.href}>
                  Open Module
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
