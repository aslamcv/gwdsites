'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDrillingCostEstimation } from './actions';
import type { DrillingCostOutput } from '@/ai/flows/drilling-cost-estimation';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  depth: z.coerce.number().min(1, 'Depth must be a positive number.'),
  materialCost: z.coerce.number().min(0, 'Material cost cannot be negative.'),
  laborCost: z.coerce.number().min(0, 'Labor cost cannot be negative.'),
  otherCosts: z.coerce.number().min(0, 'Other costs cannot be negative.').optional(),
  location: z.string().min(2, 'Location is required.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type FormValues = z.infer<typeof formSchema>;

export function EstimatorForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DrillingCostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depth: 100,
      materialCost: 1500,
      laborCost: 2000,
      otherCosts: 0,
      location: 'Central Valley, California',
      difficulty: 'medium',
    },
  });

  const onSubmit = (values: FormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if(value !== undefined) {
            formData.append(key, String(value));
        }
    });

    startTransition(async () => {
      setError(null);
      setResult(null);
      const response = await getDrillingCostEstimation(formData);
      if (response.error) {
        setError(response.error);
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            if (errors) {
              form.setError(field as keyof FormValues, {
                type: 'manual',
                message: errors.join(', '),
              });
            }
          });
        }
      } else if (response.data) {
        setResult(response.data);
      }
    });
  };
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Estimation Parameters</CardTitle>
              <CardDescription>
                Provide the details below to get an AI-powered cost estimation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drilling Depth (meters)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materialCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Cost (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="laborCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Cost (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otherCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Costs (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central Valley, California" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Drilling Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Calculate Cost
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {error && (
         <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      {result && (
        <Card className="mt-6 animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                    <Wand2 />
                    Estimation Result
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary">Estimated Total Cost</p>
                    <p className="text-4xl font-bold font-headline text-primary">{formatCurrency(result.estimatedCost)}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Cost Breakdown:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.breakdown}</p>
                </div>
            </CardContent>
        </Card>
      )}

    </>
  );
}
