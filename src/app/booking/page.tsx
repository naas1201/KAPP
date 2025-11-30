
'use client';

import { useState, useCallback, useEffect } from 'react';
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
  BriefcaseMedical,
  CreditCard,
  Wallet,
  LogIn,
  Loader2,
  Tag,
  X,
  AlertCircle
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { services, doctors } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useDoc, useMemoFirebase } from '@/firebase/hooks';
import { collection, serverTimestamp, doc, increment, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { motion } from 'framer-motion';
import { StripePaymentForm } from '@/components/StripePaymentForm';


const steps = [
  { id: 'Step 1', name: 'Select Service', icon: <Sparkles /> },
  { id: 'Step 2', name: 'Choose Doctor', icon: <BriefcaseMedical /> },
  { id: 'Step 3', name: 'Choose Date & Time', icon: <CalendarIcon /> },
  { id: 'Step 4', name: 'Payment', icon: <CreditCard /> },
  { id: 'Step 5', name: 'Confirmation', icon: <CheckCircle /> },
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
  doctorId: z.string().min(1, 'Please select a doctor.'),
  date: z.date({ required_error: 'A date is required.' }).refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    'Please select a date that is not in the past.'
  ),
  time: z.string().min(1, 'Please select a time.'),
  paymentMethod: z.string().min(1, 'Please select a payment method.'),
});

