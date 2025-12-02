
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ListPlus, Trophy, LogOut, UserCircle, Settings } from 'lucide-react';
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
import { useEffect } from 'react';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { Button } from '@/components/ui/button';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading, isDoctor, logout, extendSession } = useStaffAuth();

  // Skip all auth checks for the login page
  const isLoginPage = pathname === '/doctor/login';

  // Extend session on page navigation (not on session changes to avoid infinite loop)
  useEffect(() => {
    if (!isLoginPage && session) {
      extendSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isLoginPage]);

  // Handle auth redirects
  useEffect(() => {
    // Skip auth redirects for login page
    if (isLoginPage) return;

    // Wait for loading to complete
    if (isLoading) return;

    // Not logged in as doctor - redirect to staff login
    if (!isDoctor) {
      console.log('[DoctorLayout] Not doctor, redirecting to staff login');
      router.push('/staff/login?redirect=/doctor/dashboard');
    }
  }, [isDoctor, isLoading, router, isLoginPage]);

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
  if (!isDoctor) {
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/doctor/profile'}
                tooltip={{ children: 'My Profile' }}
              >
                <Link href="/doctor/profile">
                  <UserCircle />
                  <span>My Profile</span>
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
