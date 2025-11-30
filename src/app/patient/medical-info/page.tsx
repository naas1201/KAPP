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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useDoc,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { 
  HeartPulse, 
  Pill, 
  AlertTriangle,
  Save,
  Info
} from 'lucide-react';

export default function PatientMedicalInfoPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    allergies: '',
    currentMedications: '',
    pastSurgeries: '',
    chronicConditions: '',
    familyHistory: '',
    lifestyle: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Fetch existing medical info
  const medicalInfoRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'medicalInfo', user.uid);
  }, [firestore, user]);
  
  const { data: medicalInfo, isLoading: isLoadingMedicalInfo } = useDoc(medicalInfoRef);

  // Populate form when data loads
  useEffect(() => {
    if (medicalInfo) {
      setFormData({
        allergies: medicalInfo.allergies || '',
        currentMedications: medicalInfo.currentMedications || '',
        pastSurgeries: medicalInfo.pastSurgeries || '',
        chronicConditions: medicalInfo.chronicConditions || '',
        familyHistory: medicalInfo.familyHistory || '',
        lifestyle: medicalInfo.lifestyle || '',
        emergencyContact: medicalInfo.emergencyContact || '',
        emergencyPhone: medicalInfo.emergencyPhone || '',
      });
    }
  }, [medicalInfo]);

  const handleSave = async () => {
    if (!firestore || !user) return;
    
    setIsSaving(true);
    try {
      const medicalInfoRef = doc(firestore, 'medicalInfo', user.uid);
      await setDocumentNonBlocking(medicalInfoRef, {
        ...formData,
        patientId: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({
        title: 'Medical Information Saved',
        description: 'Your medical information has been updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save medical information. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isLoadingMedicalInfo;

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

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Medical Information</h1>
        <p className="text-muted-foreground">
          Keep your medical information up to date for better care
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Privacy Notice</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your medical information is kept confidential and is only shared with your assigned doctors.
              This information helps them provide better care during your consultations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allergies & Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Allergies & Medications
            </CardTitle>
            <CardDescription>
              Important for prescribing safe medications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="List any allergies to medications, food, or other substances..."
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                placeholder="List any medications you are currently taking, including dosage..."
                value={formData.currentMedications}
                onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-500" />
              Medical History
            </CardTitle>
            <CardDescription>
              Helps doctors understand your health background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chronicConditions">Chronic Conditions</Label>
              <Textarea
                id="chronicConditions"
                placeholder="Diabetes, hypertension, asthma, etc..."
                value={formData.chronicConditions}
                onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="pastSurgeries">Past Surgeries</Label>
              <Textarea
                id="pastSurgeries"
                placeholder="List any previous surgeries with approximate dates..."
                value={formData.pastSurgeries}
                onChange={(e) => setFormData({ ...formData, pastSurgeries: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Family & Lifestyle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-500" />
              Family History & Lifestyle
            </CardTitle>
            <CardDescription>
              Helps identify potential health risks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="familyHistory">Family Medical History</Label>
              <Textarea
                id="familyHistory"
                placeholder="Any notable medical conditions in your family (parents, siblings)..."
                value={formData.familyHistory}
                onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="lifestyle">Lifestyle Information</Label>
              <Textarea
                id="lifestyle"
                placeholder="Exercise habits, diet, smoking/alcohol use, occupation, etc..."
                value={formData.lifestyle}
                onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>
              Person to contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyContact">Contact Name & Relationship</Label>
              <Input
                id="emergencyContact"
                placeholder="e.g., Juan Dela Cruz (Spouse)"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Contact Phone Number</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Medical Information'}
        </Button>
      </div>
    </div>
  );
}
