'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useCollection,
  useDoc,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, isPast, isFuture, isToday } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail, 
  AlertCircle,
  CheckCircle,
  Stethoscope,
  FileText,
  ChevronRight,
  Edit,
  Pill,
  Trophy,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FirstVisitCelebration, 
  BadgeDisplay, 
  LevelProgress 
} from '@/components/gamification/PatientGamification';
import { PATIENT_BADGES, calculatePatientLevel, type PatientBadge } from '@/lib/gamification';

export default function PatientDashboard() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPrepareAppointmentOpen, setIsPrepareAppointmentOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [profileForm, setProfileForm] = useState({
    phone: '',
    email: '',
  });
  const [showFirstVisitCelebration, setShowFirstVisitCelebration] = useState(false);

  // Fetch patient profile
  const patientRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'patients', user.uid);
  }, [firestore, user]);
  
  const { data: patient, isLoading: isLoadingPatient } = useDoc(patientRef);

  // Fetch patient appointments
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'patients', user.uid, 'appointments'),
      orderBy('dateTime', 'asc')
    );
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Fetch patient prescriptions
  const prescriptionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'patients', user.uid, 'prescriptions'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useCollection(prescriptionsQuery);

  // Fetch chat rooms
  const chatRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'open')
    );
  }, [firestore, user]);

  const { data: chatRooms, isLoading: isLoadingChatRooms } = useCollection(chatRoomsQuery);

  // Categorize appointments
  const { upcomingAppointments, pastAppointments, todayAppointments } = useMemo(() => {
    if (!appointments) return { upcomingAppointments: [], pastAppointments: [], todayAppointments: [] };
    
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];
    const today: any[] = [];
    
    appointments.forEach((apt: any) => {
      const aptDate = new Date(apt.dateTime);
      if (isToday(aptDate)) {
        today.push(apt);
      } else if (isFuture(aptDate)) {
        upcoming.push(apt);
      } else {
        past.push(apt);
      }
    });
    
    return { 
      upcomingAppointments: upcoming, 
      pastAppointments: past.reverse(), 
      todayAppointments: today 
    };
  }, [appointments]);

  // Calculate patient badges based on their activity
  const earnedBadges = useMemo(() => {
    const badges: PatientBadge[] = [];
    if (!patient) return badges;

    const totalAppointments = patient.appointmentCount || 0;

    // First visit badge
    if (totalAppointments >= 1) {
      badges.push(PATIENT_BADGES.find(b => b.id === 'first-visit')!);
    }

    // Health hero - 5 appointments
    if (totalAppointments >= 5) {
      badges.push(PATIENT_BADGES.find(b => b.id === 'health-hero-5')!);
    }

    // Wellness warrior - 10 appointments
    if (totalAppointments >= 10) {
      badges.push(PATIENT_BADGES.find(b => b.id === 'wellness-warrior-10')!);
    }

    // Profile complete badge
    if (patient.phone && patient.email && patient.dateOfBirth) {
      badges.push(PATIENT_BADGES.find(b => b.id === 'profile-complete')!);
    }

    // Check if any appointment has notes (prepared patient badge)
    const hasNotes = appointments?.some((a: any) => a.patientNotes);
    if (hasNotes) {
      badges.push(PATIENT_BADGES.find(b => b.id === 'prepared-patient')!);
    }

    return badges.filter(Boolean);
  }, [patient, appointments]);

  // Calculate XP and level
  const { patientXp, patientLevel } = useMemo(() => {
    const appointmentCount = patient?.appointmentCount || 0;
    const xp = appointmentCount * 20 + (earnedBadges.length * 10);
    const level = calculatePatientLevel(xp);
    return { patientXp: xp, patientLevel: level };
  }, [patient, earnedBadges]);

  // Check if first visit celebration should be shown
  useEffect(() => {
    if (patient && !patient.firstVisitCelebrated && user) {
      // This is the patient's first time - show celebration
      setShowFirstVisitCelebration(true);
      
      // Mark as celebrated
      if (firestore) {
        const patientDocRef = doc(firestore, 'patients', user.uid);
        setDocumentNonBlocking(patientDocRef, {
          firstVisitCelebrated: true,
        }, { merge: true });
      }
    }
  }, [patient, user, firestore]);

  const handleOpenPrepareAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setSymptoms(appointment.patientNotes || '');
    setIsPrepareAppointmentOpen(true);
  };

  const handleSaveSymptoms = () => {
    if (!firestore || !user || !selectedAppointment) return;
    
    const appointmentRef = doc(
      firestore, 
      'patients', 
      user.uid, 
      'appointments', 
      selectedAppointment.id
    );
    
    updateDocumentNonBlocking(appointmentRef, {
      patientNotes: symptoms,
      updatedAt: serverTimestamp(),
    });
    
    toast({
      title: 'Saved',
      description: 'Your symptoms have been saved. The doctor will review them before your appointment.',
    });
    
    setIsPrepareAppointmentOpen(false);
    setSelectedAppointment(null);
    setSymptoms('');
  };

  const handleOpenEditProfile = () => {
    if (patient) {
      setProfileForm({
        phone: patient.phone || '',
        email: patient.email || user?.email || '',
      });
    }
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = () => {
    if (!firestore || !user) return;
    
    const patientRef = doc(firestore, 'patients', user.uid);
    updateDocumentNonBlocking(patientRef, {
      phone: profileForm.phone,
      email: profileForm.email,
      updatedAt: serverTimestamp(),
    });
    
    toast({
      title: 'Profile Updated',
      description: 'Your contact information has been updated.',
    });
    
    setIsEditProfileOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = isUserLoading || isLoadingPatient || isLoadingAppointments;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* First Visit Celebration Dialog */}
      <FirstVisitCelebration 
        isOpen={showFirstVisitCelebration} 
        onClose={() => setShowFirstVisitCelebration(false)}
        patientName={patient?.firstName || user?.displayName || 'there'}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">
          Welcome back, {patient?.firstName || user?.displayName || 'Patient'}
        </h1>
        <p className="text-muted-foreground">
          Manage your appointments and health information
        </p>
      </div>

      {/* Gamification Progress Card */}
      <Card className="mb-6 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-200">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Your Health Journey</h3>
                <p className="text-sm text-muted-foreground">Level {patientLevel} • {patientXp} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{earnedBadges.length} Badges</span>
            </div>
          </div>
          {earnedBadges.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {earnedBadges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="flex items-center gap-1 px-2 py-1 bg-white/50 rounded-full text-sm"
                  title={badge.description}
                >
                  <span>{badge.icon}</span>
                  <span className="font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments Alert */}
      {todayAppointments.length > 0 && (
        <Card className="mb-6 border-primary bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">You have {todayAppointments.length} appointment(s) today!</h3>
              <p className="text-sm text-muted-foreground">
                {todayAppointments[0].serviceType} at {format(new Date(todayAppointments[0].dateTime), 'h:mm a')}
              </p>
            </div>
            <Button onClick={() => handleOpenPrepareAppointment(todayAppointments[0])}>
              Prepare
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                Make sure your info is correct to receive prescriptions and calls
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleOpenEditProfile}>
              <Edit className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient?.phone || 'Not set'}</p>
              </div>
              {!patient?.phone && (
                <AlertCircle className="w-4 h-4 text-destructive ml-auto" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patient?.email || user?.email || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </CardTitle>
            <CardDescription>
              Chat with your doctors when they enable messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingChatRooms ? (
              <Skeleton className="h-16" />
            ) : chatRooms && chatRooms.length > 0 ? (
              <div className="space-y-2">
                {chatRooms.slice(0, 3).map((room: any) => (
                  <Link 
                    key={room.id} 
                    href={`/patient/messages/${room.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Stethoscope className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Dr. Consultation</p>
                        <p className="text-xs text-muted-foreground">Active conversation</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active conversations</p>
                <p className="text-xs">Doctors can initiate chats during consultations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              <CardDescription>
                Prepare for your visits by adding symptoms and notes
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/booking">Book New</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming appointments</p>
                <Button asChild className="mt-4">
                  <Link href="/booking">Book an Appointment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((apt: any) => (
                  <div 
                    key={apt.id} 
                    className="flex flex-col p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Stethoscope className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{apt.serviceType}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.dateTime), 'EEEE, MMMM d, yyyy')} at {format(new Date(apt.dateTime), 'h:mm a')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(apt.dateTime), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(apt.status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenPrepareAppointment(apt)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {apt.patientNotes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                    </div>
                    {/* Show saved notes */}
                    {apt.patientNotes && (
                      <div className="mt-3 ml-16 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your Notes:</p>
                        <p className="text-sm">{apt.patientNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Prescriptions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Active Prescriptions
            </CardTitle>
            <CardDescription>
              Your current medications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPrescriptions ? (
              <Skeleton className="h-24" />
            ) : prescriptions && prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.slice(0, 3).map((rx: any) => {
                  const isExpired = rx.expiresAt && isPast(new Date(rx.expiresAt));
                  return (
                    <div key={rx.id} className={`p-3 rounded-lg border ${isExpired ? 'bg-muted/50 opacity-60' : 'bg-card'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{rx.drugName}</p>
                          <p className="text-sm text-muted-foreground">{rx.dosage} - {rx.frequency}</p>
                        </div>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                      </div>
                      {rx.expiresAt && !isExpired && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires {formatDistanceToNow(new Date(rx.expiresAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active prescriptions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment History Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent History</CardTitle>
            <CardDescription>
              Your past appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No past appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastAppointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{apt.serviceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.dateTime), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pastAppointments.length > 3 && (
              <Button asChild variant="link" size="sm" className="mt-2 w-full">
                <Link href="/patient/appointments">View All History</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Contact Information</DialogTitle>
            <DialogDescription>
              Make sure your phone number and email are correct to receive prescriptions and appointment reminders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prepare Appointment Dialog */}
      <Dialog open={isPrepareAppointmentOpen} onOpenChange={setIsPrepareAppointmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prepare for Your Appointment</DialogTitle>
            <DialogDescription>
              Help your doctor by describing your symptoms and concerns before your visit.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-semibold">{selectedAppointment.serviceType}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedAppointment.dateTime), 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(new Date(selectedAppointment.dateTime), 'h:mm a')}
                </p>
              </div>
              <div>
                <Label htmlFor="symptoms">Describe your symptoms or concerns</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Please describe what you're experiencing, how long you've had these symptoms, and any other relevant information..."
                  rows={6}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This information will be shared with your doctor before your appointment.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSymptoms}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
