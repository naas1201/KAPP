'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateTreatmentFaq } from '@/ai/flows/generate-treatment-faq';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  treatmentDetails: z
    .string()
    .min(50, { message: 'Please provide at least 50 characters of detail.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function GenerateFaqPage() {
  const [generatedFaq, setGeneratedFaq] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      treatmentDetails: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setGeneratedFaq('');
    try {
      const result = await generateTreatmentFaq({
        treatmentDetails: data.treatmentDetails,
      });
      if (result.faq) {
        setGeneratedFaq(result.faq);
        toast({
          title: 'FAQ Generated!',
          description: 'The FAQ has been successfully generated below.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate FAQ. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-6">
        GenAI FAQ Generator
      </h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate a New FAQ</CardTitle>
            <CardDescription>
              Enter the details for a new treatment, and our AI will create a
              Frequently Asked Questions section for it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="treatmentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'HydraFacial is a non-invasive treatment that uses patented technology to cleanse, extract, and hydrate skin. It removes dead skin cells and impurities, while simultaneously bathing the new skin with cleansing, hydrating and moisturizing serums...'"
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be as detailed as possible for the best results. Include
                        what the treatment is, who it's for, and the benefits.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate FAQ'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated FAQ</CardTitle>
            <CardDescription>
              The AI-generated content will appear here. You can copy and paste
              it into the treatment page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {generatedFaq && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedFaq.replace(/\n/g, '<br />') }}
              />
            )}
            {!isLoading && !generatedFaq && (
                <div className="text-center text-muted-foreground py-12">
                    <p>Your generated FAQ will be displayed here.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
