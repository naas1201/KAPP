'use client';
import { useMemo } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCollection,
  useFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      where('doctorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } =
    useCollection(appointmentsQuery);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } =
    useCollection(patientsQuery);

  const handleConfirmAppointment = (appointmentId: string) => {
    if (!firestore) return;
    const appointmentRef = doc(firestore, 'appointments', appointmentId);
    updateDocumentNonBlocking(appointmentRef, { status: 'confirmed' });
  };

  const enrichedAppointments = useMemo(() => {
    if (!appointments || !patients) return [];
    return appointments.map((apt: any) => {
      const patient = patients.find((p: any) => p.id === apt.patientId);
      return {
        ...apt,
        patientName: patient
          ? `${patient.firstName} ${patient.lastName}`
          : 'Unknown Patient',
        patientEmail: patient ? patient.email : '',
      };
    });
  }, [appointments, patients]);

  const renderSkeleton = () =>
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-16" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-9 w-24 ml-auto" />
        </TableCell>
      </TableRow>
    ));

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-6">
        Doctor Dashboard
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Here are your scheduled appointments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoadingAppointments || isLoadingPatients || isUserLoading) &&
                renderSkeleton()}
              {enrichedAppointments.map((apt: any) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div className="font-medium">{apt.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      {apt.patientEmail}
                    </div>
                  </TableCell>
                  <TableCell>{apt.serviceType}</TableCell>
                  <TableCell>
                    {format(new Date(apt.dateTime), 'PPpp')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        apt.status === 'confirmed' ? 'default' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {apt.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAppointment(apt.id)}
                      >
                        Confirm
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/doctor/patient/${apt.patientId}`}>
                        View Patient
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
