'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileQuestion, Home, Users, ClipboardList, UserPlus, UserCog, Flag, Stethoscope, Calendar, Tag, Settings } from 'lucide-react';
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
import { doc } from 'firebase/firestore';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check if the user has admin role
  const userRoleRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  
  const { data: userRoleData, isLoading: isLoadingRole } = useDoc(userRoleRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoadingRole && userRoleData && userRoleData.role !== 'admin') {
      // Not an admin, redirect to appropriate dashboard
      if (userRoleData.role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    }
  }, [user, isUserLoading, userRoleData, isLoadingRole, router]);

  if (isUserLoading || isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Only render if user is admin
  if (userRoleData?.role !== 'admin') {
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
                isActive={pathname === '/admin'}
                tooltip={{ children: 'Overview' }}
              >
                <Link href="/admin">
                  <Home />
                  <span>Overview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/dashboard'}
                tooltip={{ children: 'Patients' }}
              >
                <Link href="/admin/dashboard">
                  <Users />
                  <span>Patients</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/doctors'}
                tooltip={{ children: 'Doctors' }}
              >
                <Link href="/admin/doctors">
                  <Stethoscope />
                  <span>Doctors</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/appointments'}
                tooltip={{ children: 'Appointments' }}
              >
                <Link href="/admin/appointments">
                  <Calendar />
                  <span>Appointments</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/procedures'}
                tooltip={{ children: 'Procedures' }}
              >
                <Link href="/admin/procedures">
                  <ClipboardList />
                  <span>Procedures</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/discount-codes'}
                tooltip={{ children: 'Discount Codes' }}
              >
                <Link href="/admin/discount-codes">
                  <Tag />
                  <span>Discount Codes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/admin/users')}
                tooltip={{ children: 'Staff & Roles' }}
              >
                <Link href="/admin/users">
                  <UserPlus />
                  <span>Staff & Roles</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/name-requests'}
                tooltip={{ children: 'Name Change Requests' }}
              >
                <Link href="/admin/name-requests">
                  <UserCog />
                  <span>Name Requests</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/reports'}
                tooltip={{ children: 'Reports' }}
              >
                <Link href="/admin/reports">
                  <Flag />
                  <span>Reports</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/settings'}
                tooltip={{ children: 'Clinic Settings' }}
              >
                <Link href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/admin/generate-faq'}
                tooltip={{ children: 'GenAI FAQ' }}
              >
                <Link href="/admin/generate-faq">
                  <FileQuestion />
                  <span>GenAI FAQ Tool</span>
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
