'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Pickaxe, Wind } from 'lucide-react';
import { useState } from 'react';

export default function DrillingAndFlushingPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Well Drilling & Flushing"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Select Activity Type</DialogTitle>
                <DialogDescription>
                  Choose the type of well work you are recording today.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    console.log('Bore Well Drilling Selected');
                    setIsOpen(false);
                  }}
                >
                  <Pickaxe className="h-6 w-6 text-primary" />
                  <span>Bore Well Drilling</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    console.log('Bore Well Flushing Selected');
                    setIsOpen(false);
                  }}
                >
                  <Wind className="h-6 w-6 text-accent" />
                  <span>Bore Well Flushing</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pickaxe className="h-5 w-5" />
              Recent Drilling Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent drilling jobs recorded. Click &quot;New Entry&quot; to start.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Recent Flushing Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent flushing jobs recorded. Click &quot;New Entry&quot; to start.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
