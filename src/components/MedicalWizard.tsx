
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  HeartPulse, 
  Pill, 
  Sparkles,
  AlertTriangle,
  Activity,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicalWizardProps {
  onComplete: (data: MedicalFormData) => void;
  onSkip?: () => void;
  initialData?: Partial<MedicalFormData>;
}

export interface MedicalFormData {
  // Step 1: Current Symptoms
  chiefComplaint: string;
  symptomDuration: string;
  symptomSeverity: string;
  painLevel: number;
  
  // Step 2: Medical History
  existingConditions: string[];
  otherConditions: string;
  previousSurgeries: string;
  hospitalizationHistory: string;
  
  // Step 3: Medications & Allergies
  currentMedications: string;
  allergies: string;
  hasAdverseReactions: boolean;
  adverseReactionDetails: string;
  
  // Step 4: Lifestyle
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietaryRestrictions: string;
  
  // Step 5: Additional Info
  recentLabResults: string;
  additionalConcerns: string;
  preferredCommunication: string;
}

const defaultFormData: MedicalFormData = {
  chiefComplaint: '',
  symptomDuration: '',
  symptomSeverity: 'moderate',
  painLevel: 0,
  existingConditions: [],
  otherConditions: '',
  previousSurgeries: '',
  hospitalizationHistory: '',
  currentMedications: '',
  allergies: '',
  hasAdverseReactions: false,
  adverseReactionDetails: '',
  smokingStatus: 'never',
  alcoholConsumption: 'none',
  exerciseFrequency: 'moderate',
  dietaryRestrictions: '',
  recentLabResults: '',
  additionalConcerns: '',
  preferredCommunication: 'app',
};

const commonConditions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Thyroid Disorder',
  'Arthritis',
  'Depression/Anxiety',
  'Kidney Disease',
];

const steps = [
  { id: 1, title: 'Current Symptoms', icon: Activity, description: 'Tell us why you\'re seeking consultation' },
  { id: 2, title: 'Medical History', icon: HeartPulse, description: 'Your health background' },
  { id: 3, title: 'Medications & Allergies', icon: Pill, description: 'Current medications and known allergies' },
  { id: 4, title: 'Lifestyle', icon: Sparkles, description: 'Help us understand your lifestyle' },
  { id: 5, title: 'Additional Info', icon: ClipboardList, description: 'Any other relevant information' },
];

