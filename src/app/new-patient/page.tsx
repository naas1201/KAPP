
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';

const medicalConditions = [
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'heart_disease', label: 'Heart Disease' },
  { id: 'asthma', label: 'Asthma' },
  { id: 'kidney_disease', label: 'Kidney Disease' },
  { id: 'none', label: 'None' },
];

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email(),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  address: z.string().min(5, { message: 'Address is required.' }),
  occupation: z.string().min(2, { message: 'Occupation is required.' }),
  medicalConditions: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  aestheticGoals: z.string().min(10, { message: "Please describe your goals."}),
  imageUpload: z.any().optional(),
});

export default function NewPatientPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      occupation: '',
      medicalConditions: [],
      allergies: '',
      medications: '',
      aestheticGoals: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit this form.",
      });
      return;
    }

    const [firstName, ...lastNameParts] = values.fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const patientData = {
      firstName,
      lastName,
      dateOfBirth: values.birthDate,
      email: values.email,
      phone: values.phone,
      address: values.address,
      occupation: values.occupation,
      medicalHistory: `Conditions: ${values.medicalConditions.join(', ')}. Allergies: ${values.allergies}. Medications: ${values.medications}`,
      aestheticGoals: values.aestheticGoals,
    };
    
    const patientRef = doc(firestore, 'patients', user.uid);
    
    setDocumentNonBlocking(patientRef, patientData, { merge: true });

    toast({
      title: 'Form Submitted Successfully!',
      description: 'Thank you for completing the new patient form. We will review it shortly.',
    });
    form.reset();
  }

  return (
    <>
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            New Patient Form
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Welcome! Please complete this form prior to your first
            consultation to help us understand your needs better.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Please provide your basic details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="juan@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Philippines)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="09171234567"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                           <Input placeholder="e.g., Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                   <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Rizal St, Makati, Metro Manila" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>
                    This information is confidential and crucial for your
                    safety.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="medicalConditions"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">
                            Do you have any of the following conditions?
                          </FormLabel>
                          <FormDescription>
                            Select all that apply.
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {medicalConditions.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="medicalConditions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any known allergies to medications, food, or other substances."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List all prescription and over-the-counter medications you are currently taking."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aesthetic Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="aestheticGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What are your primary concerns or goals for seeking
                          aesthetic treatment?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., reduce wrinkles on forehead, improve skin texture, add volume to lips..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUpload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload Photos (Optional)</FormLabel>
                        <FormDescription>
                          You can upload photos of the area(s) of concern. This
                          will help Dr. Castillo prepare for your consultation.
                        </FormDescription>
                        <FormControl>
                          <Input type="file" accept="image/*" multiple onChange={(e) => field.onChange(e.target.files)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                Submit Form
              </Button>
            </form>
          </Form>
        </div>
      </section>
    </>
  );
}
