'use server';

/**
 * @fileOverview Automatically generates a FAQ section for new treatment pages based on the treatment details.
 *
 * - generateTreatmentFaq - A function that handles the FAQ generation process.
 * - GenerateTreatmentFaqInput - The input type for the generateTreatmentFaq function.
 * - GenerateTreatmentFaqOutput - The return type for the generateTreatmentFaq function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTreatmentFaqInputSchema = z.object({
  treatmentDetails: z
    .string()
    .describe('Detailed information about the treatment for which to generate the FAQ.'),
});
export type GenerateTreatmentFaqInput = z.infer<typeof GenerateTreatmentFaqInputSchema>;

const GenerateTreatmentFaqOutputSchema = z.object({
  faq: z.string().describe('The generated FAQ section for the treatment.'),
});
export type GenerateTreatmentFaqOutput = z.infer<typeof GenerateTreatmentFaqOutputSchema>;

export async function generateTreatmentFaq(input: GenerateTreatmentFaqInput): Promise<GenerateTreatmentFaqOutput> {
  return generateTreatmentFaqFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTreatmentFaqPrompt',
  input: {schema: GenerateTreatmentFaqInputSchema},
  output: {schema: GenerateTreatmentFaqOutputSchema},
  prompt: `You are an expert in creating frequently asked questions (FAQ) sections for medical and aesthetic treatments.

  Based on the following treatment details, generate an informative and helpful FAQ section for potential patients.
  The FAQ should address common concerns, benefits, and any other relevant information.

  Treatment Details: {{{treatmentDetails}}}
  `,
});

const generateTreatmentFaqFlow = ai.defineFlow(
  {
    name: 'generateTreatmentFaqFlow',
    inputSchema: GenerateTreatmentFaqInputSchema,
    outputSchema: GenerateTreatmentFaqOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