export function MedicalWizard({ onComplete, onSkip, initialData }: MedicalWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MedicalFormData>({
    ...defaultFormData,
    ...initialData,
  });
  
  const progress = (currentStep / steps.length) * 100;
  
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const updateForm = (field: keyof MedicalFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      existingConditions: prev.existingConditions.includes(condition)
        ? prev.existingConditions.filter(c => c !== condition)
        : [...prev.existingConditions, condition],
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">What brings you in today? *</Label>
              <Textarea
                id="chiefComplaint"
                placeholder="Describe your main concern or symptoms..."
                value={formData.chiefComplaint}
                onChange={(e) => updateForm('chiefComplaint', e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symptomDuration">How long have you experienced these symptoms?</Label>
              <Input
                id="symptomDuration"
                placeholder="e.g., 2 weeks, 3 months"
                value={formData.symptomDuration}
                onChange={(e) => updateForm('symptomDuration', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>How would you rate the severity?</Label>
              <RadioGroup
                value={formData.symptomSeverity}
                onValueChange={(value) => updateForm('symptomSeverity', value)}
                className="flex flex-wrap gap-4"
              >
                {['mild', 'moderate', 'severe'].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="capitalize cursor-pointer">{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Pain Level (0 = No Pain, 10 = Worst Pain)</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painLevel}
                  onChange={(e) => updateForm('painLevel', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.painLevel}</span>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Do you have any of these conditions?</Label>
              <div className="grid grid-cols-2 gap-3">
                {commonConditions.map((condition) => (
                  <div
                    key={condition}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      formData.existingConditions.includes(condition)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => toggleCondition(condition)}
                  >
                    <Checkbox
                      checked={formData.existingConditions.includes(condition)}
                      onCheckedChange={() => toggleCondition(condition)}
                    />
                    <Label className="cursor-pointer">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="otherConditions">Other medical conditions not listed above</Label>
              <Textarea
                id="otherConditions"
                placeholder="List any other conditions..."
                value={formData.otherConditions}
                onChange={(e) => updateForm('otherConditions', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="previousSurgeries">Previous surgeries or procedures</Label>
              <Textarea
                id="previousSurgeries"
                placeholder="List any surgeries with approximate dates..."
                value={formData.previousSurgeries}
                onChange={(e) => updateForm('previousSurgeries', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hospitalizationHistory">Recent hospitalizations (past 2 years)</Label>
              <Input
                id="hospitalizationHistory"
                placeholder="Reason and dates of hospitalization..."
                value={formData.hospitalizationHistory}
                onChange={(e) => updateForm('hospitalizationHistory', e.target.value)}
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current medications</Label>
              <Textarea
                id="currentMedications"
                placeholder="List all medications with dosages (e.g., Metformin 500mg twice daily)..."
                value={formData.currentMedications}
                onChange={(e) => updateForm('currentMedications', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Include prescription, over-the-counter, and supplements</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Known allergies</Label>
              <Textarea
                id="allergies"
                placeholder="List any allergies to medications, food, or environmental factors..."
                value={formData.allergies}
                onChange={(e) => updateForm('allergies', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <Label className="text-amber-800 dark:text-amber-200">
                    Have you had any adverse reactions to medications?
                  </Label>
                  <RadioGroup
                    value={formData.hasAdverseReactions ? 'yes' : 'no'}
                    onValueChange={(value) => updateForm('hasAdverseReactions', value === 'yes')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="adverse-yes" />
                      <Label htmlFor="adverse-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="adverse-no" />
                      <Label htmlFor="adverse-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {formData.hasAdverseReactions && (
                <Textarea
                  placeholder="Please describe the reaction and medication..."
                  value={formData.adverseReactionDetails}
                  onChange={(e) => updateForm('adverseReactionDetails', e.target.value)}
                  rows={2}
                />
              )}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Smoking status</Label>
              <RadioGroup
                value={formData.smokingStatus}
                onValueChange={(value) => updateForm('smokingStatus', value)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'never', label: 'Never smoked' },
                  { value: 'former', label: 'Former smoker' },
                  { value: 'current', label: 'Current smoker' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`smoking-${value}`} />
                    <Label htmlFor={`smoking-${value}`} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Alcohol consumption</Label>
              <RadioGroup
                value={formData.alcoholConsumption}
                onValueChange={(value) => updateForm('alcoholConsumption', value)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'none', label: 'None' },
                  { value: 'occasional', label: 'Occasional' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'heavy', label: 'Heavy' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`alcohol-${value}`} />
                    <Label htmlFor={`alcohol-${value}`} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Exercise frequency</Label>
              <RadioGroup
                value={formData.exerciseFrequency}
                onValueChange={(value) => updateForm('exerciseFrequency', value)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'sedentary', label: 'Sedentary' },
                  { value: 'light', label: 'Light (1-2x/week)' },
                  { value: 'moderate', label: 'Moderate (3-4x/week)' },
                  { value: 'active', label: 'Very active (5+/week)' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`exercise-${value}`} />
                    <Label htmlFor={`exercise-${value}`} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dietaryRestrictions">Dietary restrictions or special diet</Label>
              <Input
                id="dietaryRestrictions"
                placeholder="e.g., Vegetarian, Low-sodium, Diabetic diet..."
                value={formData.dietaryRestrictions}
                onChange={(e) => updateForm('dietaryRestrictions', e.target.value)}
              />
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recentLabResults">Recent lab results or imaging (if any)</Label>
              <Textarea
                id="recentLabResults"
                placeholder="Share any recent test results or imaging studies..."
                value={formData.recentLabResults}
                onChange={(e) => updateForm('recentLabResults', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                You can also upload documents in the appointment details page
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="additionalConcerns">Any other concerns or questions for the doctor?</Label>
              <Textarea
                id="additionalConcerns"
                placeholder="Anything else you'd like the doctor to know..."
                value={formData.additionalConcerns}
                onChange={(e) => updateForm('additionalConcerns', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Preferred method of follow-up communication</Label>
              <RadioGroup
                value={formData.preferredCommunication}
                onValueChange={(value) => updateForm('preferredCommunication', value)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'app', label: 'In-App Messages' },
                  { value: 'phone', label: 'Phone Call' },
                  { value: 'email', label: 'Email' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`comm-${value}`} />
                    <Label htmlFor={`comm-${value}`} className="cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Almost done!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Review your information and submit to prepare for your consultation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <StepIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">
              Step {currentStep}: {currentStepData.title}
            </CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step.id === currentStep
                  ? 'bg-primary'
                  : step.id < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
              )}
            />
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
        
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrev}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {onSkip && currentStep < steps.length && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length ? (
                <>
                  Submit
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
