'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Stethoscope, Users, WifiOff } from 'lucide-react';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/client';
import type { StaffRole } from '@/lib/staff-auth';
import { Suspense } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  accessCode: z.string().min(4, { message: 'Access code must be at least 4 characters.' }),
  role: z.enum(['admin', 'doctor'], { required_error: 'Please select your role.' }),
  rememberDevice: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

/**
 * Check if an error is a network/connection error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Check common network error messages
    if (
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('unavailable') ||
      message.includes('offline') ||
      message.includes('quic') ||
      message.includes('transport')
    ) {
      return true;
    }
    
    // Check for Firebase/Firestore specific error codes
    const errorWithCode = error as { code?: string };
    if (errorWithCode.code) {
      const code = errorWithCode.code.toLowerCase();
      if (
        code.includes('unavailable') ||
        code.includes('network') ||
        code.includes('timeout') ||
        code === 'resource-exhausted' ||
        code === 'internal' ||
        code === 'cancelled'
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Retry a Firestore operation with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors
      if (!isNetworkError(error)) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login, isLoggedIn, session } = useStaffAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);

  const redirectUrl = searchParams.get('redirect');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && session) {
      const defaultPath = session.role === 'admin' ? '/admin' : '/doctor/dashboard';
      router.push(redirectUrl || defaultPath);
    }
  }, [isLoggedIn, session, router, redirectUrl]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      accessCode: '',
      role: undefined,
      rememberDevice: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setIsNetworkIssue(false);

    try {
      if (!firestore) {
        throw new Error('Database not available');
      }

      // Look up staff member by email in staffCredentials collection
      const normalizedEmail = data.email.trim().toLowerCase();
      
      // Define the staff credential data type
      interface StaffCredentialData {
        email?: string;
        role?: string;
        accessCode?: string;
        name?: string;
      }
      
      // Try to find by email as document ID first with retry logic
      const credentialDocRef = doc(firestore, 'staffCredentials', normalizedEmail);
      
      let credentialData: StaffCredentialData | null = null;
      
      try {
        const credentialDocSnap = await retryWithBackoff(() => getDoc(credentialDocRef));
        
        if (credentialDocSnap.exists()) {
          credentialData = credentialDocSnap.data() as StaffCredentialData;
        } else {
          // Try to query by email field with retry logic
          const credentialsRef = collection(firestore, 'staffCredentials');
          const q = query(credentialsRef, where('email', '==', normalizedEmail));
          const querySnapshot = await retryWithBackoff(() => getDocs(q));
          
          if (!querySnapshot.empty) {
            credentialData = querySnapshot.docs[0].data() as StaffCredentialData;
          }
        }
      } catch (err) {
        // Handle network errors specifically
        if (isNetworkError(err)) {
          setIsNetworkIssue(true);
          setError('Unable to connect to the database. Please check your internet connection and try again.');
          setIsLoading(false);
          return;
        }
        throw err;
      }

      if (!credentialData) {
        setError('No staff account found with this email. Please contact your administrator.');
        setIsLoading(false);
        return;
      }

      // Check role matches
      if (credentialData.role !== data.role) {
        if (credentialData.role === 'admin') {
          setError('This email is registered as an admin. Please select "Admin" as your role.');
        } else if (credentialData.role === 'doctor') {
          setError('This email is registered as a doctor. Please select "Doctor" as your role.');
        } else {
          setError(`This is a ${credentialData.role || 'patient'} account. Staff login is only for admin and doctor accounts.`);
        }
        setIsLoading(false);
        return;
      }

      // Check access code
      // The access code is stored in the staffCredentials document
      if (credentialData.accessCode !== data.accessCode) {
        setError('Invalid access code. Please check your code and try again.');
        setIsLoading(false);
        return;
      }

      // Success! Create the session with remember device preference
      const displayName = credentialData.name || credentialData.email || data.email;
      login(normalizedEmail, data.role as StaffRole, displayName, data.rememberDevice);

      toast({ title: 'Welcome back!', description: `Signed in as ${data.role}` });
      
      // Redirect based on role
      const defaultPath = data.role === 'admin' ? '/admin' : '/doctor/dashboard';
      router.push(redirectUrl || defaultPath);

    } catch (err) {
      console.error('Staff login error:', err);
      
      if (isNetworkError(err)) {
        setIsNetworkIssue(true);
        setError('Unable to connect to the database. Please check your internet connection and try again.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
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
            Sign in to access the admin or doctor dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {isNetworkIssue ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            <span>Doctor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Code</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your access code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberDevice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="rememberDevice"
                      />
                    </FormControl>
                    <FormLabel htmlFor="rememberDevice" className="text-sm font-normal cursor-pointer">
                      Remember this device for 6 months (use on trusted devices only)
                    </FormLabel>
                  </FormItem>
                )}
              />

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
            <p className="font-medium mb-1">Need access?</p>
            <p>Contact your administrator to get your email registered and receive an access code.</p>
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
