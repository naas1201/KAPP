'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isFuture } from 'date-fns';
import Link from 'next/link';

interface NextAppointmentCountdownProps {
  appointment: {
    id: string;
    dateTime: string;
    serviceType: string;
    status: string;
  } | null;
}

export function NextAppointmentCountdown({ appointment }: NextAppointmentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (!appointment) return;

    const updateCountdown = () => {
      const appointmentDate = new Date(appointment.dateTime);
      if (!isFuture(appointmentDate)) {
        setTimeLeft(null);
        return;
      }

      const now = new Date();
      const days = differenceInDays(appointmentDate, now);
      const hours = differenceInHours(appointmentDate, now) % 24;
      const minutes = differenceInMinutes(appointmentDate, now) % 60;

      setTimeLeft({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [appointment]);

  if (!appointment || !timeLeft) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">No upcoming appointments</p>
          <Button asChild>
            <Link href="/booking">Book an Appointment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const appointmentDate = new Date(appointment.dateTime);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Next Appointment</h3>
          <Clock className="w-5 h-5 text-primary" />
        </div>

        <div className="mb-4">
          <p className="font-medium text-lg">{appointment.serviceType}</p>
          <p className="text-sm text-muted-foreground">
            {format(appointmentDate, 'EEEE, MMMM d, yyyy')} at{' '}
            {format(appointmentDate, 'h:mm a')}
          </p>
        </div>

        {/* Countdown display */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-background">
            <p className="text-3xl font-bold text-primary">{timeLeft.days}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background">
            <p className="text-3xl font-bold text-primary">{timeLeft.hours}</p>
            <p className="text-xs text-muted-foreground">Hours</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background">
            <p className="text-3xl font-bold text-primary">{timeLeft.minutes}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
        </div>

        <Button asChild variant="secondary" className="w-full">
          <Link href="/patient/appointments">
            View All Appointments
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
