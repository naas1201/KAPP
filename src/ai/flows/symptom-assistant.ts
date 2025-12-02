'use server';

/**
 * @fileOverview AI-powered symptom assistant that helps patients describe their symptoms professionally
 * and provides helpful pre-consultation guidance.
 *
 * This flow helps patients articulate their concerns in a way that's useful for doctors,
 * while providing relevant health information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SymptomAssistantInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The patient-described symptoms or health concerns'),
  patientAge: z
    .number()
    .optional()
    .describe('Optional: Patient age for more relevant guidance'),
  appointmentType: z
    .string()
    .optional()
    .describe('The type of appointment (e.g., general consultation, aesthetic treatment)'),
});

export type SymptomAssistantInput = z.infer<typeof SymptomAssistantInputSchema>;

const SymptomAssistantOutputSchema = z.object({
  structuredSymptoms: z
    .string()
    .describe('A professionally structured description of the symptoms'),
  relevantQuestions: z
    .array(z.string())
    .describe('Questions the patient should be ready to answer'),
  preConsultationTips: z
    .array(z.string())
    .describe('Tips to prepare for the consultation'),
  urgencyLevel: z
    .enum(['routine', 'should_schedule_soon', 'seek_immediate_care'])
    .describe('General urgency assessment - not a medical diagnosis'),
  disclaimer: z
    .string()
    .describe('Medical disclaimer about this being informational only'),
});

export type SymptomAssistantOutput = z.infer<typeof SymptomAssistantOutputSchema>;

export async function analyzeSymptoms(
  input: SymptomAssistantInput
): Promise<SymptomAssistantOutput> {
  return symptomAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomAssistantPrompt',
  input: { schema: SymptomAssistantInputSchema },
  output: { schema: SymptomAssistantOutputSchema },
  prompt: `You are a helpful medical assistant at Castillo Health & Aesthetics clinic in the Philippines. 
Your role is to help patients describe their symptoms professionally for their upcoming doctor consultation.

IMPORTANT: You are NOT providing medical diagnoses. You are only helping patients prepare for their appointment.

Patient's described symptoms: {{{symptoms}}}
{{#if patientAge}}Patient age: {{{patientAge}}}{{/if}}
{{#if appointmentType}}Appointment type: {{{appointmentType}}}{{/if}}

Please provide:
1. A professionally structured summary of the symptoms that would be helpful for the doctor
2. 3-5 relevant questions the patient should be prepared to answer
3. 2-3 practical tips to prepare for the consultation
4. A general urgency assessment (routine, should_schedule_soon, seek_immediate_care)
5. A clear medical disclaimer

Remember:
- Be empathetic and professional
- Do not diagnose or recommend treatments
- Focus on helping the patient communicate effectively with their doctor
- If symptoms sound serious, always recommend seeking immediate medical attention
- Use clear, non-technical language
`,
});

const symptomAssistantFlow = ai.defineFlow(
  {
    name: 'symptomAssistantFlow',
    inputSchema: SymptomAssistantInputSchema,
    outputSchema: SymptomAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
