'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useDoc,
} from '@/firebase/hooks';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Eye, 
  MessageSquare, 
  Phone, 
  Video, 
  ClipboardPlus,
  Calendar,
  Users,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PatientRef {
  id: string;
  patientId: string;
  addedAt?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisit?: string;
  appointmentCount?: number;
  createdAt?: string;
}

export default function DoctorPatientsPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [isLoadingPatientDetails, setIsLoadingPatientDetails] = useState(true);

  // Fetch doctor's authorized patients (patients the doctor has approved)
  const authorizedPatientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'doctors', user.uid, 'authorizedPatients'),
      orderBy('addedAt', 'desc')
    );
  }, [firestore, user]);

  const { data: authorizedPatients, isLoading: isLoadingAuthorized } = useCollection<PatientRef>(authorizedPatientsQuery);

  // Fetch individual patient details for each authorized patient
  useEffect(() => {
    async function fetchPatientDetails() {
      if (!firestore || !authorizedPatients || authorizedPatients.length === 0) {
        setPatientsData([]);
        setIsLoadingPatientDetails(false);
        return;
      }

      setIsLoadingPatientDetails(true);
      try {
        const patientPromises = authorizedPatients.map(async (patientRef) => {
          // The patientId field is set when the doctor approves an appointment
          // The document ID in authorizedPatients collection is also the patient's ID
          const patientId = patientRef.patientId || patientRef.id;
          const patientDoc = await getDoc(doc(firestore, 'patients', patientId));
          if (patientDoc.exists()) {
            return { id: patientDoc.id, ...patientDoc.data() } as Patient;
          }
          return null;
        });

        const results = await Promise.all(patientPromises);
        const validPatients = results.filter((p): p is Patient => p !== null);
        setPatientsData(validPatients);
      } catch (error) {
        console.error(`Error fetching patient details for doctor ${user?.uid}:`, error);
      } finally {
        setIsLoadingPatientDetails(false);
      }
    }

    fetchPatientDetails();
  }, [firestore, authorizedPatients, user]);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientsData.length) return [];
    if (!searchQuery.trim()) return patientsData;
    
    const query = searchQuery.toLowerCase();
    return patientsData.filter((patient: Patient) => 
      patient.firstName?.toLowerCase().includes(query) ||
      patient.lastName?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query)
    );
  }, [patientsData, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!patientsData.length) return { total: 0, recent: 0, activeThisMonth: 0 };
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      total: patientsData.length,
      recent: patientsData.filter((p: Patient) => 
        p.createdAt && new Date(p.createdAt) > thirtyDaysAgo
      ).length,
      activeThisMonth: patientsData.filter((p: Patient) => 
        p.lastVisit && new Date(p.lastVisit) > thirtyDaysAgo
      ).length,
    };
  }, [patientsData]);

  const getAge = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} y/o`;
  };

  const isLoading = isUserLoading || isLoadingAuthorized || isLoadingPatientDetails;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">My Patients</h1>
        <p className="text-muted-foreground">
          View and manage patients you have approved for consultation.
        </p>
      </div>

      {/* Info Alert */}
      {!isLoading && patientsData.length === 0 && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Patients will appear here after you approve their consultation requests from the Dashboard.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <ClipboardPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Patient List</CardTitle>
              <CardDescription>
                Patients you have approved for consultation
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead className="text-right">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery 
                      ? 'No patients found matching your search.' 
                      : 'No patients yet. Approve consultation requests from your Dashboard to see patients here.'}
                  </TableCell>
                </TableRow>
              )}
              {filteredPatients.map((patient: Patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getAge(patient.dateOfBirth)}</TableCell>
                  <TableCell>
                    {patient.phone || <span className="text-muted-foreground">No phone</span>}
                  </TableCell>
                  <TableCell>
                    {patient.lastVisit ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(patient.lastVisit), { addSuffix: true })}
                      </span>
                    ) : (
                      <Badge variant="outline">New</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{patient.appointmentCount || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild title="View Record">
                        <Link href={`/doctor/patient/${patient.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild title="Send Message">
                        <Link href={`/doctor/chat/${patient.id}`}>
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </Button>
                      {patient.phone && (
                        <Button variant="ghost" size="sm" asChild title="Call Patient">
                          <a href={`tel:${patient.phone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild title="New Consultation">
                        <Link href={`/doctor/patient/${patient.id}?action=consult`}>
                          <ClipboardPlus className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
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
