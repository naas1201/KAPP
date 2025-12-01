'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileQuestion, Home, Users, ClipboardList, UserPlus, UserCog, Flag, Stethoscope, Calendar, Tag, Settings, Mail, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading, isAdmin, logout, extendSession } = useStaffAuth();

  // Skip all auth checks for the login page
  const isLoginPage = pathname === '/admin/login';

  // Extend session on any activity
  useEffect(() => {
    if (session && !isLoginPage) {
      extendSession();
    }
  }, [pathname, session, extendSession, isLoginPage]);

  // Handle auth redirects
  useEffect(() => {
    // Skip auth redirects for login page
    if (isLoginPage) return;
    
    // Wait for loading to complete
    if (isLoading) return;

    // Not logged in as admin - redirect to staff login
    if (!isAdmin) {
      console.log('[AdminLayout] Not admin, redirecting to staff login');
      router.push('/staff/login?redirect=/admin');
    }
  }, [isAdmin, isLoading, router, isLoginPage]);

  const handleLogout = () => {
    logout();
    router.push('/staff/login');
  };

  // For login page, render children directly without sidebar or auth checks
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting to login...</p>
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
                isActive={pathname === '/admin/newsletter'}
                tooltip={{ children: 'Newsletter' }}
              >
                <Link href="/admin/newsletter">
                  <Mail />
                  <span>Newsletter</span>
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
        <SidebarFooter className="p-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            Logged in as: {session?.name || session?.email}
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
