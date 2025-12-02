'use server';

/**
 * @fileOverview AI-powered health tips generator that provides personalized wellness advice
 * based on patient profile and recent health activities.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HealthTipsInputSchema = z.object({
  patientInfo: z.object({
    ageRange: z.string().optional().describe('Age range of the patient'),
    recentServices: z.array(z.string()).optional().describe('Recent services used'),
    interests: z.array(z.string()).optional().describe('Health interests'),
  }).describe('Patient context for personalized tips'),
  category: z
    .enum(['general_wellness', 'skin_care', 'nutrition', 'preventive_care', 'aesthetic_aftercare'])
    .describe('Category of health tips to generate'),
});

export type HealthTipsInput = z.infer<typeof HealthTipsInputSchema>;

const HealthTipsOutputSchema = z.object({
  tips: z.array(
    z.object({
      title: z.string().describe('Short catchy title for the tip'),
      content: z.string().describe('The health tip content'),
      icon: z.string().describe('Suggested emoji icon for the tip'),
    })
  ).describe('Array of 3-5 health tips'),
  featuredTip: z.object({
    title: z.string(),
    content: z.string(),
    callToAction: z.string().describe('Action the patient can take'),
  }).describe('One featured/highlighted tip'),
});

export type HealthTipsOutput = z.infer<typeof HealthTipsOutputSchema>;

export async function generateHealthTips(
  input: HealthTipsInput
): Promise<HealthTipsOutput> {
  return healthTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthTipsPrompt',
  input: { schema: HealthTipsInputSchema },
  output: { schema: HealthTipsOutputSchema },
  prompt: `You are a health and wellness advisor at Castillo Health & Aesthetics, a premier clinic in the Philippines 
specializing in general medicine and aesthetic treatments.

Generate personalized, practical health tips for a patient.

Patient context:
{{#if patientInfo.ageRange}}Age range: {{{patientInfo.ageRange}}}{{/if}}
{{#if patientInfo.recentServices}}Recent services: {{#each patientInfo.recentServices}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if patientInfo.interests}}Health interests: {{#each patientInfo.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Category: {{{category}}}

Guidelines:
- Provide practical, actionable tips that are relevant to the Philippine context
- Include local foods, practices, and climate considerations when appropriate
- Keep tips concise but informative
- Be encouraging and positive
- Do not provide medical diagnoses or treatment recommendations
- Each tip should have a relevant emoji icon

Generate 3-5 helpful tips and one featured tip with a clear call-to-action.
`,
});

const healthTipsFlow = ai.defineFlow(
  {
    name: 'healthTipsFlow',
    inputSchema: HealthTipsInputSchema,
    outputSchema: HealthTipsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
