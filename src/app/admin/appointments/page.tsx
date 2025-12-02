'use client';

import { useState, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { format, isFuture, isPast, isToday } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  Stethoscope,
  Edit,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Send
} from 'lucide-react';

export default function AdminAppointmentsPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [changeNote, setChangeNote] = useState('');
  const [editForm, setEditForm] = useState({
    dateTime: '',
    status: '',
  });

  // Fetch all appointments using collectionGroup
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'appointments'),
      orderBy('dateTime', 'desc')
    );
  }, [firestore]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Fetch patients for lookup
  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  // Fetch doctors from Firestore for lookup
  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);

  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);

  // Create lookup map for patients
  const patientMap = useMemo(() => {
    if (!patients) return {};
    const map: Record<string, any> = {};
    patients.forEach((p: any) => {
      map[p.id] = p;
    });
    return map;
  }, [patients]);

  // Create lookup map for doctors
  const doctorMap = useMemo(() => {
    if (!doctors) return {};
    const map: Record<string, any> = {};
    doctors.forEach((d: any) => {
      map[d.id] = d;
    });
    return map;
  }, [doctors]);

  // Categorize appointments
  const { upcomingAppointments, todayAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) return { upcomingAppointments: [], todayAppointments: [], pastAppointments: [] };
    
    const upcoming: any[] = [];
    const today: any[] = [];
    const past: any[] = [];
    
    appointments.forEach((apt: any) => {
      const aptDate = new Date(apt.dateTime);
      const enrichedApt = {
        ...apt,
        patient: patientMap[apt.patientId] || null,
        doctor: doctorMap[apt.doctorId] || null,
      };
      
      if (isToday(aptDate)) {
        today.push(enrichedApt);
      } else if (isFuture(aptDate)) {
        upcoming.push(enrichedApt);
      } else {
        past.push(enrichedApt);
      }
    });
    
    // Sort upcoming by date ascending
    upcoming.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    today.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    
    return { upcomingAppointments: upcoming, todayAppointments: today, pastAppointments: past };
  }, [appointments, patientMap, doctorMap]);

  const handleOpenEdit = (appointment: any) => {
    setSelectedAppointment(appointment);
    setEditForm({
      dateTime: appointment.dateTime ? format(new Date(appointment.dateTime), "yyyy-MM-dd'T'HH:mm") : '',
      status: appointment.status || 'pending',
    });
    setChangeNote('');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!firestore || !selectedAppointment || !changeNote.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note Required',
        description: 'Please provide a note explaining the change.',
      });
      return;
    }

    try {
      // Update appointment in patient's subcollection
      const appointmentRef = doc(
        firestore,
        'patients',
        selectedAppointment.patientId,
        'appointments',
        selectedAppointment.id
      );

      await updateDocumentNonBlocking(appointmentRef, {
        dateTime: new Date(editForm.dateTime).toISOString(),
        status: editForm.status,
        lastModifiedBy: user?.email || 'admin',
        lastModifiedNote: changeNote,
        updatedAt: serverTimestamp(),
      });

      // Also add a notification/log for the doctor
      const notificationRef = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationRef, {
        type: 'appointment_modified',
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        message: `Appointment modified by admin: ${changeNote}`,
        createdAt: serverTimestamp(),
        read: false,
      });

      toast({
        title: 'Appointment Updated',
        description: 'The appointment has been updated and the doctor has been notified.',
      });

      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update appointment. Please try again.',
      });
    }
  };

  const handleOpenCancel = (appointment: any) => {
    setSelectedAppointment(appointment);
    setChangeNote('');
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!firestore || !selectedAppointment || !changeNote.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note Required',
        description: 'Please provide a reason for cancellation.',
      });
      return;
    }

    try {
      const appointmentRef = doc(
        firestore,
        'patients',
        selectedAppointment.patientId,
        'appointments',
        selectedAppointment.id
      );

      await updateDocumentNonBlocking(appointmentRef, {
        status: 'cancelled',
        cancelledBy: user?.email || 'admin',
        cancellationReason: changeNote,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Notify the doctor
      const notificationRef = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationRef, {
        type: 'appointment_cancelled',
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        message: `Appointment cancelled by admin: ${changeNote}`,
        createdAt: serverTimestamp(),
        read: false,
      });

      toast({
        title: 'Appointment Cancelled',
        description: 'The appointment has been cancelled and the doctor has been notified.',
      });

      setIsCancelDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel appointment. Please try again.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'completed':
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = isUserLoading || isLoadingAppointments || isLoadingPatients || isLoadingDoctors;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderAppointmentTable = (appointmentList: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointmentList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No appointments found.
            </TableCell>
          </TableRow>
        ) : (
          appointmentList.map((apt: any) => (
            <TableRow key={apt.id}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {apt.patient?.email || apt.patientEmail || ''}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </TableCell>
              <TableCell>{apt.serviceType}</TableCell>
              <TableCell>
                <div>
                  <p>{format(new Date(apt.dateTime), 'MMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(apt.dateTime), 'h:mm a')}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(apt.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(apt)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <Button variant="destructive" size="sm" onClick={() => handleOpenCancel(apt)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
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
          <h1 className="text-2xl font-bold font-headline">Appointment Management</h1>
          <p className="text-muted-foreground">View and manage all appointments across the clinic</p>
        </div>
      </div>

      {/* Today's Appointments Alert */}
      {todayAppointments.length > 0 && (
        <Card className="mb-6 border-primary bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{todayAppointments.length} appointment(s) today!</h3>
              <p className="text-sm text-muted-foreground">
                Make sure doctors are prepared for their consultations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="today">
            Today ({todayAppointments.length})
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
                All future scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAppointmentTable(upcomingAppointments)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Appointments</CardTitle>
              <CardDescription>
                Appointments scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAppointmentTable(todayAppointments)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>
                Past appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderAppointmentTable(pastAppointments)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Modify the appointment details. A notification will be sent to the doctor.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-semibold">
                  {selectedAppointment.patient 
                    ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` 
                    : 'Unknown Patient'}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAppointment.serviceType}</p>
              </div>
              <div>
                <Label htmlFor="editDateTime">Date & Time</Label>
                <Input
                  id="editDateTime"
                  type="datetime-local"
                  value={editForm.dateTime}
                  onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="changeNote">Note for Doctor (Required)</Label>
                <Textarea
                  id="changeNote"
                  placeholder="Explain the reason for this change..."
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This note will be sent to the doctor as a notification.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit}>
              <Send className="w-4 h-4 mr-2" />
              Save & Notify Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="font-semibold">
                  {selectedAppointment.patient 
                    ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}` 
                    : 'Unknown Patient'}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAppointment.serviceType}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedAppointment.dateTime), 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(new Date(selectedAppointment.dateTime), 'h:mm a')}
                </p>
              </div>
              <div>
                <Label htmlFor="cancelNote">Cancellation Reason (Required)</Label>
                <Textarea
                  id="cancelNote"
                  placeholder="Explain why this appointment is being cancelled..."
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep Appointment</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
