'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now redirects to the unified staff login
export default function AdminLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/staff/login?redirect=/admin');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting to Staff Login...</p>
    </div>
  );
}

