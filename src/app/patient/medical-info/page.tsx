'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
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
  Info,
  User,
  Activity,
  Sparkles,
  Scale,
  Ruler,
  Baby,
  Cigarette,
  Wine,
  Dumbbell,
  Sun,
  Heart,
  Brain,
  Eye,
  Ear,
  Phone,
  Shield,
  CheckCircle
} from 'lucide-react';

// Helper to calculate BMI
function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

// Initial form data structure with 100+ fields
const initialFormData = {
  // Basic Health Metrics
  sex: '',
  bloodType: '',
  heightCm: '',
  weightKg: '',
  waistCm: '',
  hipCm: '',
  
  // Pregnancy (shown only for females)
  isPregnant: false,
  pregnancyWeeks: '',
  pregnancyDueDate: '',
  previousPregnancies: '',
  
  // Lifestyle - Smoking
  smokingStatus: 'never', // never, former, current
  smokingFrequency: '', // cigarettes per day
  smokingYears: '',
  quitSmokingDate: '',
  
  // Lifestyle - Alcohol
  alcoholStatus: 'never', // never, occasional, regular
  alcoholFrequency: '', // drinks per week
  alcoholType: '',
  
  // Lifestyle - Exercise
  exerciseFrequency: '', // times per month
  exerciseType: '',
  exerciseDuration: '', // minutes per session
  physicalActivityLevel: 'sedentary', // sedentary, light, moderate, active, very_active
  
  // Lifestyle - Diet
  dietType: 'regular', // regular, vegetarian, vegan, keto, etc.
  mealsPerDay: '',
  waterIntake: '', // glasses per day
  caffeineIntake: '', // cups per day
  
  // Lifestyle - Sleep
  sleepHours: '',
  sleepQuality: 'good', // poor, fair, good, excellent
  hasSleepDisorder: false,
  sleepDisorderDetails: '',
  
  // Skin & Aesthetics
  skinType: '', // oily, dry, combination, normal, sensitive
  skinConcerns: [] as string[],
  previousAestheticTreatments: '',
  
  // Aesthetic Goals
  interestedInBotox: false,
  interestedInFillers: false,
  interestedInFacials: false,
  interestedInLaserTreatment: false,
  interestedInChemicalPeel: false,
  interestedInMicroneedling: false,
  interestedInBodyContouring: false,
  interestedInHairTransplant: false,
  interestedInBreastAugmentation: false,
  interestedInLiposuction: false,
  interestedInRhinoplasty: false,
  interestedInFacelift: false,
  interestedInSkinLightening: false,
  interestedInAcneTreatment: false,
  interestedInAntiAging: false,
  interestedInWeightLoss: false,
  aestheticGoalsNotes: '',
  
  // Medical History
  allergies: '',
  drugAllergies: '',
  foodAllergies: '',
  currentMedications: '',
  supplements: '',
  pastSurgeries: '',
  hospitalizations: '',
  
  // Chronic Conditions
  hasDiabetes: false,
  diabetesType: '',
  hasHypertension: false,
  bloodPressureMedication: '',
  hasHeartDisease: false,
  heartConditionDetails: '',
  hasAsthma: false,
  hasThyroidDisorder: false,
  thyroidDetails: '',
  hasKidneyDisease: false,
  hasLiverDisease: false,
  hasCancer: false,
  cancerDetails: '',
  hasAutoimmune: false,
  autoimmuneDetails: '',
  hasMentalHealth: false,
  mentalHealthDetails: '',
  hasSeizures: false,
  
  // Women's Health
  lastMenstrualPeriod: '',
  menstrualCycleRegular: true,
  onBirthControl: false,
  birthControlType: '',
  menopauseStatus: 'pre', // pre, peri, post
  
  // Vision & Hearing
  wearsGlasses: false,
  wearsContacts: false,
  hasVisionProblems: false,
  visionProblemsDetails: '',
  hasHearingProblems: false,
  hearingProblemsDetails: '',
  
  // Dental
  lastDentalVisit: '',
  hasDentalProblems: false,
  dentalProblemsDetails: '',
  
  // Family History
  familyDiabetes: false,
  familyHeartDisease: false,
  familyCancer: false,
  familyCancerType: '',
  familyHypertension: false,
  familyStroke: false,
  familyMentalHealth: false,
  familyOther: '',
  
  // Immunizations
  covidVaccinated: false,
  covidVaccineType: '',
  fluVaccinatedThisYear: false,
  lastTetanusShot: '',
  hepatitisVaccinated: false,
  
  // Current Symptoms
  currentSymptoms: '',
  painLevel: 0, // 0-10
  painLocation: '',
  symptomsDuration: '',
  
  // Mental Health
  stressLevel: 'moderate', // low, moderate, high, very_high
  anxietyLevel: 'none', // none, mild, moderate, severe
  depressionLevel: 'none', // none, mild, moderate, severe
  
  // Emergency Contact
  emergencyContact: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  
  // Insurance
  hasHealthInsurance: false,
  insuranceProvider: '',
  insurancePolicyNumber: '',
  
  // Consent
  consentToTreatment: false,
  consentToShareRecords: false,
  
  // Additional Notes
  additionalNotes: '',
};

