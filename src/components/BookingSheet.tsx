
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Label } from '@/components/ui/label';

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
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
}).refine(data => {
    // If any of the optional fields are provided, they must be valid
    if (data.fullName !== undefined && data.fullName !== null && data.fullName.length < 2) return false;
    if (data.email !== undefined && data.email !== null && !z.string().email().safeParse(data.email).success) return false;
    if (data.phone !== undefined && data.phone !== null && data.phone.length < 10) return false;
    return true;
}, {
    message: "Please provide valid contact details if not logged in.",
    path: ["fullName"], // you can pick any of the optional fields here
});


type FormData = z.infer<typeof formSchema>;

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingSheet({ open, onOpenChange }: BookingSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: '',
      time: '',
      fullName: user?.displayName || '',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
    },
  });

  async function processForm(data: FormData) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not initialized. Please refresh and try again.',
      });
      return;
    }
    
    const dateTime = new Date(data.date);
    const [time, period] = data.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    dateTime.setHours(hours, minutes, 0, 0);

    let patientId = user?.uid;
    const serviceName = services.flatMap(s => s.treatments).find(t => t.id === data.service)?.name;
    
    if (!serviceName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected service not found. Please try again.',
      });
      return;
    }

    if (!patientId) {
      if(!data.fullName || !data.email || !data.phone) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in your name, email, and phone number to book as a guest.",
        });
        return;
      }
      const [firstName, ...lastNameParts] = data.fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      const leadRef = collection(firestore, 'leads');
      try {
        await addDocumentNonBlocking(leadRef, {
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
          description: `We'll contact you shortly to confirm your booking for ${serviceName}.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Booking Error',
          description: 'Failed to save your booking. Please try again.',
        });
        return;
      }
      onOpenChange(false);
      form.reset();
       // Cannot redirect guest users to a specific appointment page without auth
    } else {
        const appointmentData = {
            patientId,
            doctorId: 'default-doctor-id', // Placeholder
            serviceType: serviceName,
            dateTime: dateTime.toISOString(),
            status: 'pending', // New status field
            notes: 'Booked via website.',
        };
        const appointmentRef = collection(firestore, 'patients', patientId, 'appointments');
        try {
          const newDocRef = await addDocumentNonBlocking(appointmentRef, appointmentData);
          
          if (newDocRef?.id) {
            const patientRef = doc(firestore, 'patients', patientId);
            await updateDocumentNonBlocking(patientRef, {
              appointmentCount: increment(1)
            });
            
            onOpenChange(false);
            form.reset();
            // Redirect to the new appointment details page
            router.push(`/appointment/${newDocRef.id}`);
          } else {
            throw new Error('Failed to create appointment');
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Booking Error',
            description: 'Failed to book appointment. Please try again.',
          });
        }
    }
  }

  const selectedTime = form.watch('time');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Book an Appointment</SheetTitle>
          <SheetDescription>
            Schedule your visit in just a few clicks. We look forward to seeing you.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <SelectItem key={treatment.id} value={treatment.id}>
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

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base font-semibold">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                          data-testid="booking-date"
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 1))
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
                  <FormLabel className="text-base font-semibold">Time</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                  >
                    {availableTimes.map((time) => (
                      <FormItem key={time}>
                        <FormControl>
                          <RadioGroupItem value={time} id={`sheet-${time}`} className="sr-only" />
                        </FormControl>
                        <Label 
                            data-testid={`booking-time-${time.replace(/[^a-zA-Z0-9]/g, '')}`}
                            htmlFor={`sheet-${time}`} 
                            className={cn(
                                "flex items-center justify-center p-4 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                selectedTime === time && "border-primary bg-primary/10 text-primary"
                            )}>
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

            {!user && (
              <div className="space-y-4 pt-4 border-t">
                 <p className="text-sm text-muted-foreground">Please provide your details to book as a guest.</p>
                 <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input data-testid="booking-fullname" placeholder="Juan Dela Cruz" {...field} /></FormControl>
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
                    <FormControl><Input data-testid="booking-email" type="email" placeholder="juan@example.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input data-testid="booking-phone" type="tel" placeholder="09171234567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            )}
             <SheetFooter>
                <Button data-testid="booking-submit" type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Booking...' : 'Confirm Booking Request'}
                </Button>
            </SheetFooter>
          </form>
        </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
