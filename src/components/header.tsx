
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from '@/components/logo';
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { BookingSheet } from './BookingSheet';


const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/new-patient', label: 'New Patients' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

export function Header() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const [isBookingSheetOpen, setBookingSheetOpen] = useState(false);
    
    const handleSignOut = async () => {
        await signOut(auth);
    }

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
                className="font-medium transition-colors text-foreground/60 hover:text-foreground"
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
                       <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                           <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                         </Avatar>
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end" forceMount>
                       <DropdownMenuLabel className="font-normal">
                         <div className="flex flex-col space-y-1">
                           <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                           <p className="text-xs leading-none text-muted-foreground">
                             {user.email}
                           </p>
                         </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                         <Link href="/admin/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                       </DropdownMenuItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={handleSignOut}>
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Log out</span>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                ) : (
                    <div className="hidden md:flex items-center gap-2">
                         <Button variant="ghost" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                )}
                </>
            )}
             <Button onClick={() => setBookingSheetOpen(true)}>Book Now</Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] flex flex-col">
              <div className="p-4 border-b">
                <Logo />
              </div>
              <nav className="grid gap-4 p-4 text-lg font-medium">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto m-4 space-y-2">
                {user ? (
                     <SheetClose asChild>
                        <Button asChild size="lg" className="w-full" variant="outline" onClick={handleSignOut}>
                            <button>Sign Out</button>
                        </Button>
                    </SheetClose>
                ) : (
                    <>
                     <SheetClose asChild>
                        <Button asChild size="lg" className="w-full" variant="outline">
                            <Link href="/login">Sign In</Link>
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
