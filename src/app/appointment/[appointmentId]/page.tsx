
'use client';

import { useState, useEffect, useCallback } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useDoc, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase/hooks';
import { doc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles, 
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Phone,
  MapPin,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  CreditCard,
  MessageSquare,
  Image as ImageIcon,
  Trash2,
  Stethoscope,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const availableTimes = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

interface PatientProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  dateOfBirth?: string;
  allergies?: string;
  medicalConditions?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export default function AppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { width, height } = useWindowSize();
  const { toast } = useToast();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [patientNotes, setPatientNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  
  // Patient profile state
  const [profile, setProfile] = useState<PatientProfile>({});

  // Check if this is the first visit (show confetti)
  useEffect(() => {
    const hasSeenConfetti = sessionStorage.getItem(`appointment-${appointmentId}-confetti`);
    if (!hasSeenConfetti) {
      setShowConfetti(true);
      sessionStorage.setItem(`appointment-${appointmentId}-confetti`, 'true');
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [appointmentId]);

  const appointmentRef = useMemoFirebase(() => {
    if (!firestore || !user || !appointmentId) return null;
    return doc(firestore, 'patients', user.uid, 'appointments', appointmentId as string);
  }, [firestore, user, appointmentId]);

  const patientRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'patients', user.uid);
  }, [firestore, user]);

  // Fetch doctors from Firestore
  const doctorsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);

  const { data: appointment, isLoading } = useDoc(appointmentRef);
  const { data: patientData } = useDoc<PatientProfile>(patientRef);
  const { data: doctors } = useCollection(doctorsRef);

  // Initialize notes and profile from data
  useEffect(() => {
    if (appointment?.patientNotes) {
      setPatientNotes(appointment.patientNotes);
    }
  }, [appointment]);

  useEffect(() => {
    if (patientData) {
      setProfile(patientData);
    }
  }, [patientData]);

  const handleSaveNotes = useCallback(async () => {
    if (!appointmentRef || !firestore) return;
    
    setIsSavingNotes(true);
    try {
      await updateDoc(appointmentRef, {
        patientNotes,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Notes Saved',
        description: 'Your notes have been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
      });
    } finally {
      setIsSavingNotes(false);
    }
  }, [appointmentRef, firestore, patientNotes, toast]);

  const handleReschedule = useCallback(async () => {
    if (!appointmentRef || !firestore || !rescheduleDate || !rescheduleTime) return;
    
    setIsRescheduling(true);
    try {
      // Combine date and time
      const dateTime = new Date(rescheduleDate);
      const [time, period] = rescheduleTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      dateTime.setHours(hours, minutes, 0, 0);

      await updateDoc(appointmentRef, {
        dateTime: dateTime.toISOString(),
        status: 'rescheduled',
        updatedAt: serverTimestamp(),
      });
      
      setShowRescheduleDialog(false);
      toast({
        title: 'Appointment Rescheduled',
        description: `Your appointment has been rescheduled to ${format(dateTime, 'EEEE, MMMM d, yyyy')} at ${rescheduleTime}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reschedule appointment. Please try again.',
      });
    } finally {
      setIsRescheduling(false);
    }
  }, [appointmentRef, firestore, rescheduleDate, rescheduleTime, toast]);

  const handleCancel = useCallback(async () => {
    if (!appointmentRef || !firestore) return;
    
    setIsCancelling(true);
    try {
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled. Contact support if you need assistance with refunds.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel appointment. Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  }, [appointmentRef, firestore, toast]);

  const handleSaveProfile = useCallback(async () => {
    if (!patientRef || !firestore) return;
    
    setIsSavingProfile(true);
    try {
      await updateDoc(patientRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  }, [patientRef, firestore, profile, toast]);

  if (isLoading || isUserLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your appointment details.</p>
            <Button asChild>
              <Link href={`/login?redirect=/appointment/${appointmentId}`}>Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    notFound();
  }

  const serviceName = appointment.serviceType;
  const appointmentDate = new Date(appointment.dateTime);
  const appointmentStatus = appointment.status || 'pending';
  const isCancelled = appointmentStatus === 'cancelled';
  const isPast = appointmentDate < new Date();
  const doctorInfo = doctors?.find((d: any) => d.id === appointment.doctorId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-blue-500">Rescheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
      
      <div className="py-8 md:py-12 bg-muted/20 min-h-screen">
        <div className="container max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          {/* Main Appointment Card */}
          <Card className="shadow-lg mb-6">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-primary/10 p-8">
              {isCancelled ? (
                <XCircle className="w-16 h-16 mx-auto text-destructive" />
              ) : (
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              )}
              <CardTitle className="text-3xl font-headline mt-4">
                {isCancelled ? 'Appointment Cancelled' : 'Appointment Confirmed'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isCancelled 
                  ? 'This appointment has been cancelled. Contact support for refund inquiries.'
                  : 'Your appointment is confirmed. See details below.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              {/* Appointment Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-headline flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Appointment Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium">{serviceName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{format(appointmentDate, 'h:mm a')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {getStatusBadge(appointmentStatus)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-headline flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Doctor Information
                  </h3>
                  
                  {doctorInfo && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p className="font-medium">Dr. {doctorInfo.firstName} {doctorInfo.lastName}</p>
                      <p className="text-sm text-muted-foreground">{doctorInfo.specialization}</p>
                      <p className="text-sm text-muted-foreground">{doctorInfo.email}</p>
                    </div>
                  )}

                  {appointment.paymentIntentId && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment</p>
                        <p className="font-medium text-green-600">Paid</p>
                        <p className="text-xs text-muted-foreground">Ref: {appointment.paymentIntentId.slice(0, 20)}...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isCancelled && !isPast && (
                <div className="mt-8 pt-6 border-t flex flex-wrap gap-3">
                  <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>
                          Select a new date and time for your appointment.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Select New Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !rescheduleDate && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {rescheduleDate ? format(rescheduleDate, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={rescheduleDate}
                                onSelect={setRescheduleDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Select New Time</Label>
                          <RadioGroup
                            value={rescheduleTime}
                            onValueChange={setRescheduleTime}
                            className="grid grid-cols-2 gap-2"
                          >
                            {availableTimes.map((time) => (
                              <div key={time}>
                                <RadioGroupItem value={time} id={`time-${time}`} className="sr-only" />
                                <Label
                                  htmlFor={`time-${time}`}
                                  className={cn(
                                    'flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-accent',
                                    rescheduleTime === time && 'border-primary bg-primary/10'
                                  )}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  {time}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleReschedule} 
                          disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
                        >
                          {isRescheduling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Rescheduling...
                            </>
                          ) : (
                            'Confirm Reschedule'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Appointment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this appointment? This action cannot be undone.
                          Please contact support for refund inquiries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Yes, Cancel Appointment'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Additional Features */}
          <Tabs defaultValue="notes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notes">
                <MessageSquare className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="medical">
                <Stethoscope className="w-4 h-4 mr-2" />
                Medical Info
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Notes for Doctor</CardTitle>
                  <CardDescription>
                    Add any notes, symptoms, or questions you&apos;d like to discuss with your doctor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe your symptoms, questions, or any information you'd like the doctor to know before your appointment..."
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                    {isSavingNotes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Notes'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Medical Info Tab */}
            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Consultation Preparation
                  </CardTitle>
                  <CardDescription>
                    Complete this form to help your doctor prepare for your consultation.
                    This information is only visible to your medical team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Medical Summary */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                      <Textarea
                        id="chiefComplaint"
                        placeholder="What brings you in today? Describe your main concern..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symptomDuration">Duration of Symptoms</Label>
                      <Input
                        id="symptomDuration"
                        placeholder="e.g., 2 weeks, 3 months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentMedications">Current Medications</Label>
                      <Textarea
                        id="currentMedications"
                        placeholder="List all medications with dosages..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Known Allergies</Label>
                      <Textarea
                        id="allergies"
                        placeholder="List any allergies to medications, food, etc..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="medicalHistory">Relevant Medical History</Label>
                      <Textarea
                        id="medicalHistory"
                        placeholder="Previous conditions, surgeries, hospitalizations..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="additionalQuestions">Questions for the Doctor</Label>
                      <Textarea
                        id="additionalQuestions"
                        placeholder="Any specific questions you'd like answered during your consultation..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Pain Scale */}
                  <div className="space-y-2">
                    <Label>Pain Level (if applicable)</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">No Pain</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        defaultValue="0"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">Severe</span>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Medical Information Privacy</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          This information is securely stored and only accessible to your assigned doctors.
                          You can update or delete this information at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>
                    Save Medical Information
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Upload Documents & Photos</CardTitle>
                  <CardDescription>
                    Upload medical records, test results, or photos related to your condition.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Upload Files</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop files here, or click to browse
                        </p>
                        <Button variant="outline" disabled>
                          <Upload className="w-4 h-4 mr-2" />
                          Browse Files
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, PDF (max 10MB each)
                      </p>
                    </div>
                  </div>

                  {/* Storage Setup Notice */}
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-200">Storage Setup Required</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          File upload requires Firebase Storage to be configured. Please refer to the 
                          <a 
                            href="https://github.com/naas1201/KAPP/blob/main/docs/STORAGE_SETUP.md" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline ml-1"
                          >
                            Storage Setup Guide
                          </a> 
                          for instructions on enabling this feature.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files List (placeholder) */}
                  {appointment.attachments && appointment.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Uploaded Files</h4>
                      {appointment.attachments.map((attachment: Attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {attachment.type.startsWith('image/') ? (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="text-sm">{attachment.name}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Your Profile</CardTitle>
                  <CardDescription>
                    Keep your contact and medical information up to date.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Information
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName || ''}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          placeholder="Juan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="flex gap-2">
                          <Input
                            id="lastName"
                            value={profile.lastName || ''}
                            disabled
                            className="bg-muted"
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Request Change
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Last Name Change</DialogTitle>
                                <DialogDescription>
                                  For security purposes, last name changes require admin approval and ID verification.
                                  Your ID will be securely stored and deleted 6 days after your request is processed.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Current Last Name</Label>
                                  <Input value={profile.lastName || ''} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newLastName">New Last Name</Label>
                                  <Input id="newLastName" placeholder="Enter new last name" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="nameChangeReason">Reason for Change</Label>
                                  <Textarea id="nameChangeReason" placeholder="e.g., Marriage, legal name change..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                  <Label>ID Document (Required)</Label>
                                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Upload a valid government ID</p>
                                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF (max 5MB)</p>
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                                  <p className="text-xs text-amber-700 dark:text-amber-300">
                                    <strong>Privacy Notice:</strong> Your ID document will only be visible to administrators
                                    and will be automatically deleted 6 days after your request is processed.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button disabled>Submit Request</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last name changes require admin approval with ID verification
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email || user.email || ''}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          placeholder="juan@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="09171234567"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={profile.address || ''}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                          placeholder="123 Main Street, Barangay Example"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City/Municipality</Label>
                        <Input
                          id="city"
                          value={profile.city || ''}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          placeholder="Makati City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province</Label>
                        <Input
                          id="province"
                          value={profile.province || ''}
                          onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                          placeholder="Metro Manila"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={profile.postalCode || ''}
                          onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                          placeholder="1200"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Emergency Contact
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Contact Name</Label>
                        <Input
                          id="emergencyContact"
                          value={profile.emergencyContact || ''}
                          onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                          placeholder="Maria Dela Cruz"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          value={profile.emergencyPhone || ''}
                          onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                          placeholder="09171234567"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Medical Information
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="allergies">Known Allergies</Label>
                        <Textarea
                          id="allergies"
                          value={profile.allergies || ''}
                          onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                          placeholder="List any known allergies (medications, food, etc.)"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicalConditions">Pre-existing Conditions</Label>
                        <Textarea
                          id="medicalConditions"
                          value={profile.medicalConditions || ''}
                          onChange={(e) => setProfile({ ...profile, medicalConditions: e.target.value })}
                          placeholder="List any pre-existing medical conditions"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Profile'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
