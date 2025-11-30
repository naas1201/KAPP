
'use client';

import { useRouter } from 'next/navigation';
import {
  LogIn,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useFirebase } from '@/firebase';
import Link from 'next/link';



interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingSheet({ open, onOpenChange }: BookingSheetProps) {
  const router = useRouter();
  const { user, isUserLoading } = useFirebase();

  const handleContinueToBooking = () => {
    onOpenChange(false);
    router.push('/booking');
  };

  const handleSignIn = () => {
    onOpenChange(false);
    router.push('/login?redirect=/booking');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Book an Appointment</SheetTitle>
          <SheetDescription>
            Schedule your visit in just a few clicks. We look forward to seeing you.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8">
          {isUserLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : user ? (
            <div className="space-y-6 text-center">
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Booking</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Welcome back, <strong>{user.displayName || user.email}</strong>! 
                  You&apos;re signed in and ready to book your appointment.
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment is required to confirm your booking. Your appointment will be secured once payment is complete.
                </p>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleContinueToBooking}
                >
                  Continue to Book Appointment
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="p-6 rounded-lg bg-muted/50 border">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To ensure the security of your medical records and provide you with the best experience, 
                  please sign in or create an account before booking.
                </p>
                <ul className="text-sm text-left text-muted-foreground space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Securely manage your appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Upload medical documents and photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Communicate directly with your doctor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Reschedule or cancel appointments easily</span>
                  </li>
                </ul>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleSignIn}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Book
                </Button>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/signup?redirect=/booking" 
                    className="text-primary hover:underline font-medium"
                    onClick={() => onOpenChange(false)}
                  >
                    Sign up
                  </Link>
                </p>
              </SheetFooter>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
