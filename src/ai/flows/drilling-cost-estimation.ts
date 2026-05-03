'use server';

/**
 * @fileOverview Drilling cost estimation flow.
 *
 * - estimateDrillingCost - A function that estimates the drilling cost based on input parameters.
 * - DrillingCostInput - The input type for the estimateDrillingCost function.
 * - DrillingCostOutput - The return type for the estimateDrillingCost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DrillingCostInputSchema = z.object({
  depth: z.number().describe('The depth of the drilling in meters.'),
  materialCost: z.number().describe('The cost of materials used for drilling.'),
  laborCost: z.number().describe('The labor cost for drilling.'),
  otherCosts: z.number().optional().describe('Any other additional costs.'),
  location: z.string().describe('The location where drilling is performed.'),
  difficulty: z.string().describe('The difficulty level of the drilling (e.g., easy, medium, hard).')
});
export type DrillingCostInput = z.infer<typeof DrillingCostInputSchema>;

const DrillingCostOutputSchema = z.object({
  estimatedCost: z.number().describe('The estimated total cost of drilling.'),
  breakdown: z.string().describe('A detailed breakdown of the cost estimation.'),
});
export type DrillingCostOutput = z.infer<typeof DrillingCostOutputSchema>;

export async function estimateDrillingCost(input: DrillingCostInput): Promise<DrillingCostOutput> {
  return drillingCostEstimationFlow(input);
}

const drillingCostEstimationPrompt = ai.definePrompt({
  name: 'drillingCostEstimationPrompt',
  input: {schema: DrillingCostInputSchema},
  output: {schema: DrillingCostOutputSchema},
  prompt: `You are an expert in drilling cost estimation. Based on the following information, provide an accurate estimate of the total drilling cost in Indian Rupees (INR).

Drilling Depth: {{{depth}}} meters
Material Costs: ₹{{{materialCost}}}
Labor Costs: ₹{{{laborCost}}}
Other Costs: ₹{{{otherCosts}}}
Location: {{{location}}}
Difficulty: {{{difficulty}}}

Consider the location and difficulty when estimating the cost. All monetary values are in INR. Provide a breakdown of how you arrived at the final estimated cost.

Ensure the estimatedCost field is a numerical value and the breakdown field contains a detailed explanation.
`,
});

const drillingCostEstimationFlow = ai.defineFlow(
  {
    name: 'drillingCostEstimationFlow',
    inputSchema: DrillingCostInputSchema,
    outputSchema: DrillingCostOutputSchema,
  },
  async input => {
    const {output} = await drillingCostEstimationPrompt(input);
    return output!;
  }
);
