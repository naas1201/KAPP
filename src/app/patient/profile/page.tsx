'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  useDoc,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { 
  User, 
  Phone, 
  Save,
  AlertCircle,
  Camera,
  Sparkles,
  MapPin
} from 'lucide-react';

export default function PatientProfilePage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    occupation: '',
    avatarUrl: '',
    avatarEmoji: '😊',
  });

  // Avatar emoji options
  const emojiOptions = ['😊', '😎', '🌸', '💖', '✨', '🦋', '🌺', '💜', '🌟', '💕', '🎀', '👑'];

  // Fetch patient profile
  const patientRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'patients', user.uid);
  }, [firestore, user]);
  
  const { data: patient, isLoading: isLoadingPatient } = useDoc(patientRef);

  // Populate form when data loads
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        nickname: patient.nickname || '',
        email: patient.email || user?.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        address: patient.address || '',
        city: patient.city || '',
        province: patient.province || '',
        postalCode: patient.postalCode || '',
        occupation: patient.occupation || '',
        avatarUrl: patient.avatarUrl || '',
        avatarEmoji: patient.avatarEmoji || '😊',
      });
    } else if (user) {
      // Pre-populate with auth user data
      const displayNameParts = user.displayName?.split(' ') || [];
      setFormData({
        firstName: displayNameParts[0] || '',
        lastName: displayNameParts.slice(1).join(' ') || '',
        nickname: '',
        email: user.email || '',
        phone: '',
        dateOfBirth: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        occupation: '',
        avatarUrl: user.photoURL || '',
        avatarEmoji: '😊',
      });
    }
  }, [patient, user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Maximum file size for avatar upload (500KB)
  const MAX_AVATAR_SIZE_BYTES = 500 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please choose an image under 500KB',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firestore || !user) return;
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'First name and last name are required.',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const patientRef = doc(firestore, 'patients', user.uid);
      await setDocumentNonBlocking(patientRef, {
        ...formData,
        displayName: formData.nickname || `${formData.firstName} ${formData.lastName}`,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({
        title: '✅ Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isLoadingPatient;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !patient || !patient.firstName || !patient.phone;
  const displayName = formData.nickname || formData.firstName || 'there';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {/* Profile Completion Alert */}
      {isProfileIncomplete && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Complete Your Profile</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please complete your profile to help us provide better care. Make sure to add your phone number
                so we can contact you regarding appointments and prescriptions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avatar & Display Name Section */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-pink-500/10 to-rose-500/10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div
                className="relative cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Avatar className="w-24 h-24 ring-4 ring-white shadow-xl">
                  {formData.avatarUrl ? (
                    <AvatarImage src={formData.avatarUrl} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-pink-500 text-white">
                    {formData.avatarEmoji}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold font-headline">
                Hello, {displayName}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              
              {/* Emoji Picker */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Or choose an emoji avatar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110 ${
                        formData.avatarEmoji === emoji && !formData.avatarUrl
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-white hover:bg-primary/10'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, avatarEmoji: emoji, avatarUrl: '' }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nickname" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Nickname
              </Label>
              <Input
                id="nickname"
                placeholder="How should we call you?"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is how we&apos;ll greet you in the app
              </p>
            </div>
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="Your job title"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your legal name and basic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Dela Cruz"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contact Information
            </CardTitle>
            <CardDescription>
              How we can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                For appointment reminders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="House/Unit No., Street, Barangay"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="city">City/Municipality</Label>
                <Input
                  id="city"
                  placeholder="Manila"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  placeholder="Metro Manila"
                  value={formData.province}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="1000"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          size="lg"
          className="rounded-full px-8 shadow-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
