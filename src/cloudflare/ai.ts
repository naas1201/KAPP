/**
 * Cloudflare Workers AI Integration
 * 
 * This module provides utilities for working with Cloudflare Workers AI.
 * It includes functions for text generation and FAQ generation.
 * 
 * @see https://developers.cloudflare.com/workers-ai/
 */

import type { Ai, AiTextGenerationResponse, CloudflareContext } from './types';

/**
 * Get the Workers AI instance from the Cloudflare context
 */
export function getAI(context: CloudflareContext): Ai {
  if (!context?.env?.AI) {
    throw new Error(
      'Workers AI not available. Make sure you have configured the AI binding in wrangler.toml'
    );
  }
  return context.env.AI;
}

/**
 * Available AI models on Cloudflare Workers AI (free tier)
 */
export const AI_MODELS = {
  /** Meta's Llama 3.1 8B - General purpose, best for most tasks */
  LLAMA_3_1_8B: '@cf/meta/llama-3.1-8b-instruct',
  /** Meta's Llama 3.2 3B - Smaller, faster model */
  LLAMA_3_2_3B: '@cf/meta/llama-3.2-3b-instruct',
  /** Mistral 7B - Good for instruction following */
  MISTRAL_7B: '@cf/mistral/mistral-7b-instruct-v0.2',
  /** Microsoft Phi-2 - Smaller, faster model */
  PHI_2: '@cf/microsoft/phi-2',
  /** Qwen 1.5 7B - Multilingual support */
  QWEN_1_5_7B: '@cf/qwen/qwen1.5-7b-chat-awq',
} as const;

/**
 * Default model to use for text generation
 */
export const DEFAULT_MODEL = AI_MODELS.LLAMA_3_1_8B;

/**
 * Options for text generation
 */
export interface TextGenerationOptions {
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature (0-1, higher = more creative) */
  temperature?: number;
  /** Model to use */
  model?: string;
}

/**
 * Generate text using Workers AI
 */
export async function generateText(
  ai: Ai,
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<string> {
  const {
    maxTokens = 500,
    temperature = 0.7,
    model = DEFAULT_MODEL,
  } = options;

  const response = await ai.run<AiTextGenerationResponse>(model, {
    prompt,
    max_tokens: maxTokens,
    temperature,
  });

  return response.response || '';
}

/**
 * Generate text using a chat-style conversation
 */
export async function generateChat(
  ai: Ai,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: TextGenerationOptions = {}
): Promise<string> {
  const {
    maxTokens = 500,
    temperature = 0.7,
    model = DEFAULT_MODEL,
  } = options;

  const response = await ai.run<AiTextGenerationResponse>(model, {
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return response.response || '';
}

/**
 * FAQ item structure
 */
export interface FAQ {
  question: string;
  answer: string;
}

/**
 * Generate FAQs for a medical treatment
 * This replaces the GenKit-based FAQ generation
 */
export async function generateTreatmentFAQ(
  ai: Ai,
  treatmentName: string,
  treatmentDescription: string,
  count = 5
): Promise<FAQ[]> {
  const prompt = `You are a helpful medical assistant. Generate ${count} frequently asked questions and answers about the following medical treatment.

Treatment Name: ${treatmentName}
Description: ${treatmentDescription}

Generate clear, professional, and accurate FAQs that a patient might ask about this treatment.
Format your response as a JSON array with objects containing "question" and "answer" fields.
Only output valid JSON, no additional text or markdown.

Example format:
[
  {"question": "What is this treatment?", "answer": "This treatment is..."},
  {"question": "How long does it take?", "answer": "The procedure typically takes..."}
]`;

  const response = await generateText(ai, prompt, {
    maxTokens: 2000,
    temperature: 0.7,
  });

  try {
    // Try to parse the JSON response
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is FAQ =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.question === 'string' &&
          typeof item.answer === 'string'
      );
    }
  } catch {
    // If JSON parsing fails, return a default FAQ
    console.error('Failed to parse FAQ response:', response);
  }

  // Return fallback FAQ if parsing fails
  return [
    {
      question: `What is ${treatmentName}?`,
      answer: treatmentDescription || 'Please consult with our medical staff for detailed information about this treatment.',
    },
    {
      question: 'How do I book this treatment?',
      answer: 'You can book this treatment through our online booking system or by contacting our clinic directly.',
    },
  ];
}

/**
 * Generate a brief summary of a medical consultation
 */
export async function generateConsultationSummary(
  ai: Ai,
  consultationNotes: string,
  options: TextGenerationOptions = {}
): Promise<string> {
  const prompt = `Summarize the following medical consultation notes into a brief, patient-friendly summary. 
Keep it concise (2-3 sentences) and focus on key points.

Consultation Notes:
${consultationNotes}

Summary:`;

  return generateText(ai, prompt, {
    maxTokens: 200,
    temperature: 0.5,
    ...options,
  });
}

/**
 * Generate personalized health tips based on patient profile
 */
export async function generateHealthTips(
  ai: Ai,
  patientInfo: {
    age?: number;
    conditions?: string[];
    recentTreatments?: string[];
  }
): Promise<string[]> {
  const { age, conditions = [], recentTreatments = [] } = patientInfo;

  const prompt = `Generate 3-5 personalized health tips for a patient with the following profile:
${age ? `Age: ${age}` : ''}
${conditions.length > 0 ? `Conditions: ${conditions.join(', ')}` : ''}
${recentTreatments.length > 0 ? `Recent treatments: ${recentTreatments.join(', ')}` : ''}

Provide practical, general wellness advice. Do not provide specific medical advice.
Format your response as a JSON array of strings.
Only output valid JSON, no additional text.

Example: ["Stay hydrated by drinking at least 8 glasses of water daily", "Get 7-8 hours of sleep each night"]`;

  const response = await generateText(ai, prompt, {
    maxTokens: 500,
    temperature: 0.7,
  });

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    console.error('Failed to parse health tips response:', response);
  }

  // Return fallback tips
  return [
    'Stay hydrated by drinking plenty of water throughout the day.',
    'Get regular exercise - even a 30-minute walk can make a difference.',
    'Prioritize getting enough sleep each night.',
  ];
}

/**
 * Check if AI is available and working
 */
export async function checkAIHealth(ai: Ai): Promise<boolean> {
  try {
    const response = await generateText(ai, 'Say "OK" if you are working.', {
      maxTokens: 10,
      temperature: 0,
    });
    return response.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}
