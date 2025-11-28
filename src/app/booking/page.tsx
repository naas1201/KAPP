
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  ArrowRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { services } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, increment } from 'firebase/firestore';
import Link from 'next/link';
import { Label } from '@/components/ui/label';


const steps = [
  { id: 'Step 1', name: 'Select Service', icon: <Sparkles /> },
  { id: 'Step 2', name: 'Choose Date & Time', icon: <CalendarIcon /> },
  { id: 'Step 3', name: 'Your Details', icon: <User /> },
  { id: 'Step 4', name: 'Confirmation', icon: <CheckCircle /> },
];

const availableTimes = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

const formSchema = z.object({
  service: z.string().min(1, 'Please select a service.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().min(1, 'Please select a time.'),
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'A valid phone number is required.'),
});

type FormData = z.infer<typeof formSchema>;

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const router = useRouter();


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: '',
      time: '',
      fullName: '',
      email: '',
      phone: '',
    },
  });

  async function processForm(data: FormData) {
    if (!firestore) return;
    
    // Combine date and time
    const dateTime = new Date(data.date);
    const [time, period] = data.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    dateTime.setHours(hours, minutes, 0, 0);

    let patientId = user?.uid;
    const serviceName = services.flatMap(s => s.treatments).find(t => t.id === data.service)?.name;

    // If user is not logged in, create a lead
    if (!patientId) {
      const [firstName, ...lastNameParts] = data.fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      const leadRef = collection(firestore, 'leads');
      addDocumentNonBlocking(leadRef, {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        source: 'Booking Form',
        serviceInterest: serviceName,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Appointment Requested!",
        description: `We've scheduled your ${serviceName} on ${format(data.date, "PPP")} at ${data.time}. We will contact you for confirmation.`,
      });
      setCurrentStep(3);
    } else {
        // If user is logged in, create an appointment
        const appointmentData = {
            patientId,
            doctorId: 'default-doctor-id', // Placeholder
            serviceType: serviceName,
            dateTime: dateTime.toISOString(),
            status: 'pending',
            notes: 'Booked via website.',
        };
        const appointmentRef = collection(firestore, 'patients', patientId, 'appointments');
        const newDocPromise = addDocumentNonBlocking(appointmentRef, appointmentData);

        const patientRef = doc(firestore, 'patients', patientId);
        updateDocumentNonBlocking(patientRef, {
            appointmentCount: increment(1)
        });

        const newDoc = await newDocPromise;
        if (newDoc) {
          router.push(`/appointment/${newDoc.id}`);
        } else {
           // Fallback in case the redirect fails
           toast({
            title: "Appointment Booked!",
            description: `We've scheduled your ${serviceName} on ${format(data.date, "PPP")} at ${data.time}.`,
           });
           setCurrentStep(3);
        }
    }
  }

  const next = async () => {
    const fields =
      currentStep === 0
        ? ['service']
        : currentStep === 1
        ? ['date', 'time']
        : ['fullName', 'email', 'phone'];

    const output = await form.trigger(fields as (keyof FormData)[], {
      shouldFocus: true,
    });
    if (!output) return;
    
    if (currentStep === 2) {
      await form.handleSubmit(processForm)();
    } else {
      setCurrentStep((step) => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  return (
    <>
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl font-bold font-headline sm:text-5xl">
            Book an Appointment
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Schedule your visit in just a few easy steps. We look forward to
            seeing you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl">
          <nav aria-label="Progress" className="mb-12">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
              {steps.map((step, index) => (
                <li key={step.name} className="md:flex-1">
                  <div
                    className={cn(
                      "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0",
                      index < currentStep ? "border-primary" : index === currentStep ? "border-primary" : "border-border hover:border-gray-300",
                    )}
                  >
                    <span className={cn("text-sm font-medium", index <= currentStep ? "text-primary" : "text-muted-foreground group-hover:text-gray-700")}>{step.id}</span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          <Card>
            <Form {...form}>
              <form>
                {currentStep === 0 && (
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">
                            Which service would you like to book?
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <div key={service.slug}>
                                  <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                                    {service.title}
                                  </h3>
                                  {service.treatments.map((treatment) => (
                                    <SelectItem
                                      key={treatment.id}
                                      value={treatment.id}
                                    >
                                      {treatment.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                )}

                {currentStep === 1 && (
                  <CardContent className="pt-6 grid gap-8">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-lg font-semibold">
                            Select a Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() ||
                                  date > new Date(2030, 0, 1)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Available Times</FormLabel>
                           <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
                          >
                            {availableTimes.map((time) => (
                                <FormItem key={time}>
                                  <FormControl>
                                    <RadioGroupItem value={time} id={time} className="sr-only" />
                                  </FormControl>
                                  <Label htmlFor={time} className="flex items-center justify-center p-4 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/10 [&:has([data-state=checked])]:text-primary">
                                    <Clock className="w-4 h-4 mr-2" />
                                    {time}
                                  </Label>
                                </FormItem>
                            ))}
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                )}

                {currentStep === 2 && (
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="Juan Dela Cruz" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl><Input type="email" placeholder="juan@example.com" {...field} /></FormControl>
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
                                <FormControl><Input type="tel" placeholder="09171234567" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                )}

                {currentStep === 3 && (
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h2 className="mt-4 text-2xl font-semibold">Appointment Confirmed!</h2>
                        <p className="mt-2 text-muted-foreground">Thank you for booking with us. A confirmation has been sent to your email.</p>
                        <div className="p-4 mt-6 text-left border rounded-lg bg-muted/50">
                            <h3 className="font-semibold">Appointment Details:</h3>
                            <p><strong>Service:</strong> {services.flatMap(s => s.treatments).find(t => t.id === form.getValues('service'))?.name}</p>
                            <p><strong>Date:</strong> {format(form.getValues('date'), 'EEEE, MMMM d, yyyy')}</p>
                            <p><strong>Time:</strong> {form.getValues('time')}</p>
                        </div>
                        <Button asChild className="mt-6">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                )}
                
                <CardFooter className="justify-between pt-6">
                    {currentStep > 0 && currentStep < 3 && (
                        <Button type="button" variant="outline" onClick={prev}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                        </Button>
                    )}
                    <div/>
                    {currentStep < 2 && (
                        <Button type="button" onClick={next}>
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                    {currentStep === 2 && (
                        <Button type="button" onClick={next} disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                    )}
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </section>
    </>
  );
}
