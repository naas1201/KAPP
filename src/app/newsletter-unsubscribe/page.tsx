'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

export default function NewsletterUnsubscribePage() {
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailFromParams);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleUnsubscribe = async (e: React.FormEvent) => {
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
        description: 'Unable to process request. Please try again later.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const subscriberRef = doc(firestore, 'newsletterSubscribers', normalizedEmail);
      
      // Check if the subscription exists
      const subscriberDoc = await getDoc(subscriberRef);
      
      if (!subscriberDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Not found',
          description: 'This email is not subscribed to our newsletter.',
        });
        setIsSubmitting(false);
        return;
      }

      // Update the subscription to inactive
      updateDocumentNonBlocking(subscriberRef, {
        isActive: false,
        unsubscribedAt: serverTimestamp(),
      });

      setIsUnsubscribed(true);
      toast({
        title: 'Unsubscribed',
        description: 'You have been successfully unsubscribed from our newsletter.',
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to process your request. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUnsubscribed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 rounded-full bg-green-100">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You have been removed from our newsletter mailing list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We're sorry to see you go! If you change your mind, you can 
              always resubscribe from our website.
            </p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-muted">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Unsubscribe from Newsletter</CardTitle>
          <CardDescription>
            Enter your email address to unsubscribe from our newsletter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Unsubscribe'}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Changed your mind?
            </p>
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
