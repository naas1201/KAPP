
'use client';
import { useMemo, useState } from 'react';
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
import { collection, query, where, doc, collectionGroup, serverTimestamp, orderBy, limit, increment } from 'firebase/firestore';
import { format, formatDistanceToNow, isAfter, isBefore, addHours } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Video, Users, Stethoscope, Hourglass, Star, Quote, Clock, CalendarCheck, ChevronRight, MessageSquare } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DoctorWelcomeAnimation } from '@/components/DoctorWelcomeAnimation';
import { DoctorSessionTracker } from '@/components/DoctorSessionTracker';
import { useStaffAuth } from '@/hooks/use-staff-auth';

export default function DoctorDashboard() {
  const { firestore } = useFirebase();
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const { session } = useStaffAuth();
  
  // State for approval dialog with notes
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [patientNote, setPatientNote] = useState('');
  const [adminNote, setAdminNote] = useState('');

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

  // Open approval dialog
  const openApprovalDialog = (apt: any) => {
    setSelectedRequest(apt);
    setPatientNote('');
    setAdminNote('');
    setApprovalDialogOpen(true);
  };

  // Open rejection dialog
  const openRejectionDialog = (apt: any) => {
    setSelectedRequest(apt);
    setPatientNote('');
    setAdminNote('');
    setRejectionDialogOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!firestore || !user || !selectedRequest) return;
    const apt = selectedRequest;
    try {
      // Prepare update data with optional notes
      const updateData: any = { 
        status: 'confirmed', 
        confirmedAt: serverTimestamp(),
        confirmedBy: user.uid,
      };
      
      if (patientNote.trim()) {
        updateData.doctorNoteToPatient = patientNote.trim();
      }
      if (adminNote.trim()) {
        updateData.doctorNoteToAdmin = adminNote.trim();
      }

      // mark appointment as confirmed in patient subcollection (if exists)
      const patientAppointmentRef = doc(firestore, 'patients', apt.patientId, 'appointments', apt.id);
      setDocumentNonBlocking(patientAppointmentRef, updateData, { merge: true });

      // also set a top-level appointment record for doctor's convenience
      const topLevelRef = doc(firestore, 'appointments', apt.id);
      setDocumentNonBlocking(topLevelRef, { ...apt, ...updateData }, { merge: true });

      // add patient to doctor's patient list
      const doctorPatientRef = doc(firestore, 'doctors', user.uid, 'patients', apt.patientId);
      setDocumentNonBlocking(doctorPatientRef, { patientId: apt.patientId, addedAt: serverTimestamp() }, { merge: true });
      
      // add patient to doctor's authorized patients for access control
      const authorizedPatientRef = doc(firestore, 'doctors', user.uid, 'authorizedPatients', apt.patientId);
      setDocumentNonBlocking(authorizedPatientRef, { patientId: apt.patientId, addedAt: serverTimestamp() }, { merge: true });

      // Update gamification data
      const doctorRef = doc(firestore, 'doctors', user.uid);
      updateDocumentNonBlocking(doctorRef, {
        'gamification.appointmentsApproved': increment(1),
        'gamification.lastActivityAt': serverTimestamp()
      });

      toast({ title: 'Appointment Approved', description: 'The patient has been notified.' });
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve appointment.' });
    }
  };

  const handleRejectRequest = async () => {
    if (!firestore || !user || !selectedRequest) return;
    const apt = selectedRequest;
    try {
      const updateData: any = { 
        status: 'rejected', 
        rejectedAt: serverTimestamp(),
        rejectedBy: user.uid,
      };
      
      if (patientNote.trim()) {
        updateData.doctorNoteToPatient = patientNote.trim();
      }
      if (adminNote.trim()) {
        updateData.doctorNoteToAdmin = adminNote.trim();
      }

      const patientAppointmentRef = doc(firestore, 'patients', apt.patientId, 'appointments', apt.id);
      setDocumentNonBlocking(patientAppointmentRef, updateData, { merge: true });
      const topLevelRef = doc(firestore, 'appointments', apt.id);
      setDocumentNonBlocking(topLevelRef, { ...apt, ...updateData }, { merge: true });

      toast({ title: 'Appointment Declined', description: 'The patient has been notified.' });
      setRejectionDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to decline appointment.' });
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
        patientPhone: patient?.phone || '',
        patientData: patient,
      };
    });
  }, [appointments, patients]);

  // Get the next upcoming appointment
  const nextUpAppointment = useMemo(() => {
    if (!enrichedAppointments.length) return null;
    const now = new Date();
    const upcoming = enrichedAppointments
      .filter((apt: any) => {
        const aptDate = new Date(apt.dateTime);
        return apt.status === 'confirmed' && isAfter(aptDate, now);
      })
      .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    return upcoming[0] || null;
  }, [enrichedAppointments]);

  // Get upcoming appointments for the day
  const todaysAppointments = useMemo(() => {
    if (!enrichedAppointments.length) return [];
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    return enrichedAppointments
      .filter((apt: any) => {
        const aptDate = new Date(apt.dateTime);
        return apt.status === 'confirmed' && isAfter(aptDate, now) && isBefore(aptDate, endOfDay);
      })
      .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [enrichedAppointments]);
  
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

  // Get doctor name for welcome animation
  const doctorDisplayName = session?.name?.split(' ')[0] || 'Doctor';

  return (
    <div className="p-4 sm:p-6">
      {/* Welcome Animation */}
      <DoctorWelcomeAnimation doctorName={doctorDisplayName} />
      
      {/* Header with Session Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold font-headline">
          Doctor Dashboard
        </h1>
        {user && (
          <DoctorSessionTracker 
            doctorId={user.uid} 
            doctorName={session?.name || user.displayName || undefined}
          />
        )}
      </div>

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

      {/* Next Up Section - Shows the next patient appointment */}
      {nextUpAppointment && (
        <Card className="mb-6 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Next Up</CardTitle>
            </div>
            <CardDescription>Your next scheduled appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg">
                    {nextUpAppointment.patientName.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{nextUpAppointment.patientName}</p>
                  <p className="text-sm text-muted-foreground">{nextUpAppointment.serviceType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {format(new Date(nextUpAppointment.dateTime), 'PPpp')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({formatDistanceToNow(new Date(nextUpAppointment.dateTime), { addSuffix: true })})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/doctor/chat/${nextUpAppointment.patientId}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/doctor/patient/${nextUpAppointment.patientId}`}>
                    View Patient
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Appointments */}
      {todaysAppointments.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <CardDescription>{todaysAppointments.length} appointments remaining today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysAppointments.slice(0, 5).map((apt: any, index: number) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{format(new Date(apt.dateTime), 'h:mm a')}</span>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/doctor/patient/${apt.patientId}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      {req.patientNotes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">"{req.patientNotes}"</div>
                      )}
                    </TableCell>
                    <TableCell>{req.serviceType || req.service || req.serviceName}</TableCell>
                    <TableCell>{format(appointmentDate, 'PPpp')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button data-testid={`consultation-approve-${req.id}`} size="sm" onClick={() => openApprovalDialog(req)}>Approve</Button>
                      <Button data-testid={`consultation-reject-${req.id}`} size="sm" variant="outline" onClick={() => openRejectionDialog(req)}>Reject</Button>
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

      {/* Approval Dialog with Notes */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Appointment Request</DialogTitle>
            <DialogDescription>
              Confirm this appointment and optionally add notes for the patient or admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patientNote">Note for Patient (Optional)</Label>
              <Textarea
                id="patientNote"
                placeholder="e.g., Please arrive 15 minutes early for paperwork..."
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be visible to the patient in their appointment confirmation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNote">Note for Admin (Optional)</Label>
              <Textarea
                id="adminNote"
                placeholder="e.g., Patient needs special assistance..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                This note is only visible to clinic administrators.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleApproveRequest}>Approve Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog with Notes */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Appointment Request</DialogTitle>
            <DialogDescription>
              Decline this appointment request and provide a reason for the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectPatientNote">Reason for Patient (Recommended)</Label>
              <Textarea
                id="rejectPatientNote"
                placeholder="e.g., Unfortunately, I'm not available on this date. Please reschedule..."
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Providing a reason helps patients understand and reschedule appropriately.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectAdminNote">Note for Admin (Optional)</Label>
              <Textarea
                id="rejectAdminNote"
                placeholder="e.g., Declined due to scheduling conflict..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRejectRequest}>Decline Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
