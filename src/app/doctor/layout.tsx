
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Stethoscope, ListPlus } from 'lucide-react';
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

  const doctorRef = user ? doc(firestore, 'doctors', user.uid) : null;
  const { data: doctorData, isLoading: isDoctorLoading } = useDoc(doctorRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }

    if (!isDoctorLoading && doctorData) {
        if (!(doctorData as any).onboardingCompleted && pathname !== '/doctor/onboarding') {
            router.push('/doctor/onboarding');
        }
    }
  }, [user, isUserLoading, router, doctorData, isDoctorLoading, pathname]);

  if (isUserLoading || !user || isDoctorLoading) {
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
                isActive={pathname === '/doctor/my-services'}
                tooltip={{ children: 'My Services' }}
              >
                <Link href="/doctor/my-services">
                  <ListPlus />
                  <span>My Services</span>
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
