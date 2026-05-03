'use server';

import {
  estimateDrillingCost,
  type DrillingCostInput,
} from '@/ai/flows/drilling-cost-estimation';
import { z } from 'zod';

/**
 * A helper function that attempts to execute a promise-based function,
 * and retries with exponential backoff if it fails due to a rate limit error (429).
 * @param fn The async function to execute.
 * @param retries Number of retries.
 * @param delay The initial delay in ms.
 */
async function callWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // Check for rate limit error status or message
    if ((err.message?.includes('429') || err.status === 429) && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
      // Recursively call with one less retry and double the delay
      return callWithBackoff(fn, retries - 1, delay * 2);
    }
    // Re-throw errors that are not related to rate limiting
    throw err;
  }
}

const DrillingCostInputSchema = z.object({
  depth: z.coerce.number().min(1, 'Depth must be a positive number.'),
  materialCost: z.coerce.number().min(0, 'Material cost cannot be negative.'),
  laborCost: z.coerce.number().min(0, 'Labor cost cannot be negative.'),
  otherCosts: z.coerce.number().min(0, 'Other costs cannot be negative.').optional(),
  location: z.string().min(2, 'Location is required.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export async function getDrillingCostEstimation(formData: FormData) {
  const rawFormData = {
    depth: formData.get('depth'),
    materialCost: formData.get('materialCost'),
    laborCost: formData.get('laborCost'),
    otherCosts: formData.get('otherCosts') || 0,
    location: formData.get('location'),
    difficulty: formData.get('difficulty'),
  };
  
  const validatedFields = DrillingCostInputSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input. Please check the form fields.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Wrap the AI call with the retry logic helper
    const result = await callWithBackoff(() => 
      estimateDrillingCost(validatedFields.data as DrillingCostInput)
    );
    return { data: result };
  } catch (error) {
    console.error('AI estimation error after retries:', error);
    // Provide a more user-friendly error message for rate limit exhaustion
    if (error instanceof Error && error.message.includes('429')) {
       return {
        error: 'The estimation service is currently busy due to high demand. Please wait a moment and try again.',
      };
    }
    return {
      error: 'Failed to get estimation from AI. Please try again later.',
    };
  }
}
