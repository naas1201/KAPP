'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to subscribe at this time. Please try again later.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store newsletter subscription in Firestore
      const normalizedEmail = email.toLowerCase().trim();
      const subscriberRef = doc(firestore, 'newsletterSubscribers', normalizedEmail);
      
      setDocumentNonBlocking(subscriberRef, {
        email: normalizedEmail,
        subscribedAt: serverTimestamp(),
        isActive: true,
        source: 'footer',
      }, { merge: true });

      toast({
        title: 'Subscribed!',
        description: 'Thank you for subscribing to our newsletter.',
      });
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to subscribe. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container max-w-7xl">
        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Sincere care, beautiful results. Located in the heart of the
              Philippines.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <h3 className="mb-4 font-semibold font-headline">Clinic</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/booking"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Book Now
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold font-headline">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/#contact"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faq"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/new-patient"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Patient Form
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-span-2">
                <h3 className="mb-4 font-semibold font-headline">
                  Stay Updated
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Subscribe to our newsletter for the latest updates and offers.
                </p>
                <form className="flex w-full max-w-sm gap-2" onSubmit={handleNewsletterSubmit}>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  By subscribing, you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                  . You can{' '}
                  <Link href="/newsletter-unsubscribe" className="underline hover:text-foreground">
                    unsubscribe
                  </Link>
                  {' '}at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6 text-sm border-t text-muted-foreground">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>
              &copy; {new Date().getFullYear()} Castillo Health & Aesthetics. All
              Rights Reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/legal" className="hover:text-foreground">Legal</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

    