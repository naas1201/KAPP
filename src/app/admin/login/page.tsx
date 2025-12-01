'use client';

import { StaffLoginForm } from '@/components/staff-login-form';

export default function AdminLoginPage() {
  return (
    <StaffLoginForm
      role="admin"
      title="Admin Portal"
      description="Sign in to access the admin dashboard"
      redirectPath="/admin"
      alternativeLoginPath="/doctor/login"
      alternativeLoginLabel="Doctor Login →"
    />
  );
}
