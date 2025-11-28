
'use client';

import { useMemo, useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Sparkles, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { services } from '@/lib/data';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function AppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000); // Stop confetti after 8 seconds
    return () => clearTimeout(timer);
  }, []);

  const appointmentRef = useMemo(() => {
    if (!firestore || !user || !appointmentId) return null;
    return doc(firestore, 'patients', user.uid, 'appointments', appointmentId as string);
  }, [firestore, user, appointmentId]);

  const { data: appointment, isLoading } = useDoc(appointmentRef);

  if (isLoading || isUserLoading) {
    return (
      <div className="container max-w-2xl py-12">
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
             <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
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

  return (
    <>
    {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
    <div className="py-16 md:py-24 bg-muted/20">
      <div className="container max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-card p-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <CardTitle className="text-3xl font-headline mt-4">Appointment Booked!</CardTitle>
            <CardDescription className="text-lg">Your request has been received. Please await confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-semibold font-headline">Booking Details</h3>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-semibold">{serviceName}</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{format(appointmentDate, 'h:mm a')}</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
               <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={appointmentStatus === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                  {appointmentStatus}
                </Badge>
              </div>
            </div>
            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>You will receive a notification once the doctor confirms your appointment.</p>
              <p>A confirmation has also been sent to your email.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
