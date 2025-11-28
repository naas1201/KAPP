
'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  useDoc,
  useUser,
  useCollection,
  useFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User as UserIcon,
  Cake,
  Mail,
  Phone,
  Home,
  HeartPulse,
  Sparkles,
  FilePlus,
  ClipboardPlus,
  Pill,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import { format, formatDistanceToNow, add } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const { user: doctor, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isTreatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<any>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);


  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [prescriptionDetails, setPrescriptionDetails] = useState({
    drugName: '',
    dosage: '',
    frequency: '',
    notes: '',
  });

  const patientRef = useMemo(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, 'patients', patientId as string);
  }, [firestore, patientId]);

  const { data: patient, isLoading: isLoadingPatient } = useDoc(patientRef);

  const treatmentsQuery = useMemo(() => {
    if (!firestore || !patientId) return null;
    return query(
      collection(firestore, 'patients', patientId as string, 'treatmentRecords'),
      orderBy('date', 'desc')
    );
  }, [firestore, patientId]);
  const { data: treatments, isLoading: isLoadingTreatments } =
    useCollection(treatmentsQuery);

  const prescriptionsQuery = useMemo(() => {
    if (!firestore || !patientId) return null;
    return query(
      collection(
        firestore,
        'patients',
        patientId as string,
        'prescriptions'
      ),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, patientId]);
  const { data: prescriptions, isLoading: isLoadingPrescriptions } =
    useCollection(prescriptionsQuery);
  
  const resetPrescriptionForm = () => {
    setEditingPrescription(null);
    setPrescriptionDetails({ drugName: '', dosage: '', frequency: '', notes: '' });
  };

  const handleAddTreatment = () => {
    if (
      !firestore ||
      !doctor ||
      !patientId ||
      !treatmentNotes ||
      !treatmentType
    )
      return;
    const treatmentRef = collection(
      firestore,
      'patients',
      patientId as string,
      'treatmentRecords'
    );
    addDocumentNonBlocking(treatmentRef, {
      patientId,
      doctorId: doctor.uid,
      date: new Date().toISOString(),
      details: treatmentNotes,
      treatmentType: treatmentType,
    });
    setTreatmentModalOpen(false);
    setTreatmentNotes('');
    setTreatmentType('');
    toast({ title: "Treatment note added." });
  };

  const handleSavePrescription = () => {
    if (!firestore || !doctor || !patientId) return;

    const prescriptionData = {
        ...prescriptionDetails,
        patientId,
        doctorId: doctor.uid,
    };

    if (editingPrescription) {
        const prescriptionRef = doc(firestore, 'patients', patientId as string, 'prescriptions', editingPrescription.id);
        updateDocumentNonBlocking(prescriptionRef, prescriptionData);
        toast({ title: "Prescription updated." });
    } else {
        const prescriptionRef = collection(firestore, 'patients', patientId as string, 'prescriptions');
        addDocumentNonBlocking(prescriptionRef, {
            ...prescriptionData,
            createdAt: new Date().toISOString(),
            expiresAt: add(new Date(), { days: 30 }).toISOString(), // Default 30-day expiry
        });
        toast({ title: "Prescription created." });
    }

    setPrescriptionModalOpen(false);
    resetPrescriptionForm();
  };
  
  const handleEditPrescription = (prescription: any) => {
    setEditingPrescription(prescription);
    setPrescriptionDetails({
      drugName: prescription.drugName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      notes: prescription.notes,
    });
    setPrescriptionModalOpen(true);
  };
  
  const handleRenewPrescription = (prescription: any) => {
    if (!firestore || !doctor || !patientId) return;
    const prescriptionRef = collection(firestore, 'patients', patientId as string, 'prescriptions');
    addDocumentNonBlocking(prescriptionRef, {
        ...prescription,
        // Omit id
        id: undefined,
        createdAt: new Date().toISOString(),
        expiresAt: add(new Date(), { days: 30 }).toISOString(),
    });
    toast({ title: `Prescription for ${prescription.drugName} renewed.` });
  };
  
  const handleDeleteItem = () => {
    if (!firestore || !patientId || !itemToDelete) return;
    const itemRef = doc(firestore, 'patients', patientId as string, itemToDelete.collection, itemToDelete.id);
    deleteDocumentNonBlocking(itemRef);
    toast({ title: `${itemToDelete.type} deleted.` });
    setDeleteAlertOpen(false);
    setItemToDelete(null);
  };

  const handleStartVideoCall = async () => {
    if (!firestore || !doctor || !patientId) return;

    try {
      const roomRef = collection(firestore, 'video-calls');
      // Use the non-blocking version and await its promise
      const newRoom = await addDocumentNonBlocking(roomRef, {
        doctorId: doctor.uid,
        patientId: patientId,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      if (newRoom) {
        router.push(`/video-call/${newRoom.id}`);
      } else {
        throw new Error('Failed to create room document.');
      }
    } catch (error) {
      console.error('Error creating video call room:', error);
      toast({
        variant: 'destructive',
        title: 'Could not start call',
        description: 'There was an issue setting up the video call room.',
      });
    }
  };

  if (isLoadingPatient || isUserLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!patient) {
    notFound();
  }

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          {/* Patient Profile Card */}
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarFallback className="text-3xl">
                  {patient.firstName.charAt(0)}
                  {patient.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{patientName}</CardTitle>
              <CardDescription>Patient ID: {patient.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Cake className="w-5 h-5 text-muted-foreground" />
                <span>
                  {format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <a href={`mailto:${patient.email}`} className="hover:underline">
                  {patient.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-muted-foreground mt-1" />
                <span>{patient.address}</span>
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-4 flex flex-col gap-2">
              <Button onClick={handleStartVideoCall}>
                <Video className="w-4 h-4 mr-2" /> Start Video Call
              </Button>
               <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Goals and History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Aesthetic Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {patient.aestheticGoals}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HeartPulse className="w-5 h-5" /> Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {patient.medicalHistory}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5" /> Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPrescriptions ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                prescriptions?.map((rx: any) => (
                  <div key={rx.id} className="text-sm group relative">
                    <p className="font-semibold">{rx.drugName}</p>
                    <p className="text-muted-foreground">
                      {rx.dosage} - {rx.frequency}
                    </p>
                     {rx.expiresAt && (
                      <p className="text-xs text-muted-foreground/80">
                        Expires {formatDistanceToNow(new Date(rx.expiresAt), { addSuffix: true })}
                      </p>
                    )}
                     <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditPrescription(rx)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRenewPrescription(rx)}><Copy className="mr-2 h-4 w-4"/>Renew</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setItemToDelete({ id: rx.id, collection: 'prescriptions', type: 'Prescription' }); setDeleteAlertOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>
                ))
              )}
               <Button
                className="w-full"
                variant="outline"
                onClick={() => { resetPrescriptionForm(); setPrescriptionModalOpen(true); }}
              >
                <FilePlus className="w-4 h-4 mr-2" /> Add Prescription
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Patient Timeline</CardTitle>
                <Button onClick={() => setTreatmentModalOpen(true)}>
                  <ClipboardPlus className="w-4 h-4 mr-2" /> Add Treatment Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-8">
                {isLoadingTreatments ? (
                   Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : treatments?.length ? (
                  treatments.map((item: any, index) => (
                    <div key={item.id} className="relative flex gap-4 timeline-item">
                       <div className="timeline-line"/>
                      <div className="flex-shrink-0 z-10">
                        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <HeartPulse className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{item.treatmentType}</p>
                          <time className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.details}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No treatment history recorded.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Treatment Note Dialog */}
      <Dialog open={isTreatmentModalOpen} onOpenChange={setTreatmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Treatment Note</DialogTitle>
            <DialogDescription>
              Record the details of the treatment provided to {patientName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
             <Input 
                placeholder="Treatment Type (e.g., Consultation, Botox)"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
            />
            <Textarea
              placeholder="Enter treatment details here..."
              rows={6}
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTreatment}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Add/Edit Prescription Dialog */}
      <Dialog open={isPrescriptionModalOpen} onOpenChange={(isOpen) => { if (!isOpen) resetPrescriptionForm(); setPrescriptionModalOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPrescription ? 'Edit' : 'Create'} Prescription</DialogTitle>
            <DialogDescription>
              {editingPrescription ? 'Update the' : 'Create a new'} prescription for {patientName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input 
                placeholder="Drug Name"
                value={prescriptionDetails.drugName}
                onChange={(e) => setPrescriptionDetails({...prescriptionDetails, drugName: e.target.value})}
            />
             <Input 
                placeholder="Dosage (e.g., 500mg)"
                value={prescriptionDetails.dosage}
                onChange={(e) => setPrescriptionDetails({...prescriptionDetails, dosage: e.target.value})}
            />
             <Input 
                placeholder="Frequency (e.g., Once a day)"
                value={prescriptionDetails.frequency}
                onChange={(e) => setPrescriptionDetails({...prescriptionDetails, frequency: e.target.value})}
            />
            <Textarea
              placeholder="Additional notes (optional)..."
              rows={4}
              value={prescriptionDetails.notes}
              onChange={(e) => setPrescriptionDetails({...prescriptionDetails, notes: e.target.value})}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSavePrescription}>Save Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    