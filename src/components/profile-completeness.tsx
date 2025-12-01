'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, User, Phone, Mail, Calendar, MapPin, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfileField {
  key: string;
  label: string;
  icon: React.ElementType;
  required: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
  { key: 'firstName', label: 'First Name', icon: User, required: true },
  { key: 'lastName', label: 'Last Name', icon: User, required: true },
  { key: 'email', label: 'Email', icon: Mail, required: true },
  { key: 'phone', label: 'Phone Number', icon: Phone, required: true },
  { key: 'dateOfBirth', label: 'Date of Birth', icon: Calendar, required: true },
  { key: 'address', label: 'Address', icon: MapPin, required: false },
  { key: 'occupation', label: 'Occupation', icon: Briefcase, required: false },
  { key: 'medicalHistory', label: 'Medical History', icon: Heart, required: false },
];

interface ProfileCompletenessProps {
  patient: any;
  userEmail?: string;
  variant?: 'compact' | 'full';
  onEditProfile?: () => void;
}

export function ProfileCompleteness({
  patient,
  userEmail,
  variant = 'compact',
  onEditProfile,
}: ProfileCompletenessProps) {
  const { completedFields, missingFields, percentage } = useMemo(() => {
    if (!patient) {
      return { completedFields: [], missingFields: PROFILE_FIELDS, percentage: 0 };
    }

    const completed: ProfileField[] = [];
    const missing: ProfileField[] = [];

    PROFILE_FIELDS.forEach((field) => {
      // For email, check both patient email and user email
      if (field.key === 'email') {
        if (patient.email || userEmail) {
          completed.push(field);
        } else {
          missing.push(field);
        }
      } else if (patient[field.key] && patient[field.key].toString().trim() !== '') {
        completed.push(field);
      } else {
        missing.push(field);
      }
    });

    const pct = Math.round((completed.length / PROFILE_FIELDS.length) * 100);

    return { completedFields: completed, missingFields: missing, percentage: pct };
  }, [patient, userEmail]);

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (variant === 'compact') {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Profile Completeness</span>
            </div>
            <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
              {percentage}%
            </Badge>
          </div>
          <Progress value={percentage} className="h-2" />
          {percentage < 100 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {missingFields.length} field{missingFields.length !== 1 ? 's' : ''} remaining
              </p>
              {onEditProfile && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={onEditProfile}>
                  Complete Profile
                </Button>
              )}
            </div>
          )}
          {percentage === 100 && (
            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Profile complete!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Profile Completeness</CardTitle>
            <CardDescription>
              Complete your profile for better care
            </CardDescription>
          </div>
          <Badge 
            variant={percentage === 100 ? 'default' : 'secondary'}
            className="text-lg px-3 py-1"
          >
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-3 mb-6" />
        
        <div className="grid gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map((field) => {
            const isCompleted = completedFields.some((f) => f.key === field.key);
            const Icon = field.icon;
            
            return (
              <div
                key={field.key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                )}
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm ${isCompleted ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {field.label}
                  {field.required && !isCompleted && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {percentage < 100 && (
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Complete Your Profile</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A complete profile helps us provide better care and faster service.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/new-patient">Update Profile</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
