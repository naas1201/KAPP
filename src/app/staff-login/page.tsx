'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, firestore } from '@/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
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
import { Shield, Stethoscope, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

function StaffLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    setLoginError(null);

    try {
      // Set persistence to local (stay logged in)
      await setPersistence(auth, browserLocalPersistence);
      
      // First, check if this email has a staff role BEFORE signing in
      const userRoleDoc = await getDoc(doc(firestore, 'users', data.email));
      
      if (!userRoleDoc.exists()) {
        setLoginError('This account is not registered as staff. Please use the patient login.');
        setIsLoading(false);
        return;
      }

      const role = userRoleDoc.data()?.role;
      if (role !== 'admin' && role !== 'doctor') {
        setLoginError('This account is not authorized for staff access. Please use the patient login.');
        setIsLoading(false);
        return;
      }

      // Now sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      toast({ 
        title: 'Welcome back!',
        description: `Signed in as ${role === 'admin' ? 'Administrator' : 'Doctor'}`
      });
      
      // Redirect based on role
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/doctor/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Please try again later.');
      } else {
        setLoginError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto mb-2 w-fit">
            <Logo />
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm">
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Staff Portal</CardTitle>
            <CardDescription className="mt-2">
              Secure login for administrators and doctors only
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your.email@clinic.com" 
                        {...field} 
                        className="h-11"
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
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In to Staff Portal'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-sm text-muted-foreground">
              Are you a patient?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Use patient login instead
              </Link>
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              🔒 This portal is for authorized clinic staff only. 
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffLoginFormSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<StaffLoginFormSkeleton />}>
      <StaffLoginForm />
    </Suspense>
  );
}
