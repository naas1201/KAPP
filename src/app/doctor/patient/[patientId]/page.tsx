
'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  useDoc,
  useUser,
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import {
  doc,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
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
  MessageSquare,
  Flag,
  Briefcase,
  BookUser,
  NotebookTabs,
  Heart,
  FileText
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
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
  } from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const initialConsultationFormState = {
  historyOfPresentIllness: '',
  pastMedicalHistory: '',
  familyHistory: '',
  personalAndSocialHistory: '',
  skinCareRoutine: '',
  diagnosis: '',
  treatmentPlan: '',
};

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const { user: doctor, isLoading: isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isTreatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<any>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const [consultationForm, setConsultationForm] = useState(initialConsultationFormState);


  const [prescriptionDetails, setPrescriptionDetails] = useState({
    drugName: '',
    dosage: '',
    frequency: '',
    notes: '',
  });

  const patientRef = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return doc(firestore, 'patients', patientId as string);
  }, [firestore, patientId]);

  const { data: patient, isLoading: isLoadingPatient } = useDoc(patientRef);

  const treatmentsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return query(
      collection(firestore, 'patients', patientId as string, 'treatmentRecords'),
      orderBy('date', 'desc')
    );
  }, [firestore, patientId]);
  const { data: treatments, isLoading: isLoadingTreatments } =
    useCollection(treatmentsQuery);

  const prescriptionsQuery = useMemoFirebase(() => {
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
  
  const openConsultationModal = () => {
    setConsultationForm({
        ...initialConsultationFormState,
        pastMedicalHistory: patient?.medicalHistory || '',
        personalAndSocialHistory: `Occupation: ${patient?.occupation || 'N/A'}`,
    });
    setTreatmentModalOpen(true);
  }

  const handleAddTreatment = () => {
    if (
      !firestore ||
      !doctor ||
      !patientId
    ) return;

    const treatmentRef = collection(
      firestore,
      'patients',
      patientId as string,
      'treatmentRecords'
    );
    try {
      addDocumentNonBlocking(treatmentRef, {
        patientId,
        doctorId: doctor.uid,
        date: new Date().toISOString(),
        ...consultationForm
      });
      setTreatmentModalOpen(false);
      setConsultationForm(initialConsultationFormState);
      toast({ title: "Consultation record saved." });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error saving consultation record",
        description: "Failed to save the consultation record. Please try again."
      });
    }
  };

  const handleSavePrescription = () => {
    if (!firestore || !doctor || !patientId) return;

    const prescriptionData = {
        ...prescriptionDetails,
        patientId,
        doctorId: doctor.uid,
    };

    try {
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
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error saving prescription",
        description: "Failed to save the prescription. Please try again."
      });
    }
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
    const { id, ...restOfPrescription } = prescription;
    addDocumentNonBlocking(prescriptionRef, {
        ...restOfPrescription,
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
      const newRoom = await addDocumentNonBlocking(roomRef, {
        doctorId: doctor.uid,
        patientId: patientId,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      if (newRoom) {
        router.push(`/video-call/${newRoom.id}?role=caller&peerId=${patientId}`);
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

  const handleReportPatient = () => {
    if (!firestore || !doctor || !patientId || !reportReason) return;
    const reportRef = collection(firestore, 'reports');
    addDocumentNonBlocking(reportRef, {
        reporterId: doctor.uid,
        reportedId: patientId,
        reason: reportReason,
        createdAt: new Date().toISOString(),
    });
    setReportModalOpen(false);
    setReportReason('');
    toast({ title: "Patient Reported", description: "Your report has been submitted to the admin for review." });
  };

  if (isLoadingPatient || isUserLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!patient) {
    notFound();
  }
  
  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
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
                  {format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')} ({getAge(patient.dateOfBirth)} years old)
                </span>
              </div>
               <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <span>{patient.occupation || 'Not specified'}</span>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={handleStartVideoCall}>
                <Video className="w-4 h-4 mr-2" /> Start Video Call
              </Button>
               <Button variant="outline" asChild>
                <Link href={`/doctor/chat/${patientId}`}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Send Message
                </Link>
              </Button>
              {patient?.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${patient.phone}`}>
                    <Phone className="w-4 h-4 mr-2" /> Call Patient
                  </a>
                </Button>
              )}
               <Button variant="ghost" className="text-muted-foreground" onClick={() => setReportModalOpen(true)}>
                <Flag className="w-4 h-4 mr-2" /> Report Patient
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="p-4 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Chat sessions are automatically closed 24 hours after the last message. 
                All chat data is deleted permanently after closing for patient privacy.
              </p>
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
                <HeartPulse className="w-5 h-5" /> Initial Medical History
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
                                <DropdownMenuSeparator />
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
                <CardTitle>Consultation History</CardTitle>
                <Button onClick={openConsultationModal}>
                  <ClipboardPlus className="w-4 h-4 mr-2" /> New Consultation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-8 pl-6">
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
                       <div className="absolute -left-6 top-0 h-full w-px bg-border -translate-x-1/2" />
                      <div className="flex-shrink-0 z-10 -ml-2">
                        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-background">
                          <FileText className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">Consultation Record</p>
                          <time className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </time>
                        </div>
                        <div className="mt-2 text-sm space-y-2 text-muted-foreground">
                            <p><strong>Diagnosis:</strong> {item.diagnosis}</p>
                            <p><strong>Treatment Plan:</strong> {item.treatmentPlan}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No consultation history recorded.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Treatment Note Dialog */}
      <Dialog open={isTreatmentModalOpen} onOpenChange={setTreatmentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Consultation Record</DialogTitle>
            <DialogDescription>
              Create a new medical record for this consultation with {patientName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-6">
            
            <div>
              <Label htmlFor="historyOfPresentIllness">History of Present Illness</Label>
              <Textarea id="historyOfPresentIllness" value={consultationForm.historyOfPresentIllness} onChange={(e) => setConsultationForm({...consultationForm, historyOfPresentIllness: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="pastMedicalHistory">Past Medical History</Label>
              <Textarea id="pastMedicalHistory" value={consultationForm.pastMedicalHistory} onChange={(e) => setConsultationForm({...consultationForm, pastMedicalHistory: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="familyHistory">Family History</Label>
              <Textarea id="familyHistory" value={consultationForm.familyHistory} onChange={(e) => setConsultationForm({...consultationForm, familyHistory: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="personalAndSocialHistory">Personal and Social History</Label>
              <Textarea id="personalAndSocialHistory" value={consultationForm.personalAndSocialHistory} onChange={(e) => setConsultationForm({...consultationForm, personalAndSocialHistory: e.target.value})} />
            </div>
             <div>
              <Label htmlFor="skinCareRoutine">Skin Care Routine</Label>
              <Textarea id="skinCareRoutine" value={consultationForm.skinCareRoutine} onChange={(e) => setConsultationForm({...consultationForm, skinCareRoutine: e.target.value})} />
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="diagnosis" className="font-semibold text-base">Diagnosis</Label>
              <Textarea id="diagnosis" value={consultationForm.diagnosis} onChange={(e) => setConsultationForm({...consultationForm, diagnosis: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="treatmentPlan" className="font-semibold text-base">Treatment Plan</Label>
              <Textarea id="treatmentPlan" value={consultationForm.treatmentPlan} onChange={(e) => setConsultationForm({...consultationForm, treatmentPlan: e.target.value})} />
            </div>
            
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTreatment}>Save Record</Button>
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

        {/* Report Patient Dialog */}
      <Dialog open={isReportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Patient</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting {patientName}. This will be sent to the administrator for review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Enter reason for reporting..."
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleReportPatient} variant="destructive">Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
