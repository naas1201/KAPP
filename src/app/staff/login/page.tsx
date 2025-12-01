'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users } from 'lucide-react';
import { useUser } from '@/firebase/hooks';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect');

  // Redirect if already logged in with a staff role
  useEffect(() => {
    if (user && !isUserLoading && firestore) {
      // Check the user's role and redirect accordingly
      const checkRoleAndRedirect = async () => {
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'admin') {
              router.push(redirectUrl || '/admin');
            } else if (userData.role === 'doctor') {
              router.push(redirectUrl || '/doctor/dashboard');
            }
            // If role is 'patient', don't redirect - they should use patient login
          }
        } catch (err) {
          console.error('Error checking user role:', err);
        }
      };
      checkRoleAndRedirect();
    }
  }, [user, isUserLoading, router, redirectUrl]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = form.watch('rememberMe');

  useEffect(() => {
    if (!auth) return;
    const persistence = rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;
    setPersistence(auth, persistence);
  }, [rememberMe]);

  const onSubmit = async (data: FormData) => {
    if (!auth || !firestore) {
      setError('Authentication service not available. Please try again later.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Firebase Auth (email/password)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password
      );
      
      // 2. Read the user's role from Firestore at users/{uid}
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        setError('No staff profile found. Please contact your administrator.');
        setIsLoading(false);
        return;
      }
      
      const userData = userDocSnap.data();
      const role = userData.role;
      
      // 3. Verify the user has a staff role (admin or doctor)
      if (role !== 'admin' && role !== 'doctor') {
        setError('This is a patient account. Please use the Patient Login page.');
        setIsLoading(false);
        return;
      }
      
      // 4. Success - redirect based on role
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${role}`,
      });
      
      const defaultPath = role === 'admin' ? '/admin' : '/doctor/dashboard';
      router.push(redirectUrl || defaultPath);
      
    } catch (error: any) {
      console.error('Staff login error:', error);
      
      // Provide specific error messages based on Firebase error codes
      let errorMessage = 'An error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'permission-denied':
          errorMessage = 'Access denied. Please contact your administrator.';
          break;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Logo />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Staff Portal</CardTitle>
          </div>
          <CardDescription>
            Sign in with your staff credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="staff@example.com"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">Remember me</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Link href="/forgot-password" passHref>
                  <Button variant="link" className="px-0 text-sm h-auto">
                    Forgot password?
                  </Button>
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Are you a patient?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Patient Login
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Staff accounts are managed by administrators</p>
            <p>Contact your administrator if you need access or have forgotten your password.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <StaffLoginContent />
    </Suspense>
  );
}