type FormData = z.infer<typeof formSchema>;

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  // Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();

  // Fetch patient data to check appointment count for returning client discounts
  const patientRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'patients', user.uid);
  }, [firestore, user]);
  
  const { data: patientData } = useDoc(patientRef);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/booking');
    }
  }, [user, isUserLoading, router]);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: '',
      doctorId: '',
      time: '',
      paymentMethod: 'gcash'
    },
  });

  // Called after successful Stripe payment
  const handlePaymentSuccess = useCallback(async (intentId: string) => {
    setPaymentIntentId(intentId);
    const data = form.getValues();
    
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to complete your booking.',
      });
      return;
    }
    
    // Combine date and time
    const dateTime = new Date(data.date);
    const [time, period] = data.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    dateTime.setHours(hours, minutes, 0, 0);

    const patientId = user.uid;
    const serviceName = services.flatMap(s => s.treatments).find(t => t.id === data.service)?.name;
    
    if (!serviceName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected service not found. Please try again.',
      });
      return;
    }

    try {
      // Create an appointment with payment info
      const appointmentData: any = {
        patientId,
        doctorId: data.doctorId,
        serviceType: serviceName,
        dateTime: dateTime.toISOString(),
        status: 'confirmed', // Payment successful means confirmed
        paymentIntentId: intentId,
        paymentStatus: 'paid',
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        notes: '',
        patientNotes: '',
        attachments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add coupon info if applied
      if (appliedCoupon) {
        appointmentData.couponCode = appliedCoupon.code;
        appointmentData.couponDiscount = appliedCoupon.discountType === 'percentage' 
          ? (originalPrice * appliedCoupon.discountValue / 100) 
          : appliedCoupon.discountValue;
          
        // Increment coupon usage count
        const couponRef = doc(firestore, 'discountCodes', appliedCoupon.id);
        await updateDocumentNonBlocking(couponRef, {
          usageCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }
      
      const appointmentRef = collection(firestore, 'patients', patientId, 'appointments');
      const newDoc = await addDocumentNonBlocking(appointmentRef, appointmentData);

      if (newDoc?.id) {
        // Also write to top-level appointments collection for doctor/admin access
        const topLevelRef = doc(firestore, 'appointments', newDoc.id);
        setDocumentNonBlocking(topLevelRef, {
          ...appointmentData,
          id: newDoc.id,
        }, { merge: true });
        
        const patientRef = doc(firestore, 'patients', patientId);
        await updateDocumentNonBlocking(patientRef, {
          appointmentCount: increment(1)
        });
        router.push(`/appointment/${newDoc.id}`);
      } else {
        toast({
          variant: 'destructive',
          title: "Error",
          description: `Failed to create appointment. Please try again.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Booking Error",
        description: `Payment was successful but failed to save appointment. Please contact support with payment ID: ${intentId}`,
      });
    }
  }, [firestore, user, form, toast, router, originalPrice, finalPrice, appliedCoupon]);

  const handlePaymentError = useCallback((error: string) => {
    toast({
      variant: 'destructive',
      title: "Payment Failed",
      description: error,
    });
  }, [toast]);
  
  // Handle Pay Later functionality
  const handlePayLater = async () => {
    triggerHaptic();
    const data = form.getValues();
    
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to complete your booking.',
      });
      return;
    }
    
    // Combine date and time
    const dateTime = new Date(data.date);
    const [time, period] = data.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    dateTime.setHours(hours, minutes, 0, 0);

    const patientId = user.uid;
    const serviceName = services.flatMap(s => s.treatments).find(t => t.id === data.service)?.name;
    
    if (!serviceName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected service not found. Please try again.',
      });
      return;
    }

    try {
      // Create an appointment with pending payment status
      const appointmentData: any = {
        patientId,
        doctorId: data.doctorId,
        serviceType: serviceName,
        dateTime: dateTime.toISOString(),
        status: 'pending', // Pending until payment is made or confirmed by clinic
        paymentStatus: 'pending_payment',
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        notes: '',
        patientNotes: '',
        attachments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add coupon info if applied
      if (appliedCoupon) {
        appointmentData.couponCode = appliedCoupon.code;
        appointmentData.couponDiscount = appliedCoupon.discountType === 'percentage' 
          ? (originalPrice * appliedCoupon.discountValue / 100) 
          : appliedCoupon.discountValue;
          
        // Increment coupon usage count
        const couponRef = doc(firestore, 'discountCodes', appliedCoupon.id);
        await updateDocumentNonBlocking(couponRef, {
          usageCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }
      
      const appointmentRef = collection(firestore, 'patients', patientId, 'appointments');
      const newDoc = await addDocumentNonBlocking(appointmentRef, appointmentData);

      if (newDoc?.id) {
        // Also write to top-level appointments collection for doctor/admin access
        const topLevelRef = doc(firestore, 'appointments', newDoc.id);
        setDocumentNonBlocking(topLevelRef, {
          ...appointmentData,
          id: newDoc.id,
        }, { merge: true });
        
        const patientRef = doc(firestore, 'patients', patientId);
        await updateDocumentNonBlocking(patientRef, {
          appointmentCount: increment(1)
        });
        
        toast({
          title: 'Appointment Requested',
          description: 'Your appointment has been requested. Payment is due at the clinic.',
        });
        
        setCurrentStep(4); // Move to confirmation step
        setPaymentIntentId('pay-later-' + newDoc.id);
      } else {
        toast({
          variant: 'destructive',
          title: "Error",
          description: `Failed to create appointment. Please try again.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Booking Error",
        description: `Failed to save appointment. Please try again.`,
      });
    }
  };
  
  // Validate and apply coupon code
  const validateCoupon = async () => {
    if (!couponCode.trim() || !firestore) return;
    
    setIsValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const selectedServiceId = form.getValues('service');
      const selectedService = services.flatMap(s => s.treatments).find(t => t.id === selectedServiceId);
      const serviceCategory = services.find(s => s.treatments.some(t => t.id === selectedServiceId))?.slug;
      
      // Query for the coupon code
      const couponsRef = collection(firestore, 'discountCodes');
      const q = query(couponsRef, where('code', '==', couponCode.toUpperCase().trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCouponError('Invalid coupon code.');
        setIsValidatingCoupon(false);
        return;
      }
      
      const couponDoc = snapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as any;
      
      // Check if coupon is active
      if (!coupon.isActive) {
        setCouponError('This coupon is no longer active.');
        setIsValidatingCoupon(false);
        return;
      }
      
      // Check if coupon is expired
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        setCouponError('This coupon has expired.');
        setIsValidatingCoupon(false);
        return;
      }
      
      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        setCouponError('This coupon has reached its usage limit.');
        setIsValidatingCoupon(false);
        return;
      }
      
      // Check criteria
      if (coupon.criteriaType === 'service' && coupon.serviceId !== selectedServiceId) {
        const requiredService = services.flatMap(s => s.treatments).find(t => t.id === coupon.serviceId);
        setCouponError(`This coupon is only valid for "${requiredService?.name || 'a specific service'}".`);
        setIsValidatingCoupon(false);
        return;
      }
      
      if (coupon.criteriaType === 'category' && coupon.categorySlug !== serviceCategory) {
        const requiredCategory = services.find(s => s.slug === coupon.categorySlug);
        setCouponError(`This coupon is only valid for "${requiredCategory?.title || 'a specific category'}".`);
        setIsValidatingCoupon(false);
        return;
      }
      
      if (coupon.criteriaType === 'minimum_amount' && originalPrice < coupon.minimumAmount) {
        setCouponError(`This coupon requires a minimum order of ₱${coupon.minimumAmount.toLocaleString()}.`);
        setIsValidatingCoupon(false);
        return;
      }
      
      if (coupon.criteriaType === 'returning_client') {
        const patientAppointmentCount = patientData?.appointmentCount || 0;
        if (patientAppointmentCount < (coupon.minAppointmentCount || 1)) {
          setCouponError(`This coupon is only for returning clients with ${coupon.minAppointmentCount || 1}+ previous appointments.`);
          setIsValidatingCoupon(false);
          return;
        }
      }
      
      // Coupon is valid - calculate discount
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (originalPrice * coupon.discountValue) / 100;
      } else {
        discount = coupon.discountValue;
      }
      
      // Ensure final price is never negative
      const newFinalPrice = Math.max(0, originalPrice - discount);
      
      setAppliedCoupon(coupon);
      setFinalPrice(newFinalPrice);
      
      toast({
        title: 'Coupon Applied!',
        description: `You saved ₱${discount.toLocaleString()} with code "${coupon.code}".`,
      });
      
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    setFinalPrice(originalPrice);
  };

  async function processForm(data: FormData) {
    triggerHaptic();
    // This function is kept for backward compatibility but now payment is handled by Stripe
    // The actual booking happens in handlePaymentSuccess after successful payment
  }

  const next = async () => {
    triggerHaptic();
    const fields =
      currentStep === 0
        ? ['service']
        : currentStep === 1
        ? ['doctorId']
        : currentStep === 2
        ? ['date', 'time']
        : ['paymentMethod'];

    const output = await form.trigger(fields as any, {
      shouldFocus: true,
    });
    if (!output) return;
    
    if (currentStep === 2) {
      // Move to payment step - set initial prices
      const selectedServiceId = form.getValues('service');
      const service = services.flatMap(s => s.treatments).find(t => t.id === selectedServiceId);
      const priceString = service?.price || '₱2,500';
      // Parse price from string like "₱2,500" or "Starts at ₱5,000"
      const priceMatch = priceString.match(/[\d,]+/);
      const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 2500;
      setOriginalPrice(price);
      setFinalPrice(price);
      setCurrentStep(3);
      // Don't show Stripe payment yet - let user choose payment method first
      setShowStripePayment(false);
    } else if (currentStep === 3) {
      // Payment is handled by Stripe form, don't do anything here
      // The Stripe form will call handlePaymentSuccess on success
    } else {
      setCurrentStep((step) => step + 1);
    }
  };

  const prev = () => {
    triggerHaptic();
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const selectedTime = form.watch('time');
  const selectedPaymentMethod = form.watch('paymentMethod');
  const selectedServiceId = form.watch('service');
  const selectedService = services.flatMap(s => s.treatments).find(t => t.id === selectedServiceId);

  // Show loading state while checking auth
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to book an appointment. This ensures the security of your medical records.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login?redirect=/booking">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup?redirect=/booking" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <section className="py-16 md:py-24 marble-background">
        <div className="container text-center max-w-3xl bg-background/80 backdrop-blur-sm p-8 rounded-lg shadow-xl">
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
                      "group flex flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0",
                      index < currentStep ? "border-primary" : index === currentStep ? "border-primary" : "border-border hover:border-gray-300",
                    )}
                  >
                    <span className={cn("text-sm font-medium transition-colors", index <= currentStep ? "text-primary" : "text-muted-foreground group-hover:text-gray-700")}>{step.id}</span>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          <Card>
            <Form {...form}>
              <form>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
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
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Choose a Doctor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a doctor..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {doctors.map(doctor => (
                                                <SelectItem key={doctor.id} value={doctor.id}>
                                                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                )}

                {currentStep === 2 && (
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
                                  <Label htmlFor={time} className={cn(
                                    "flex items-center justify-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
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
                  </CardContent>
                )}

                {currentStep === 3 && (
                    <CardContent className="pt-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">Payment Details</h3>
                            <p className="text-muted-foreground text-sm">Secure your appointment by completing the payment or choose to pay later at the clinic.</p>
                        </div>
                        
                        {!showStripePayment ? (
                          <>
                            {/* Price Summary */}
                            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{selectedService?.name}</p>
                                        <p className="text-sm text-muted-foreground">Consultation Fee</p>
                                    </div>
                                    <p className={cn("text-lg font-bold", appliedCoupon && "line-through text-muted-foreground")}>
                                        ₱{originalPrice.toLocaleString()}
                                    </p>
                                </div>
                                {appliedCoupon && (
                                    <>
                                        <div className="flex justify-between items-center text-green-600">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4" />
                                                <span className="text-sm">Discount ({appliedCoupon.code})</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-5 w-5 p-0"
                                                    onClick={removeCoupon}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <span className="text-sm">
                                                -{appliedCoupon.discountType === 'percentage' 
                                                    ? `${appliedCoupon.discountValue}%` 
                                                    : `₱${appliedCoupon.discountValue.toLocaleString()}`}
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between items-center">
                                            <p className="font-semibold">Total</p>
                                            <p className="text-lg font-bold text-green-600">₱{finalPrice.toLocaleString()}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Coupon Code Input */}
                            {!appliedCoupon && (
                                <div className="space-y-2">
                                    <Label htmlFor="couponCode">Have a discount code?</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="couponCode"
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase());
                                                setCouponError(null);
                                            }}
                                            className="uppercase"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            onClick={validateCoupon}
                                            disabled={isValidatingCoupon || !couponCode.trim()}
                                        >
                                            {isValidatingCoupon ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Apply'
                                            )}
                                        </Button>
                                    </div>
                                    {couponError && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{couponError}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                            
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-lg font-semibold">Select Payment Method</FormLabel>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-1 gap-4"
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="gcash" id="gcash" className="sr-only" />
                                            </FormControl>
                                            <Label htmlFor="gcash" className={cn(
                                                "flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                                                selectedPaymentMethod === 'gcash' && "border-primary bg-primary/10 text-primary"
                                                )}>
                                                <div className="flex items-center gap-3">
                                                    <Wallet className="w-5 h-5"/>
                                                    <span>GCash</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">Pay with your GCash wallet</span>
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="card" id="card" className="sr-only" />
                                            </FormControl>
                                            <Label htmlFor="card" className={cn(
                                                "flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                                                selectedPaymentMethod === 'card' && "border-primary bg-primary/10 text-primary"
                                                )}>
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="w-5 h-5"/>
                                                    <span>Credit / Debit Card</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">Visa, Mastercard, etc.</span>
                                            </Label>
                                        </FormItem>
                                    </RadioGroup>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-3">
                                <Button 
                                  type="button" 
                                  className="w-full" 
                                  size="lg"
                                  onClick={() => setShowStripePayment(true)}
                                >
                                  Pay Now - ₱{finalPrice.toLocaleString()}
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  className="w-full" 
                                  size="lg"
                                  onClick={handlePayLater}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Pay Later at Clinic
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                  Choose "Pay Later" to pay at the clinic. Your appointment will be pending confirmation.
                                </p>
                            </div>
                          </>
                        ) : (
                          <StripePaymentForm
                            serviceId={form.getValues('service')}
                            serviceName={selectedService?.name || 'Medical Consultation'}
                            paymentMethod={selectedPaymentMethod as 'card' | 'gcash'}
                            customerEmail={user?.email || ''}
                            customerName={user?.displayName || ''}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            couponCode={appliedCoupon?.code}
                            finalAmount={finalPrice}
                          />
                        )}
                    </CardContent>
                )}


                {currentStep === 4 && (
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h2 className="mt-4 text-2xl font-semibold">
                            {paymentIntentId?.startsWith('pay-later') ? 'Appointment Requested!' : 'Payment Successful!'}
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {paymentIntentId?.startsWith('pay-later') 
                                ? 'Your appointment has been requested. Please pay at the clinic on the day of your visit.'
                                : 'Your appointment has been confirmed. Thank you for booking with us!'}
                        </p>
                        <div className="p-4 mt-6 text-left border rounded-lg bg-muted/50">
                            <h3 className="font-semibold">Appointment Details:</h3>
                            <p><strong>Service:</strong> {services.flatMap(s => s.treatments).find(t => t.id === form.getValues('service'))?.name}</p>
                            <p><strong>Doctor:</strong> Dr. {doctors.find(d => d.id === form.getValues('doctorId'))?.firstName} {doctors.find(d => d.id === form.getValues('doctorId'))?.lastName}</p>
                            <p><strong>Date:</strong> {form.getValues('date') instanceof Date ? format(form.getValues('date'), 'EEEE, MMMM d, yyyy') : 'N/A'}</p>
                            <p><strong>Time:</strong> {form.getValues('time')}</p>
                            <p><strong>Amount:</strong> ₱{finalPrice.toLocaleString()}</p>
                            {appliedCoupon && (
                                <p className="text-green-600"><strong>Discount Applied:</strong> {appliedCoupon.code}</p>
                            )}
                            <p><strong>Payment Status:</strong> {paymentIntentId?.startsWith('pay-later') ? 'Pay at Clinic' : 'Paid'}</p>
                            {paymentIntentId && !paymentIntentId.startsWith('pay-later') && (
                              <p className="mt-2 text-sm text-muted-foreground"><strong>Payment Reference:</strong> {paymentIntentId}</p>
                            )}
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">A confirmation email has been sent to {user?.email}</p>
                        <Button asChild className="mt-6">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                )}
                </motion.div>
                
                <CardFooter className="justify-between pt-6">
                    {currentStep > 0 && currentStep < 4 && !showStripePayment && (
                        <Button type="button" variant="outline" onClick={prev}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                        </Button>
                    )}
                    {currentStep === 3 && showStripePayment && (
                        <Button type="button" variant="outline" onClick={() => setShowStripePayment(false)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Change Payment Method
                        </Button>
                    )}
                    <div/>
                    {currentStep < 3 && (
                        <Button type="button" onClick={next}>
                        Next <ArrowRight className="w-4 h-4 ml-2" />
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