type FormDataType = typeof initialFormData;

export default function PatientMedicalInfoPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  
  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  // Fetch existing medical info
  const medicalInfoRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'medicalInfo', user.uid);
  }, [firestore, user]);
  
  const { data: medicalInfo, isLoading: isLoadingMedicalInfo } = useDoc(medicalInfoRef);

  // Populate form when data loads
  useEffect(() => {
    if (medicalInfo) {
      setFormData(prev => ({
        ...prev,
        ...medicalInfo,
        skinConcerns: medicalInfo.skinConcerns || [],
      }));
    }
  }, [medicalInfo]);

  // Calculate BMI
  const bmi = useMemo(() => {
    return calculateBMI(Number(formData.weightKg), Number(formData.heightCm));
  }, [formData.weightKg, formData.heightCm]);

  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);

  // Calculate completion percentage - only depends on required fields
  const completionPercentage = useMemo(() => {
    const requiredFields = [formData.sex, formData.bloodType, formData.heightCm, formData.weightKg, formData.emergencyContact, formData.emergencyPhone];
    const filled = requiredFields.filter(Boolean).length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [formData.sex, formData.bloodType, formData.heightCm, formData.weightKg, formData.emergencyContact, formData.emergencyPhone]);

  const updateField = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'skinConcerns', item: string) => {
    setFormData(prev => {
      const arr = prev[field] as string[];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleSave = async () => {
    if (!firestore || !user) return;
    
    setIsSaving(true);
    try {
      const ref = doc(firestore, 'medicalInfo', user.uid);
      await setDocumentNonBlocking(ref, {
        ...formData,
        bmi,
        patientId: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({
        title: '✅ Health Profile Saved',
        description: 'Your medical information has been updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isLoadingMedicalInfo;
  const isMale = formData.sex === 'male';

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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Health Profile
        </h1>
        <p className="text-muted-foreground">
          Complete your health information for personalized care
        </p>
      </div>

      {/* Completion Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          {completionPercentage < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              Complete required fields to help us provide better care
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Your Privacy is Protected</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All medical information is encrypted and only accessible by your assigned healthcare providers.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="basics" className="text-xs">Basic Info</TabsTrigger>
          <TabsTrigger value="lifestyle" className="text-xs">Lifestyle</TabsTrigger>
          <TabsTrigger value="aesthetics" className="text-xs">Aesthetics</TabsTrigger>
          <TabsTrigger value="medical" className="text-xs">Medical History</TabsTrigger>
          <TabsTrigger value="family" className="text-xs">Family History</TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs">Emergency</TabsTrigger>
        </TabsList>

        {/* BASICS TAB */}
        <TabsContent value="basics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Biological Sex *</Label>
                  <Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Blood Type *</Label>
                  <Select value={formData.bloodType} onValueChange={(v) => updateField('bloodType', v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Body Metrics & BMI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Body Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Height (cm) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 165"
                      value={formData.heightCm}
                      onChange={(e) => updateField('heightCm', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Weight (kg) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      value={formData.weightKg}
                      onChange={(e) => updateField('weightKg', e.target.value)}
                    />
                  </div>
                </div>
                
                {bmi > 0 && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your BMI</span>
                      <span className={`text-lg font-bold ${bmiCategory.color}`}>
                        {bmi} - {bmiCategory.label}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Waist (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={formData.waistCm}
                      onChange={(e) => updateField('waistCm', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hip (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={formData.hipCm}
                      onChange={(e) => updateField('hipCm', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pregnancy - Only show for females */}
            {formData.sex === 'female' && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-pink-500" />
                    Pregnancy Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pregnant"
                      checked={formData.isPregnant}
                      onCheckedChange={(checked) => updateField('isPregnant', checked)}
                    />
                    <Label htmlFor="pregnant">Currently pregnant</Label>
                  </div>
                  
                  {formData.isPregnant && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <Label>Weeks Pregnant</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 12"
                          value={formData.pregnancyWeeks}
                          onChange={(e) => updateField('pregnancyWeeks', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={formData.pregnancyDueDate}
                          onChange={(e) => updateField('pregnancyDueDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Previous Pregnancies</Label>
                    <Input
                      type="number"
                      placeholder="Number of previous pregnancies"
                      value={formData.previousPregnancies}
                      onChange={(e) => updateField('previousPregnancies', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* LIFESTYLE TAB */}
        <TabsContent value="lifestyle" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Smoking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cigarette className="w-5 h-5 text-orange-500" />
                  Smoking Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.smokingStatus}
                  onValueChange={(v) => updateField('smokingStatus', v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="smoke-never" />
                    <Label htmlFor="smoke-never">Never smoked</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="former" id="smoke-former" />
                    <Label htmlFor="smoke-former">Former smoker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="smoke-current" />
                    <Label htmlFor="smoke-current">Current smoker</Label>
                  </div>
                </RadioGroup>
                
                {formData.smokingStatus === 'current' && (
                  <div className="space-y-3 pl-6 pt-2">
                    <div>
                      <Label>Cigarettes per day</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={formData.smokingFrequency}
                        onChange={(e) => updateField('smokingFrequency', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Years smoking</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={formData.smokingYears}
                        onChange={(e) => updateField('smokingYears', e.target.value)}
                      />
                    </div>
                  </div>
                )}
                
                {formData.smokingStatus === 'former' && (
                  <div className="pl-6 pt-2">
                    <Label>Quit Date</Label>
                    <Input
                      type="date"
                      value={formData.quitSmokingDate}
                      onChange={(e) => updateField('quitSmokingDate', e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alcohol */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wine className="w-5 h-5 text-purple-500" />
                  Alcohol Consumption
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.alcoholStatus}
                  onValueChange={(v) => updateField('alcoholStatus', v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="alcohol-never" />
                    <Label htmlFor="alcohol-never">Never drink</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="occasional" id="alcohol-occasional" />
                    <Label htmlFor="alcohol-occasional">Occasional (social)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="alcohol-regular" />
                    <Label htmlFor="alcohol-regular">Regular drinker</Label>
                  </div>
                </RadioGroup>
                
                {(formData.alcoholStatus === 'occasional' || formData.alcoholStatus === 'regular') && (
                  <div className="space-y-3 pl-6 pt-2">
                    <div>
                      <Label>Drinks per week</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={formData.alcoholFrequency}
                        onChange={(e) => updateField('alcoholFrequency', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Type of drinks</Label>
                      <Input
                        placeholder="Beer, wine, spirits..."
                        value={formData.alcoholType}
                        onChange={(e) => updateField('alcoholType', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-green-500" />
                  Exercise & Physical Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Activity Level</Label>
                  <Select
                    value={formData.physicalActivityLevel}
                    onValueChange={(v) => updateField('physicalActivityLevel', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Light (1-2 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-4 days/week)</SelectItem>
                      <SelectItem value="active">Active (5-6 days/week)</SelectItem>
                      <SelectItem value="very_active">Very Active (daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Exercise sessions per month</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 12"
                    value={formData.exerciseFrequency}
                    onChange={(e) => updateField('exerciseFrequency', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Type of exercise</Label>
                  <Input
                    placeholder="Walking, gym, swimming..."
                    value={formData.exerciseType}
                    onChange={(e) => updateField('exerciseType', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Average duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.exerciseDuration}
                    onChange={(e) => updateField('exerciseDuration', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Diet & Sleep */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  Diet & Sleep
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Diet Type</Label>
                  <Select
                    value={formData.dietType}
                    onValueChange={(v) => updateField('dietType', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular/Mixed</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="keto">Keto/Low-carb</SelectItem>
                      <SelectItem value="halal">Halal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Meals/day</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={formData.mealsPerDay}
                      onChange={(e) => updateField('mealsPerDay', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Water (glasses/day)</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={formData.waterIntake}
                      onChange={(e) => updateField('waterIntake', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Sleep hours/night</Label>
                  <Input
                    type="number"
                    placeholder="7-8"
                    value={formData.sleepHours}
                    onChange={(e) => updateField('sleepHours', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Sleep Quality</Label>
                  <Select
                    value={formData.sleepQuality}
                    onValueChange={(v) => updateField('sleepQuality', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AESTHETICS TAB */}
        <TabsContent value="aesthetics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Skin Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  Skin Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Skin Type</Label>
                  <Select
                    value={formData.skinType}
                    onValueChange={(v) => updateField('skinType', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oily">Oily</SelectItem>
                      <SelectItem value="dry">Dry</SelectItem>
                      <SelectItem value="combination">Combination</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="sensitive">Sensitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-3 block">Skin Concerns (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Acne', 'Wrinkles', 'Dark spots', 'Uneven tone', 'Large pores', 'Redness', 'Dryness', 'Oiliness', 'Scars', 'Dark circles'].map((concern) => (
                      <div key={concern} className="flex items-center space-x-2">
                        <Checkbox
                          id={`concern-${concern}`}
                          checked={formData.skinConcerns.includes(concern)}
                          onCheckedChange={() => toggleArrayItem('skinConcerns', concern)}
                        />
                        <Label htmlFor={`concern-${concern}`} className="text-sm">{concern}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Previous Aesthetic Treatments</Label>
                  <Textarea
                    placeholder="List any previous aesthetic procedures..."
                    value={formData.previousAestheticTreatments}
                    onChange={(e) => updateField('previousAestheticTreatments', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aesthetic Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Aesthetic Interests
                </CardTitle>
                <CardDescription>Select treatments you're interested in learning more about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'interestedInBotox', label: 'Botox / Anti-wrinkle' },
                    { key: 'interestedInFillers', label: 'Dermal Fillers' },
                    { key: 'interestedInFacials', label: 'Medical Facials' },
                    { key: 'interestedInLaserTreatment', label: 'Laser Treatment' },
                    { key: 'interestedInChemicalPeel', label: 'Chemical Peel' },
                    { key: 'interestedInMicroneedling', label: 'Microneedling' },
                    { key: 'interestedInBodyContouring', label: 'Body Contouring' },
                    { key: 'interestedInHairTransplant', label: 'Hair Transplant' },
                    { key: 'interestedInBreastAugmentation', label: 'Breast Augmentation' },
                    { key: 'interestedInLiposuction', label: 'Liposuction' },
                    { key: 'interestedInRhinoplasty', label: 'Rhinoplasty (Nose)' },
                    { key: 'interestedInFacelift', label: 'Facelift' },
                    { key: 'interestedInSkinLightening', label: 'Skin Lightening' },
                    { key: 'interestedInAcneTreatment', label: 'Acne Treatment' },
                    { key: 'interestedInAntiAging', label: 'Anti-Aging Programs' },
                    { key: 'interestedInWeightLoss', label: 'Weight Loss Programs' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={formData[key as keyof FormDataType] as boolean}
                        onCheckedChange={(checked) => updateField(key as keyof FormDataType, checked)}
                      />
                      <Label htmlFor={key} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  <Label>Additional notes about your aesthetic goals</Label>
                  <Textarea
                    placeholder="Tell us more about what you'd like to achieve..."
                    value={formData.aestheticGoalsNotes}
                    onChange={(e) => updateField('aestheticGoalsNotes', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MEDICAL HISTORY TAB */}
        <TabsContent value="medical" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Allergies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Drug Allergies</Label>
                  <Textarea
                    placeholder="List any medications you're allergic to..."
                    value={formData.drugAllergies}
                    onChange={(e) => updateField('drugAllergies', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Food Allergies</Label>
                  <Textarea
                    placeholder="List any food allergies..."
                    value={formData.foodAllergies}
                    onChange={(e) => updateField('foodAllergies', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Other Allergies</Label>
                  <Textarea
                    placeholder="Latex, environmental, etc..."
                    value={formData.allergies}
                    onChange={(e) => updateField('allergies', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-500" />
                  Medications & Supplements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Medications</Label>
                  <Textarea
                    placeholder="List all medications with dosage..."
                    value={formData.currentMedications}
                    onChange={(e) => updateField('currentMedications', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Supplements & Vitamins</Label>
                  <Textarea
                    placeholder="List any supplements you take..."
                    value={formData.supplements}
                    onChange={(e) => updateField('supplements', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chronic Conditions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  Chronic Conditions
                </CardTitle>
                <CardDescription>Check all that apply</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'hasDiabetes', label: 'Diabetes' },
                    { key: 'hasHypertension', label: 'Hypertension' },
                    { key: 'hasHeartDisease', label: 'Heart Disease' },
                    { key: 'hasAsthma', label: 'Asthma' },
                    { key: 'hasThyroidDisorder', label: 'Thyroid Disorder' },
                    { key: 'hasKidneyDisease', label: 'Kidney Disease' },
                    { key: 'hasLiverDisease', label: 'Liver Disease' },
                    { key: 'hasCancer', label: 'Cancer (current/history)' },
                    { key: 'hasAutoimmune', label: 'Autoimmune Disease' },
                    { key: 'hasMentalHealth', label: 'Mental Health Condition' },
                    { key: 'hasSeizures', label: 'Seizures/Epilepsy' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={formData[key as keyof FormDataType] as boolean}
                        onCheckedChange={(checked) => updateField(key as keyof FormDataType, checked)}
                      />
                      <Label htmlFor={key} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Past Surgeries */}
            <Card>
              <CardHeader>
                <CardTitle>Surgical History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Past Surgeries</Label>
                  <Textarea
                    placeholder="List surgeries with dates..."
                    value={formData.pastSurgeries}
                    onChange={(e) => updateField('pastSurgeries', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Hospitalizations</Label>
                  <Textarea
                    placeholder="List any hospital stays..."
                    value={formData.hospitalizations}
                    onChange={(e) => updateField('hospitalizations', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Current Health Concerns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Symptoms</Label>
                  <Textarea
                    placeholder="Describe any current symptoms..."
                    value={formData.currentSymptoms}
                    onChange={(e) => updateField('currentSymptoms', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Pain Level (0-10): {formData.painLevel}</Label>
                  <Slider
                    value={[formData.painLevel]}
                    onValueChange={(v) => updateField('painLevel', v[0])}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FAMILY HISTORY TAB */}
        <TabsContent value="family" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Family Medical History
              </CardTitle>
              <CardDescription>Conditions in immediate family (parents, siblings)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'familyDiabetes', label: 'Diabetes' },
                  { key: 'familyHeartDisease', label: 'Heart Disease' },
                  { key: 'familyCancer', label: 'Cancer' },
                  { key: 'familyHypertension', label: 'Hypertension' },
                  { key: 'familyStroke', label: 'Stroke' },
                  { key: 'familyMentalHealth', label: 'Mental Health' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof FormDataType] as boolean}
                      onCheckedChange={(checked) => updateField(key as keyof FormDataType, checked)}
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
              
              {formData.familyCancer && (
                <div className="mb-4">
                  <Label>Type of cancer in family</Label>
                  <Input
                    placeholder="e.g., Breast, lung, colon..."
                    value={formData.familyCancerType}
                    onChange={(e) => updateField('familyCancerType', e.target.value)}
                  />
                </div>
              )}
              
              <div>
                <Label>Other family conditions</Label>
                <Textarea
                  placeholder="Any other notable conditions..."
                  value={formData.familyOther}
                  onChange={(e) => updateField('familyOther', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMERGENCY TAB */}
        <TabsContent value="emergency" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-500" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={formData.emergencyContact}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input
                    placeholder="e.g., Spouse, Parent, Sibling"
                    value={formData.emergencyRelationship}
                    onChange={(e) => updateField('emergencyRelationship', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasInsurance"
                    checked={formData.hasHealthInsurance}
                    onCheckedChange={(checked) => updateField('hasHealthInsurance', !!checked)}
                  />
                  <Label htmlFor="hasInsurance">I have health insurance</Label>
                </div>
                
                {formData.hasHealthInsurance && (
                  <>
                    <div>
                      <Label>Insurance Provider</Label>
                      <Input
                        placeholder="Company name"
                        value={formData.insuranceProvider}
                        onChange={(e) => updateField('insuranceProvider', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Policy Number</Label>
                      <Input
                        placeholder="Policy/Member ID"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => updateField('insurancePolicyNumber', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any other information you'd like your doctor to know..."
                  value={formData.additionalNotes}
                  onChange={(e) => updateField('additionalNotes', e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed at bottom */}
      <div className="sticky bottom-4 mt-8 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          size="lg"
          className="shadow-lg rounded-full px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Health Profile'}
        </Button>
      </div>
    </div>
  );
}
