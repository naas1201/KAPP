
'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Create user document in Firestore at users/{uid} with default 'patient' role
      // This is required for role-based access control via Firestore rules
      if (result.user) {
        const userDocRef = doc(firestore, 'users', result.user.uid);
        await setDoc(userDocRef, {
          email: result.user.email?.toLowerCase(),
          role: 'patient', // Default role for new sign-ups
          name: result.user.displayName || '',
          createdAt: serverTimestamp(),
        }, { merge: true }); // Use merge to avoid overwriting if user already exists
      }
      
      toast({ title: 'Signed up successfully!' });
      router.push(redirectUrl);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-up failed',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (!userCredential?.user) throw new Error('User creation failed');
      
      await updateProfile(userCredential.user, { displayName: data.fullName });
      
      // Create user document in Firestore at users/{uid} with default 'patient' role
      // This is required for role-based access control via Firestore rules
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userCredential.user.email?.toLowerCase(),
        role: 'patient', // Default role for new sign-ups
        name: data.fullName,
        createdAt: serverTimestamp(),
      });
      
      toast({ title: 'Account created successfully!' });
      router.push(redirectUrl);
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already in use. Please try signing in instead.';
        }
      toast({
        variant: 'destructive',
        title: 'Sign-up failed',
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-fit">
                <Logo />
            </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join us by filling out the form below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.02C43.41 37.28 47 31.45 47 24.55z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SignupFormSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormSkeleton />}>
      <SignupForm />
    </Suspense>
  );
}
