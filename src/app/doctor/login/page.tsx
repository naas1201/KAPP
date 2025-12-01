'use client';

import { StaffLoginForm } from '@/components/staff-login-form';

export default function DoctorLoginPage() {
  return (
    <StaffLoginForm
      role="doctor"
      title="Doctor Portal"
      description="Sign in to access your doctor dashboard"
      redirectPath="/doctor/dashboard"
      alternativeLoginPath="/admin/login"
      alternativeLoginLabel="Admin Login →"
    />
  );
}
