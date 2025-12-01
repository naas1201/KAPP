'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().default(false).optional(),
});

type FormData = z.infer<typeof formSchema>;

export type StaffRole = 'admin' | 'doctor';

interface StaffLoginFormProps {
  role: StaffRole;
  title: string;
  description: string;
  redirectPath: string;
  alternativeLoginPath: string;
  alternativeLoginLabel: string;
}

export function StaffLoginForm({
  role,
  title,
  description,
  redirectPath,
  alternativeLoginPath,
  alternativeLoginLabel,
}: StaffLoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = form.watch('rememberMe');

  const onSubmit = async (data: FormData) => {
    if (!auth) {
      console.error('Auth not initialized');
      return;
    }
    
    setIsLoading(true);
    setRoleError(null);
    
    try {
      // Set persistence based on remember me
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      // Sign in with Firebase Auth
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log(`[${role}Login] Sign-in successful for:`, result.user.email);
      
      // Verify the user has the correct role
      if (!firestore || !result.user.email) {
        throw new Error('Unable to verify user role');
      }
      
      const normalizedEmail = result.user.email.toLowerCase();
      const userDocRef = doc(firestore, 'users', normalizedEmail);
      const userRoleDoc = await getDoc(userDocRef);
      
      if (!userRoleDoc.exists()) {
        // Sign out the user since they don't have the right role
        await auth.signOut();
        setRoleError(`No ${role} account found for this email. Please contact the administrator if you believe this is an error.`);
        return;
      }
      
      const userData = userRoleDoc.data();
      const userRole = userData?.role;
      
      if (userRole !== role) {
        // Sign out the user since they don't have the right role
        await auth.signOut();
        
        if (userRole === 'admin') {
          setRoleError('This account is an admin account. Please use the admin login page.');
        } else if (userRole === 'doctor') {
          setRoleError('This account is a doctor account. Please use the doctor login page.');
        } else {
          setRoleError(`This is a patient account. Please use the main login page at /login.`);
        }
        return;
      }
      
      toast({ title: 'Signed in successfully!' });
      router.push(redirectPath);
    } catch (error: any) {
      console.error(`[${role}Login] Sign-in error:`, error);
      
      // Provide specific error messages based on Firebase error codes
      let errorMessage = 'Invalid email or password. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check your email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: errorMessage,
      });
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {roleError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{roleError}</AlertDescription>
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

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              <Link href={alternativeLoginPath} className="font-semibold text-primary hover:underline">
                {alternativeLoginLabel}
              </Link>
            </p>
            <p className="text-muted-foreground">
              Are you a patient?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Patient Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
