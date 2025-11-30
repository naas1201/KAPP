
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

  // Check if the user has doctor role in users collection (by email)
  const userRoleRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  
  const { data: userRoleData, isLoading: isLoadingRole } = useDoc(userRoleRef);

  // Also check for doctor-specific data (onboarding status, etc.)
  const doctorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'doctors', user.uid);
  }, [firestore, user]);
  
  const { data: doctorData, isLoading: isDoctorLoading } = useDoc(doctorRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    // Check role from users collection - redirect if not a doctor
    if (!isLoadingRole && userRoleData && userRoleData.role !== 'doctor') {
      if (userRoleData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/patient/dashboard');
      }
      return;
    }

    // If no role document exists but user is logged in, they might be a patient
    if (!isLoadingRole && !userRoleData && user) {
      router.push('/patient/dashboard');
      return;
    }

    // Check onboarding status
    if (!isDoctorLoading && doctorData) {
      if (!(doctorData as any).onboardingCompleted && pathname !== '/doctor/onboarding') {
        router.push('/doctor/onboarding');
      }
    }
  }, [user, isUserLoading, router, doctorData, isDoctorLoading, pathname, userRoleData, isLoadingRole]);

  if (isUserLoading || isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
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
