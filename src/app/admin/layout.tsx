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
    console.log('[AdminLayout] Creating doc ref for user:', user.email);
    return doc(firestore, 'users', user.email);
  }, [firestore, user?.email]);
  
  const { data: userRoleData, isLoading: isLoadingRole, error: roleError } = useDoc(userRoleRef);

  // Log state changes for debugging
  useEffect(() => {
    console.log('[AdminLayout] State:', {
      isUserLoading,
      isLoadingRole,
      user: user?.email,
      userRoleData,
      roleError: roleError?.message
    });
  }, [isUserLoading, isLoadingRole, user, userRoleData, roleError]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('[AdminLayout] No user, redirecting to login');
      router.push('/login');
      return;
    }

    // If there's an error fetching the role, log it
    if (roleError) {
      console.error('[AdminLayout] Error fetching role:', roleError);
    }

    // Check role after loading is complete
    if (!isLoadingRole && user) {
      if (!userRoleData) {
        // No role document exists - treat as patient
        console.log('[AdminLayout] No role document found for user:', user.email, '- redirecting to patient dashboard');
        router.push('/patient/dashboard');
        return;
      }
      
      if (userRoleData.role !== 'admin') {
        // Not an admin, redirect to appropriate dashboard
        console.log('[AdminLayout] User role is:', userRoleData.role, '- redirecting appropriately');
        if (userRoleData.role === 'doctor') {
          router.push('/doctor/dashboard');
        } else {
          router.push('/patient/dashboard');
        }
      } else {
        console.log('[AdminLayout] User is admin, rendering admin layout');
      }
    }
  }, [user, isUserLoading, userRoleData, isLoadingRole, router, roleError]);

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
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Back to Login
        </button>
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
