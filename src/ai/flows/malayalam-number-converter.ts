'use server';
/**
 * @fileOverview A Malayalam number to words converter with robust error handling.
 *
 * - convertNumberToMalayalam - A function that handles the conversion process.
 * - NumberToMalayalamInput - The input type.
 * - NumberToMalayalamOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NumberToMalayalamInputSchema = z.object({
  number: z.number().describe('The number to convert into Malayalam words.'),
});
export type NumberToMalayalamInput = z.infer<typeof NumberToMalayalamInputSchema>;

const NumberToMalayalamOutputSchema = z.object({
  text: z.string().describe('The Malayalam words representation of the number.'),
});
export type NumberToMalayalamOutput = z.infer<typeof NumberToMalayalamOutputSchema>;

/**
 * Retries a function with exponential backoff on transient errors (503/429).
 * Increased retries and delay to handle free-tier quota spikes.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.message?.includes('503') || error.message?.includes('429');
    if (retries > 0 && isRetryable) {
      console.warn(`AI busy or rate limited. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function convertNumberToMalayalam(input: NumberToMalayalamInput): Promise<NumberToMalayalamOutput> {
  return numberToMalayalamFlow(input);
}

const numberToMalayalamPrompt = ai.definePrompt({
  name: 'numberToMalayalamPrompt',
  input: {schema: NumberToMalayalamInputSchema},
  output: {schema: NumberToMalayalamOutputSchema},
  prompt: `You are a Malayalam number conversion assistant.

Task:
Convert the given number into Malayalam words using the Indian numbering system.

Strict rules:
1. Output Malayalam words only.
2. No English.
3. No explanation or additional text.
4. Use correct Indian numbering system (thousand, lakh, crore).
5. Ensure proper joining words (e.g., ആയിരം becomes ആയിരത്തി followed by smaller numbers, ലക്ഷം becomes ലക്ഷത്തി).
6. Use correct Malayalam grammar and spelling.

Example:
Input: 28584
Output: {"text": "ഇരുപത്തിയെട്ടായിരത്തി അഞ്ഞൂറ്റി എൺപത്തിനാലു"}

Number: {{number}}`,
});

const numberToMalayalamFlow = ai.defineFlow(
  {
    name: 'numberToMalayalamFlow',
    inputSchema: NumberToMalayalamInputSchema,
    outputSchema: NumberToMalayalamOutputSchema,
  },
  async input => {
    const {output} = await callWithRetry(() => numberToMalayalamPrompt(input));
    if (!output || !output.text) {
        throw new Error('AI failed to generate Malayalam words for the given number.');
    }
    return output;
  }
);
