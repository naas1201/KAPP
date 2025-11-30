'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

export default function PatientAppointmentsPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  // Fetch patient appointments
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'patients', user.uid, 'appointments'),
      orderBy('dateTime', 'desc')
    );
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Categorize appointments
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) return { upcomingAppointments: [], pastAppointments: [] };
    
    const upcoming: any[] = [];
    const past: any[] = [];
    
    appointments.forEach((apt: any) => {
      const aptDate = new Date(apt.dateTime);
      if (isFuture(aptDate) || isToday(aptDate)) {
        upcoming.push(apt);
      } else {
        past.push(apt);
      }
    });
    
    // Sort upcoming by date ascending
    upcoming.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = isUserLoading || isLoadingAppointments;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderAppointmentTable = (appointmentList: any[], showActions: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointmentList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 4 : 3} className="text-center text-muted-foreground py-8">
              No appointments found.
            </TableCell>
          </TableRow>
        ) : (
          appointmentList.map((apt: any) => (
            <TableRow key={apt.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Stethoscope className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{apt.serviceType}</p>
                    {apt.patientNotes && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        Notes: {apt.patientNotes}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p>{format(new Date(apt.dateTime), 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(apt.dateTime), 'h:mm a')}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(apt.status)}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/patient/dashboard`}>
                      Prepare <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your appointments</p>
        </div>
        <Button asChild>
          <Link href="/booking">
            <Calendar className="w-4 h-4 mr-2" />
            Book New Appointment
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments that are coming up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAppointmentTable(upcomingAppointments, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>
                Your past appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAppointmentTable(pastAppointments, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
