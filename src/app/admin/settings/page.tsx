'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase/hooks';
import { setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Bell, 
  Shield,
  Save
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch clinic settings
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'clinic');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    clinicName: settings?.clinicName || 'KAPP Medical Clinic',
    clinicEmail: settings?.clinicEmail || '',
    clinicPhone: settings?.clinicPhone || '',
    clinicAddress: settings?.clinicAddress || '',
    operatingHours: settings?.operatingHours || 'Mon-Fri: 9:00 AM - 6:00 PM\nSat: 9:00 AM - 12:00 PM',
    appointmentReminderEnabled: settings?.appointmentReminderEnabled ?? true,
    reminderHoursBefore: settings?.reminderHoursBefore || 24,
    allowGuestBooking: settings?.allowGuestBooking ?? false,
    requirePaymentUpfront: settings?.requirePaymentUpfront ?? false,
    gamificationEnabled: settings?.gamificationEnabled ?? true,
    doctorGamificationEnabled: settings?.doctorGamificationEnabled ?? true,
    patientGamificationEnabled: settings?.patientGamificationEnabled ?? true,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || 'KAPP Medical Clinic',
        clinicEmail: settings.clinicEmail || '',
        clinicPhone: settings.clinicPhone || '',
        clinicAddress: settings.clinicAddress || '',
        operatingHours: settings.operatingHours || 'Mon-Fri: 9:00 AM - 6:00 PM\nSat: 9:00 AM - 12:00 PM',
        appointmentReminderEnabled: settings.appointmentReminderEnabled ?? true,
        reminderHoursBefore: settings.reminderHoursBefore || 24,
        allowGuestBooking: settings.allowGuestBooking ?? false,
        requirePaymentUpfront: settings.requirePaymentUpfront ?? false,
        gamificationEnabled: settings.gamificationEnabled ?? true,
        doctorGamificationEnabled: settings.doctorGamificationEnabled ?? true,
        patientGamificationEnabled: settings.patientGamificationEnabled ?? true,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!firestore) return;
    
    setIsSaving(true);
    try {
      const settingsRef = doc(firestore, 'settings', 'clinic');
      setDocumentNonBlocking(settingsRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: 'Settings saved successfully.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">Clinic Settings</h1>
          <p className="text-muted-foreground">
            Configure clinic-wide settings and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Clinic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Clinic Information
            </CardTitle>
            <CardDescription>
              Basic information about your clinic that appears throughout the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinicEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clinicEmail"
                    type="email"
                    className="pl-9"
                    placeholder="clinic@example.com"
                    value={formData.clinicEmail}
                    onChange={(e) => setFormData({ ...formData, clinicEmail: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clinicPhone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clinicPhone"
                    type="tel"
                    className="pl-9"
                    placeholder="+63 XXX XXX XXXX"
                    value={formData.clinicPhone}
                    onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="clinicAddress">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clinicAddress"
                  className="pl-9"
                  placeholder="123 Medical Street, Manila, Philippines"
                  value={formData.clinicAddress}
                  onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="operatingHours">Operating Hours</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="operatingHours"
                  className="pl-9 min-h-[80px]"
                  placeholder="Mon-Fri: 9:00 AM - 6:00 PM"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Appointment Settings
            </CardTitle>
            <CardDescription>
              Configure how appointments work in your clinic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send email/SMS reminders before appointments
                </p>
              </div>
              <Switch
                checked={formData.appointmentReminderEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, appointmentReminderEnabled: checked })}
              />
            </div>
            {formData.appointmentReminderEnabled && (
              <div>
                <Label htmlFor="reminderHours">Reminder Hours Before</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min={1}
                  max={72}
                  className="w-32"
                  value={formData.reminderHoursBefore}
                  onChange={(e) => setFormData({ ...formData, reminderHoursBefore: parseInt(e.target.value) || 24 })}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Payment Upfront</Label>
                <p className="text-sm text-muted-foreground">
                  Patients must pay when booking (otherwise can pay later)
                </p>
              </div>
              <Switch
                checked={formData.requirePaymentUpfront}
                onCheckedChange={(checked) => setFormData({ ...formData, requirePaymentUpfront: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gamification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gamification Settings
            </CardTitle>
            <CardDescription>
              Enable or disable gamification features for patients and doctors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable All Gamification</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all gamification features
                </p>
              </div>
              <Switch
                checked={formData.gamificationEnabled}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  gamificationEnabled: checked,
                  doctorGamificationEnabled: checked,
                  patientGamificationEnabled: checked,
                })}
              />
            </div>
            {formData.gamificationEnabled && (
              <>
                <div className="flex items-center justify-between pl-4 border-l-2">
                  <div className="space-y-0.5">
                    <Label>Patient Gamification</Label>
                    <p className="text-sm text-muted-foreground">
                      Badges, streaks, and achievements for patients
                    </p>
                  </div>
                  <Switch
                    checked={formData.patientGamificationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, patientGamificationEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between pl-4 border-l-2">
                  <div className="space-y-0.5">
                    <Label>Doctor Gamification</Label>
                    <p className="text-sm text-muted-foreground">
                      XP, levels, and recognition for doctors
                    </p>
                  </div>
                  <Switch
                    checked={formData.doctorGamificationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, doctorGamificationEnabled: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
