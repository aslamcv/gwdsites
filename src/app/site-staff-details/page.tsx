
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, 
  Pickaxe, 
  Users, 
  Truck, 
  Eye, 
  Wrench,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const staffCategories = [
  {
    title: 'Supervisor',
    description: 'Technical oversight and site management personnel.',
    icon: UserCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Driller',
    description: 'Specialized operators for DTH and Rotary drilling rigs.',
    icon: Pickaxe,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Drilling Assistant',
    description: 'Support staff for drilling operations and pipe handling.',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Driver',
    description: 'Operators for rig vehicles and support trucks.',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Watcher',
    description: 'Security and site monitoring staff.',
    icon: Eye,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
  {
    title: 'Skilled Worker/SLR/CLR',
    description: 'Technical maintenance and daily wage labor force.',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export default function SiteStaffDetailsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/establishment">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader title="Site Staff Details" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staffCategories.map((category) => (
          <Card key={category.title} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`p-2 rounded-lg ${category.bgColor}`}>
                <category.icon className={`h-6 w-6 ${category.color}`} />
              </div>
              <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-xl mb-1">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Management
                </span>
                <Button variant="outline" size="sm">View Records</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Consolidated Unit Report</h3>
              <p className="text-sm text-muted-foreground">
                Generate a full deployment report for all SKE DTH RIG units.
              </p>
            </div>
            <Button>Download Full Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
