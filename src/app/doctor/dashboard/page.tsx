
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
  useUser,
  useFirestore,
  useMemoFirebase,
} from '@/firebase/hooks';
import { updateDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, collectionGroup, serverTimestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Video, Users, Stethoscope, Hourglass, Star, Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function DoctorDashboard() {
  const { firestore } = useFirebase();
  const { user, isLoading: isUserLoading } = useUser();

  // NOTE: For this small clinic setup, ALL doctors can see ALL appointments.
  // This is intentional as the clinic operates with shared visibility among staff.
  // For larger clinics with stricter privacy requirements, filter by:
  // where('doctorId', '==', user.uid)
  // and ensure doctor IDs in Firestore match their Firebase Auth UIDs.
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      orderBy('dateTime', 'desc')
    );
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } =
    useCollection(appointmentsQuery);

  // Consultation requests: find ALL pending appointments using collectionGroup
  // This queries across all patient subcollections for pending appointments
  const consultationRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'appointments'),
      where('status', '==', 'pending')
    );
  }, [firestore, user]);

  const { data: consultationRequests, isLoading: isLoadingConsultationRequests } = useCollection(consultationRequestsQuery);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } =
    useCollection(patientsQuery);

  const doctorServicesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'doctors', user.uid, 'services');
  }, [user, firestore]);
  const { data: myServices, isLoading: isLoadingMyServices } = useCollection(doctorServicesRef);
  
  const ratingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'ratings'),
        where('ratedId', '==', user.uid),
        where('rating', '>=', 4)
    );
  }, [firestore, user]);
  const { data: ratings, isLoading: isLoadingRatings } = useCollection(ratingsQuery);


  const handleConfirmAppointment = (appointmentId: string) => {
    if (!firestore) return;
    const appointmentRef = doc(firestore, 'appointments', appointmentId);
    updateDocumentNonBlocking(appointmentRef, { status: 'confirmed' });
  };

  const handleApproveRequest = async (apt: any) => {
    if (!firestore || !user) return;
    try {
      // mark appointment as confirmed in patient subcollection (if exists)
      const patientAppointmentRef = doc(firestore, 'patients', apt.patientId, 'appointments', apt.id);
      setDocumentNonBlocking(patientAppointmentRef, { status: 'confirmed', confirmedAt: serverTimestamp() }, { merge: true });

      // also set a top-level appointment record for doctor's convenience
      const topLevelRef = doc(firestore, 'appointments', apt.id);
      setDocumentNonBlocking(topLevelRef, { ...apt, status: 'confirmed', confirmedAt: serverTimestamp() }, { merge: true });

      // add patient to doctor's patient list
      const doctorPatientRef = doc(firestore, 'doctors', user.uid, 'patients', apt.patientId);
      setDocumentNonBlocking(doctorPatientRef, { patientId: apt.patientId, addedAt: serverTimestamp() }, { merge: true });

      // feedback
      // Optionally navigate doctor to patient page
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (apt: any) => {
    if (!firestore) return;
    try {
      const patientAppointmentRef = doc(firestore, 'patients', apt.patientId, 'appointments', apt.id);
      setDocumentNonBlocking(patientAppointmentRef, { status: 'rejected', rejectedAt: serverTimestamp() }, { merge: true });
      const topLevelRef = doc(firestore, 'appointments', apt.id);
      setDocumentNonBlocking(topLevelRef, { status: 'rejected', rejectedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error(err);
    }
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
  
  const positiveReviews = useMemo(() => {
    if (!ratings || !patients) return [];
    return ratings
      .filter((r: any) => r.comment)
      .map((review: any) => {
        const patient = patients.find((p: any) => p.id === review.raterId);
        return {
          ...review,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Anonymous',
        };
      });
  }, [ratings, patients]);


  const stats = useMemo(() => {
    if (!appointments || !myServices) {
      return {
        totalAppointments: 0,
        uniquePatients: 0,
        servicesOffered: 0,
        consultationHours: 0,
        showStats: false,
      };
    }
    const totalAppointments = appointments.length;
    const uniquePatients = new Set(appointments.map((a: any) => a.patientId)).size;
    const servicesOffered = myServices.filter((s: any) => s.providesService).length;
    const consultationHours = Math.round(totalAppointments * 0.5); // Assuming 30 mins per consultation
    
    return {
      totalAppointments,
      uniquePatients,
      servicesOffered,
      consultationHours,
      showStats: totalAppointments >= 5, // Show stats after 5 appointments
    };
  }, [appointments, myServices]);

  const isLoading = isLoadingAppointments || isLoadingPatients || isUserLoading || isLoadingMyServices || isLoadingRatings;

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

      <div className="mb-6">
        {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
            </div>
        ) : stats.showStats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.uniquePatients}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services Offered</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stats.servicesOffered}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultation Hours</CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">~{stats.consultationHours}</div>
                </CardContent>
            </Card>
            </div>
        ) : (
             <Card className="bg-muted/50 border-dashed">
                <CardHeader className="text-center">
                    <CardTitle className="text-base font-medium">Performance Data</CardTitle>
                    <CardDescription>We're gathering your performance data. Check back soon!</CardDescription>
                </CardHeader>
             </Card>
        )}
      </div>

       {positiveReviews && positiveReviews.length > 0 && (
         <div className="mb-6">
            <h2 className="text-xl font-bold font-headline mb-4">Words From Your Patients</h2>
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent>
                {positiveReviews.map((review: any) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                    <Card className="h-full">
                        <CardContent className="flex flex-col h-full p-6">
                            <Quote className="w-8 h-8 text-primary/20 mb-4" />
                            <p className="flex-grow text-muted-foreground italic">"{review.comment}"</p>
                             <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{review.patientName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{review.patientName}</p>
                                    <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
            </Carousel>
         </div>
       )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consultation Requests</CardTitle>
          <CardDescription>Patients requesting consultations. Approve or reject requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-testid="consultation-requests-table">
              {isLoadingConsultationRequests && renderSkeleton()}
              {!isLoadingConsultationRequests && (!consultationRequests || consultationRequests.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No consultation requests at the moment.
                  </TableCell>
                </TableRow>
              )}
              {consultationRequests?.map((req: any) => {
                const patient = patients ? patients.find((p: any) => p.id === req.patientId) : null;
                const patientName = patient ? `${patient.firstName} ${patient.lastName}` : (req.patientName || 'Unknown');
                const appointmentDate = new Date(req.dateTime || req.date || Date.now());
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{patientName}</div>
                      <div className="text-sm text-muted-foreground">{patient ? patient.email : req.patientEmail}</div>
                    </TableCell>
                    <TableCell>{req.serviceType || req.service || req.serviceName}</TableCell>
                    <TableCell>{format(appointmentDate, 'PPpp')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button data-testid={`consultation-approve-${req.id}`} size="sm" onClick={() => handleApproveRequest(req)}>Approve</Button>
                      <Button data-testid={`consultation-reject-${req.id}`} size="sm" variant="outline" onClick={() => handleRejectRequest(req)}>Reject</Button>
                      <Button data-testid={`consultation-view-${req.id}`} size="sm" variant="ghost" asChild>
                        <Link href={`/doctor/patient/${req.patientId}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              {isLoading && renderSkeleton()}
              {!isLoading && enrichedAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No appointments yet. Manage patient appointments from here when they book.
                  </TableCell>
                </TableRow>
              )}
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
