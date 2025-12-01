
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Stethoscope, 
  Shield,
  Calendar,
  MessageSquare,
  ClipboardList,
  Heart,
  Settings,
  Users,
  Award,
  ListPlus,
  FileText,
  Tag,
  UserCog,
  Flag,
  Activity,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from '@/components/logo';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase/hooks';
import { signOut } from 'firebase/auth';
import { BookingSheet } from './BookingSheet';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';


const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/new-patient', label: 'New Patients' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

// Patient menu items
const patientMenuItems = [
  { href: '/patient/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/patient/appointments', label: 'My Appointments', icon: Calendar },
  { href: '/patient/medical-info', label: 'Health Profile', icon: Activity },
  { href: '/patient/messages', label: 'Messages', icon: MessageSquare },
  { href: '/patient/profile', label: 'My Profile', icon: User },
];

// Doctor menu items
const doctorMenuItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/patients', label: 'My Patients', icon: Users },
  { href: '/doctor/my-services', label: 'My Services', icon: ListPlus },
  { href: '/doctor/achievements', label: 'Achievements', icon: Award },
];

// Admin menu items
const adminMenuItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard', label: 'Patients', icon: Users },
  { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/procedures', label: 'Procedures', icon: ClipboardList },
  { href: '/admin/discount-codes', label: 'Discount Codes', icon: Tag },
  { href: '/admin/users', label: 'Staff & Roles', icon: UserCog },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Header() {
    const { user, isLoading: isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [isBookingSheetOpen, setBookingSheetOpen] = useState(false);
    
    // Fetch user role from Firestore - uses email as document ID
    const userRoleRef = useMemoFirebase(() => {
        if (!firestore || !user?.email) return null;
        return doc(firestore, 'users', user.email);
    }, [firestore, user?.email]);
    
    const { data: userRoleData, isLoading: isLoadingRole } = useDoc(userRoleRef);
    
    // Determine user role
    const userRole = useMemo(() => {
        if (!user) return null;
        if (userRoleData?.role === 'admin') return 'admin';
        if (userRoleData?.role === 'doctor') return 'doctor';
        return 'patient'; // Default role for signed-in users without explicit role
    }, [user, userRoleData]);
    
    const isStaff = userRole === 'admin' || userRole === 'doctor';
    
    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
    }
    
    // Get menu items based on role
    const menuItems = useMemo(() => {
        if (userRole === 'admin') return adminMenuItems;
        if (userRole === 'doctor') return doctorMenuItems;
        return patientMenuItems;
    }, [userRole]);

    // Get role badge styling
    const getRoleBadge = () => {
        if (userRole === 'admin') {
            return <Badge variant="destructive" className="ml-2 text-xs">Admin</Badge>;
        }
        if (userRole === 'doctor') {
            return <Badge className="ml-2 text-xs bg-emerald-600">Doctor</Badge>;
        }
        return <Badge variant="secondary" className="ml-2 text-xs">Patient</Badge>;
    };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 max-w-7xl">
        <div className="flex items-center gap-4">
          <Logo />
          <nav className="items-center hidden gap-6 text-sm md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium transition-colors text-foreground/60 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
            {!isUserLoading && (
                <>
                {user ? (
                     <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                         <Avatar className="h-9 w-9">
                           <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                           <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                             {user.displayName?.charAt(0) || user.email?.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-64" align="end" forceMount>
                       <DropdownMenuLabel className="font-normal p-3">
                         <div className="flex flex-col space-y-1">
                           <div className="flex items-center">
                             <p className="text-sm font-semibold leading-none">{user.displayName || 'User'}</p>
                             {getRoleBadge()}
                           </div>
                           <p className="text-xs leading-none text-muted-foreground mt-1">
                             {user.email}
                           </p>
                         </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       
                       <DropdownMenuGroup>
                         {menuItems.slice(0, 5).map((item) => (
                           <DropdownMenuItem key={item.href} asChild>
                             <Link href={item.href} className="cursor-pointer">
                               <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                               <span>{item.label}</span>
                             </Link>
                           </DropdownMenuItem>
                         ))}
                       </DropdownMenuGroup>
                       
                       {menuItems.length > 5 && (
                         <>
                           <DropdownMenuSeparator />
                           <DropdownMenuGroup>
                             {menuItems.slice(5).map((item) => (
                               <DropdownMenuItem key={item.href} asChild>
                                 <Link href={item.href} className="cursor-pointer">
                                   <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                   <span>{item.label}</span>
                                 </Link>
                               </DropdownMenuItem>
                             ))}
                           </DropdownMenuGroup>
                         </>
                       )}
                       
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Sign Out</span>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                ) : (
                    <div className="hidden md:flex items-center gap-2">
                         <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/staff-login" className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Staff
                            </Link>
                        </Button>
                    </div>
                )}
                </>
            )}
             {/* Only show Book Now button to non-staff users */}
             {!isStaff && (
               <Button onClick={() => setBookingSheetOpen(true)} className="rounded-full shadow-lg shadow-primary/20">Book Now</Button>
             )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] flex flex-col p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              
              {/* User info section for mobile */}
              {user && (
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {getRoleBadge()}
                  </div>
                </div>
              )}
              
              <nav className="grid gap-1 p-4 text-sm font-medium">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                
                {user && (
                  <>
                    <div className="my-2 border-t" />
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      {userRole === 'admin' ? 'Admin Menu' : userRole === 'doctor' ? 'Doctor Menu' : 'My Account'}
                    </p>
                    {menuItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </>
                )}
              </nav>
              <div className="mt-auto p-4 space-y-2 border-t">
                {user ? (
                     <SheetClose asChild>
                        <Button size="lg" className="w-full" variant="outline" onClick={handleSignOut}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </SheetClose>
                ) : (
                    <>
                     <SheetClose asChild>
                        <Button asChild size="lg" className="w-full">
                            <Link href="/login">Patient Sign In</Link>
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button asChild size="lg" className="w-full" variant="outline">
                            <Link href="/staff-login" className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Staff Login
                            </Link>
                        </Button>
                    </SheetClose>
                    </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    <BookingSheet open={isBookingSheetOpen} onOpenChange={setBookingSheetOpen} />
    </>
  );
}
