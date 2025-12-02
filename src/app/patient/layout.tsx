'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  User,
  ClipboardList
} from 'lucide-react';
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
import { useUser, useDoc, useFirestore } from '@/firebase/hooks';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { createStaffSession } from '@/lib/staff-auth';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Check if the user has a patient record
  const patientRef = user && firestore ? doc(firestore, 'patients', user.uid) : null;
  const { data: patientData, isLoading: isPatientLoading } = useDoc(patientRef);

  // Check user role and redirect staff to appropriate dashboard
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || !firestore) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role;
          
          // Redirect staff users to their appropriate dashboard
          if (role === 'admin') {
            // Create staff session for admin
            createStaffSession(
              userData.email || user.email || '',
              'admin',
              userData.name || user.displayName || '',
              true
            );
            router.push('/admin');
            return;
          } else if (role === 'doctor') {
            // Create staff session for doctor
            createStaffSession(
              userData.email || user.email || '',
              'doctor',
              userData.name || user.displayName || '',
              true
            );
            router.push('/doctor/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
      
      setIsCheckingRole(false);
    };

    if (user && !isUserLoading) {
      checkUserRole();
    } else if (!isUserLoading) {
      setIsCheckingRole(false);
    }
  }, [user, isUserLoading, firestore, router]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || isCheckingRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
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
                isActive={pathname === '/patient/dashboard'}
                tooltip={{ children: 'Dashboard' }}
              >
                <Link href="/patient/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/patient/appointments'}
                tooltip={{ children: 'Appointments' }}
              >
                <Link href="/patient/appointments">
                  <Calendar />
                  <span>Appointments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/patient/medical-info'}
                tooltip={{ children: 'Medical Info' }}
              >
                <Link href="/patient/medical-info">
                  <ClipboardList />
                  <span>Medical Info</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/patient/messages')}
                tooltip={{ children: 'Messages' }}
              >
                <Link href="/patient/messages">
                  <MessageSquare />
                  <span>Messages</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/patient/profile'}
                tooltip={{ children: 'Profile' }}
              >
                <Link href="/patient/profile">
                  <User />
                  <span>Profile</span>
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
