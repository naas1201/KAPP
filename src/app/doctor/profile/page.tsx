'use client';

import { useState, useEffect } from 'react';
import {
  useFirebase,
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  Calendar,
  Shield,
  Save,
  CheckCircle,
  Star,
  Award
} from 'lucide-react';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { DOCTOR_LEVELS, calculateDoctorLevel } from '@/lib/gamification';

// Patient workflow statuses
const PATIENT_STATUSES = [
  { value: 'new', label: 'New Patient', color: 'bg-blue-500' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-500' },
  { value: 'waiting_consultation', label: 'Waiting for Consultation', color: 'bg-yellow-500' },
  { value: 'in_consultation', label: 'In Consultation', color: 'bg-purple-500' },
  { value: 'treated', label: 'Patient Treated', color: 'bg-green-600' },
  { value: 'follow_up', label: 'Needs Follow-up', color: 'bg-orange-500' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
];

interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  bio?: string;
  address?: string;
  defaultPatientStatus?: string;
  profileUpdatedAt?: string;
  gamification?: {
    xp: number;
    totalConsultations: number;
    totalPatients: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt?: string;
  };
}

export default function DoctorProfilePage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { session } = useStaffAuth();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    bio: '',
    address: '',
    defaultPatientStatus: 'new',
  });

  const doctorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'doctors', user.uid);
  }, [firestore, user]);

  const { data: doctorData, isLoading: isLoadingDoctor } = useDoc<DoctorProfile>(doctorRef);

  // Initialize form data from doctor profile
  useEffect(() => {
    if (doctorData) {
      setFormData({
        firstName: doctorData.firstName || '',
        lastName: doctorData.lastName || '',
        displayName: doctorData.displayName || '',
        email: doctorData.email || user?.email || '',
        phone: doctorData.phone || '',
        specialization: doctorData.specialization || '',
        licenseNumber: doctorData.licenseNumber || '',
        bio: doctorData.bio || '',
        address: doctorData.address || '',
        defaultPatientStatus: doctorData.defaultPatientStatus || 'new',
      });
    } else if (user) {
      // Pre-fill with available user data
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
        displayName: user.displayName || '',
      }));
    }
  }, [doctorData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveProfile = async () => {
    if (!firestore || !user) return;
    setIsSaving(true);

    try {
      const profileData = {
        ...formData,
        profileUpdatedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(doctorRef!, profileData, { merge: true });

      // Update gamification data for profile completion
      updateDocumentNonBlocking(doctorRef!, {
        'gamification.profileComplete': true,
        'gamification.lastActivityAt': serverTimestamp(),
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate level info
  const gamificationData = doctorData?.gamification;
  const levelInfo = gamificationData ? calculateDoctorLevel(gamificationData.xp || 0) : null;

  if (isUserLoading || isLoadingDoctor) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and preferences.
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {formData.firstName?.charAt(0) || 'D'}
                    {formData.lastName?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">
                  Dr. {formData.firstName} {formData.lastName}
                </h2>
                {formData.specialization && (
                  <Badge variant="secondary" className="mt-2">
                    {formData.specialization}
                  </Badge>
                )}
                {formData.licenseNumber && (
                  <p className="text-xs text-muted-foreground mt-2">
                    License: {formData.licenseNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gamification Stats */}
          {levelInfo && (
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`inline-block px-4 py-2 rounded-full text-white ${levelInfo.color}`}>
                    Level {levelInfo.level}
                  </div>
                  <p className="font-semibold mt-2">{levelInfo.title}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>XP Progress</span>
                    <span>{gamificationData?.xp || 0} / {levelInfo.nextLevelXp}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gamificationData?.totalConsultations || 0}</p>
                    <p className="text-xs text-muted-foreground">Consultations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{gamificationData?.totalPatients || 0}</p>
                    <p className="text-xs text-muted-foreground">Patients</p>
                  </div>
                </div>
                {gamificationData?.currentStreak && gamificationData.currentStreak > 0 && (
                  <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                    <span className="text-lg">🔥</span>
                    <p className="font-semibold">{gamificationData.currentStreak} Day Streak!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="workflow">Workflow Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name / Pseudonym</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="How you'd like to be called"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed to patients instead of your full name.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Your clinic or office address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Your credentials and professional details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) => handleInputChange('specialization', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                        <SelectItem value="Aesthetic Medicine">Aesthetic Medicine</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                        <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">PRC License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="Your PRC license number"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Professional Regulation Commission (PRC) license number.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell patients about yourself, your experience, and expertise..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed on your public profile and helps patients know you better.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Settings</CardTitle>
                  <CardDescription>
                    Configure how you manage patient workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultStatus">Default Status for New Patients</Label>
                    <Select
                      value={formData.defaultPatientStatus}
                      onValueChange={(value) => handleInputChange('defaultPatientStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PATIENT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${status.color}`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      New patients will be assigned this status when they're added to your list.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Patient Workflow Status Guide</h4>
                    <div className="grid gap-3">
                      {PATIENT_STATUSES.map((status) => (
                        <div key={status.value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-4 h-4 rounded-full ${status.color}`} />
                          <div>
                            <p className="font-medium text-sm">{status.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {status.value === 'new' && 'Patient has just registered or been referred.'}
                              {status.value === 'accepted' && 'You have accepted this patient for care.'}
                              {status.value === 'waiting_consultation' && 'Patient is scheduled and waiting for consultation.'}
                              {status.value === 'in_consultation' && 'Currently in an active consultation.'}
                              {status.value === 'treated' && 'Patient has received treatment.'}
                              {status.value === 'follow_up' && 'Patient requires a follow-up appointment.'}
                              {status.value === 'completed' && 'All treatments completed, no further action needed.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
