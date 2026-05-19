'use server';
/**
 * @fileOverview A Malayalam number to words converter.
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

const NumberToMalayalamOutputSchema = z.string().describe('The Malayalam words representation of the number.');

export async function convertNumberToMalayalam(input: NumberToMalayalamInput): Promise<string> {
  return numberToMalayalamFlow(input);
}

const numberToMalayalamPrompt = ai.definePrompt({
  name: 'numberToMalayalamPrompt',
  input: {schema: NumberToMalayalamInputSchema},
  output: {schema: NumberToMalayalamOutputSchema},
  prompt: `You are a Malayalam number conversion assistant.

Task:
Convert the given number into Malayalam words using the Indian numbering system.

Rules:
1. Use correct Malayalam grammar and spelling.
2. Follow Indian number format (thousand, lakh, crore).
3. Combine words properly (e.g., ആയിരം → ആയിരത്തി when followed by smaller numbers).
4. Do not include any extra explanation.
5. Output only the Malayalam words.

Number: {{number}}`,
});

const numberToMalayalamFlow = ai.defineFlow(
  {
    name: 'numberToMalayalamFlow',
    inputSchema: NumberToMalayalamInputSchema,
    outputSchema: NumberToMalayalamOutputSchema,
  },
  async input => {
    const {output} = await numberToMalayalamPrompt(input);
    return output!;
  }
);
