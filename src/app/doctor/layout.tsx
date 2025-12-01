
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ListPlus, Calendar, Trophy } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Skip all auth checks for the login page
  const isLoginPage = pathname === '/doctor/login';

  // Check if the user has doctor role in users collection (by email)
  const userRoleRef = useMemoFirebase(() => {
    if (isLoginPage || !firestore || !user?.email) return null;
    // Use lowercase email to match Firestore document ID
    const normalizedEmail = user.email.toLowerCase();
    console.log('[DoctorLayout] Creating doc ref for user:', normalizedEmail);
    return doc(firestore, 'users', normalizedEmail);
  }, [firestore, user?.email, isLoginPage]);
  
  const { data: userRoleData, isLoading: isLoadingRole, error: roleError } = useDoc(userRoleRef);

  // Also check for doctor-specific data (onboarding status, etc.)
  const doctorRef = useMemoFirebase(() => {
    if (isLoginPage || !firestore || !user) return null;
    return doc(firestore, 'doctors', user.uid);
  }, [firestore, user, isLoginPage]);
  
  const { data: doctorData, isLoading: isDoctorLoading } = useDoc(doctorRef);

  // Log state changes for debugging
  useEffect(() => {
    if (isLoginPage) return;
    console.log('[DoctorLayout] State:', {
      isUserLoading,
      isLoadingRole,
      user: user?.email,
      userRoleData,
      roleError: roleError?.message
    });
  }, [isUserLoading, isLoadingRole, user, userRoleData, roleError, isLoginPage]);

  useEffect(() => {
    // Skip auth redirects for login page
    if (isLoginPage) return;

    if (!isUserLoading && !user) {
      console.log('[DoctorLayout] No user, redirecting to doctor login');
      router.push('/doctor/login');
      return;
    }

    // If there's an error fetching the role, log it
    if (roleError) {
      console.error('[DoctorLayout] Error fetching role:', roleError);
    }

    // Check role from users collection - redirect if not a doctor
    if (!isLoadingRole && userRoleData && userRoleData.role !== 'doctor') {
      console.log('[DoctorLayout] User role is:', userRoleData.role, '- redirecting');
      if (userRoleData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/patient/dashboard');
      }
      return;
    }

    // If no role document exists but user is logged in, they might be a patient
    if (!isLoadingRole && !userRoleData && user) {
      console.log('[DoctorLayout] No role document, redirecting to patient dashboard');
      router.push('/patient/dashboard');
      return;
    }

    // Check onboarding status
    if (!isDoctorLoading && doctorData) {
      if (!(doctorData as any).onboardingCompleted && pathname !== '/doctor/onboarding') {
        console.log('[DoctorLayout] Doctor not onboarded, redirecting to onboarding');
        router.push('/doctor/onboarding');
      }
    }
  }, [user, isUserLoading, router, doctorData, isDoctorLoading, pathname, userRoleData, isLoadingRole, roleError, isLoginPage]);

  // For login page, render children directly without sidebar or auth checks
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isUserLoading || isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Show error if there was a problem fetching the role
  if (roleError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500">Error loading user role</p>
        <p className="text-sm text-muted-foreground">{roleError.message}</p>
        <button 
          onClick={() => router.push('/doctor/login')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Only render if user is a doctor
  if (userRoleData?.role !== 'doctor') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/doctor/dashboard'}
                tooltip={{ children: 'Dashboard' }}
              >
                <Link href="/doctor/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/doctor/patients'}
                tooltip={{ children: 'My Patients' }}
              >
                <Link href="/doctor/patients">
                  <Users />
                  <span>My Patients</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/doctor/my-services'}
                tooltip={{ children: 'My Services' }}
              >
                <Link href="/doctor/my-services">
                  <ListPlus />
                  <span>My Services</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/doctor/achievements'}
                tooltip={{ children: 'Achievements' }}
              >
                <Link href="/doctor/achievements">
                  <Trophy />
                  <span>Achievements</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
