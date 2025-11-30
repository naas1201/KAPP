'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Trash2, Edit, Mail, Phone, UserCheck, UserX, Eye } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  status?: 'active' | 'inactive' | 'pending';
  onboardingCompleted?: boolean;
  createdAt?: string;
  consultationCount?: number;
  patientCount?: number;
}

const specializations = [
  'General Medicine',
  'Dermatology',
  'Aesthetic Medicine',
  'Internal Medicine',
  'Pediatrics',
  'OB-GYN',
  'Cardiology',
  'Orthopedics',
];

export default function AdminDoctorsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [doctorDetails, setDoctorDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: 'General Medicine',
  });

  // Fetch doctors from Firestore
  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'doctors'), orderBy('lastName', 'asc'));
  }, [firestore]);
  
  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  // Fetch users collection to see doctor roles
  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users } = useCollection(usersRef);

  // Get doctor emails that have accounts
  const doctorEmails = useMemo(() => {
    if (!users) return new Set<string>();
    return new Set(
      users.filter((u: any) => u.role === 'doctor').map((u: any) => u.email)
    );
  }, [users]);

  const resetForm = () => {
    setDoctorDetails({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: 'General Medicine',
    });
    setEditingDoctor(null);
  };

  const handleOpenModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setDoctorDetails({
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone || '',
        specialization: doctor.specialization,
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSaveDoctor = () => {
    if (!firestore || !doctorDetails.email || !doctorDetails.firstName || !doctorDetails.lastName) {
      toast({
        variant: 'destructive',
        title: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      if (editingDoctor) {
        // Update existing doctor
        const doctorRef = doc(firestore, 'doctors', editingDoctor.id);
        updateDocumentNonBlocking(doctorRef, {
          ...doctorDetails,
          updatedAt: new Date().toISOString(),
        });
        toast({ title: 'Doctor updated successfully.' });
      } else {
        // Create new doctor - use a generated ID
        const doctorId = `doctor-${Date.now()}`;
        const doctorRef = doc(firestore, 'doctors', doctorId);
        setDocumentNonBlocking(doctorRef, {
          ...doctorDetails,
          status: 'pending',
          onboardingCompleted: false,
          consultationCount: 0,
          patientCount: 0,
          createdAt: new Date().toISOString(),
        }, {});

        // Also create a user role entry so they can log in as doctor
        const userRef = doc(firestore, 'users', doctorDetails.email);
        setDocumentNonBlocking(userRef, {
          email: doctorDetails.email,
          role: 'doctor',
          createdAt: new Date().toISOString(),
        }, {});

        toast({ 
          title: 'Doctor added successfully.', 
          description: `${doctorDetails.firstName} ${doctorDetails.lastName} can now sign up and access the doctor dashboard.` 
        });
      }
      
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving doctor',
        description: 'Please try again.',
      });
    }
  };

  const handleDelete = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !doctorToDelete) return;
    
    // Delete doctor document
    const doctorRef = doc(firestore, 'doctors', doctorToDelete.id);
    deleteDocumentNonBlocking(doctorRef);
    
    // Also remove their role from users collection
    if (doctorToDelete.email) {
      const userRef = doc(firestore, 'users', doctorToDelete.email);
      deleteDocumentNonBlocking(userRef);
    }
    
    toast({ title: 'Doctor removed.', variant: 'destructive' });
    setIsDeleteDialogOpen(false);
    setDoctorToDelete(null);
  };

  const handleToggleStatus = (doctor: Doctor) => {
    if (!firestore) return;
    const doctorRef = doc(firestore, 'doctors', doctor.id);
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    updateDocumentNonBlocking(doctorRef, { status: newStatus });
    toast({ 
      title: `Doctor ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      description: `Dr. ${doctor.firstName} ${doctor.lastName} is now ${newStatus}.`
    });
  };

  const getStatusBadge = (doctor: Doctor) => {
    const hasAccount = doctorEmails.has(doctor.email);
    
    if (!hasAccount) {
      return <Badge variant="outline" className="text-yellow-600">Pending Signup</Badge>;
    }
    
    if (doctor.status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (!doctor.onboardingCompleted) {
      return <Badge variant="outline" className="text-blue-600">Onboarding</Badge>;
    }
    
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">Doctor Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage clinic doctors. Full control over doctor accounts.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Doctor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {doctors?.filter((d: Doctor) => d.status === 'active' || d.onboardingCompleted).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {doctors?.filter((d: Doctor) => !d.onboardingCompleted).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
          <CardDescription>
            Manage all doctors in the clinic. Add new doctors, edit their information, or remove them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && (!doctors || doctors.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No doctors added yet. Click "Add Doctor" to get started.
                  </TableCell>
                </TableRow>
              )}
              {doctors?.map((doctor: Doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {doctor.email}
                      </div>
                      {doctor.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {doctor.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(doctor)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{doctor.consultationCount || 0} consultations</p>
                      <p className="text-muted-foreground">{doctor.patientCount || 0} patients</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(doctor)}
                        title={doctor.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {doctor.status === 'active' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(doctor)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doctor)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm(); setModalOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            <DialogDescription>
              {editingDoctor 
                ? 'Update doctor information.' 
                : 'Add a new doctor to the clinic. They will receive an invitation to create their account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={doctorDetails.firstName}
                  onChange={(e) => setDoctorDetails({ ...doctorDetails, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Dela Cruz"
                  value={doctorDetails.lastName}
                  onChange={(e) => setDoctorDetails({ ...doctorDetails, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@clinic.com"
                value={doctorDetails.email}
                onChange={(e) => setDoctorDetails({ ...doctorDetails, email: e.target.value })}
                disabled={!!editingDoctor} // Can't change email for existing doctors
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={doctorDetails.phone}
                onChange={(e) => setDoctorDetails({ ...doctorDetails, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization *</Label>
              <Select
                value={doctorDetails.specialization}
                onValueChange={(value) => setDoctorDetails({ ...doctorDetails, specialization: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setModalOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveDoctor}>
              {editingDoctor ? 'Save Changes' : 'Add Doctor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Doctor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove Dr. {doctorToDelete?.firstName} {doctorToDelete?.lastName}? 
              This will revoke their access to the system. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
