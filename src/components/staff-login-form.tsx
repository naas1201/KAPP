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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
import { AlertCircle, Shield, Stethoscope } from 'lucide-react';

const formSchema = z.object({
  identifier: z.string().min(1, { message: 'Please enter your email or staff ID.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  rememberMe: z.boolean().default(false).optional(),
});

type FormData = z.infer<typeof formSchema>;

export type StaffRole = 'admin' | 'doctor';

// Constants for login paths
const PATIENT_LOGIN_PATH = '/login';

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
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = form.watch('rememberMe');

  // Helper function to look up email by staff ID
  const lookupEmailByStaffId = async (staffId: string): Promise<string | null> => {
    if (!firestore) return null;
    
    try {
      // Check if it's a staff ID format (e.g., "admin1", "doc123")
      // First, try to find in users collection by staffId field
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('staffId', '==', staffId.toLowerCase()), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return userDoc.data().email || userDoc.id;
      }
      
      return null;
    } catch (error) {
      console.error('[StaffLogin] Error looking up staff ID:', error);
      return null;
    }
  };

  // Helper to find user doc by email across different collection schemes
  const findUserDocByEmail = async (email: string): Promise<{ exists: boolean; userData?: Record<string, unknown> }> => {
    if (!firestore) {
      return { exists: false };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Strategy 1: Query by emailLower field
      const q1 = query(collection(firestore, 'users'), where('emailLower', '==', normalizedEmail));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        return { exists: true, userData: snap1.docs[0].data() };
      }

      // Strategy 2: Query by email field
      const q2 = query(collection(firestore, 'users'), where('email', '==', normalizedEmail));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        return { exists: true, userData: snap2.docs[0].data() };
      }

      // Strategy 3: Fallback to reading doc by id (older deployments use email as doc id)
      const userDocRefById = doc(firestore, 'users', normalizedEmail);
      const snapById = await getDoc(userDocRefById);
      if (snapById.exists()) {
        return { exists: true, userData: snapById.data() };
      }

      return { exists: false };
    } catch (error) {
      console.error('[StaffLogin] Error finding user doc:', error);
      return { exists: false };
    }
  };

  // Helper to find user doc by uid (for post-auth validation)
  const findUserDocByUid = async (uid: string): Promise<{ exists: boolean; userData?: Record<string, unknown> }> => {
    if (!firestore) {
      return { exists: false };
    }

    try {
      // Primary strategy: doc id = uid
      const userDocRef = doc(firestore, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return { exists: true, userData: snap.data() };
      }

      return { exists: false };
    } catch (error) {
      console.error('[StaffLogin] Error finding user doc by uid:', error);
      return { exists: false };
    }
  };

  // Pre-validate role before authentication
  const validateRoleBeforeAuth = async (email: string): Promise<{ isValid: boolean; message?: string }> => {
    if (!firestore) {
      return { isValid: false, message: 'Firestore not available. Please try again later.' };
    }

    try {
      const result = await findUserDocByEmail(email);

      if (!result.exists || !result.userData) {
        return { 
          isValid: false, 
          message: `No ${role} account found for this email. Please contact the administrator if you believe this is an error.` 
        };
      }
      
      const userRole = result.userData.role;
      
      if (userRole !== role) {
        if (userRole === 'admin') {
          return { isValid: false, message: 'This account is an admin account. Please use the admin login page.' };
        } else if (userRole === 'doctor') {
          return { isValid: false, message: 'This account is a doctor account. Please use the doctor login page.' };
        } else {
          return { isValid: false, message: 'This is a patient account. Please use the Patient Login page.' };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('[StaffLogin] Error validating role:', error);
      return { isValid: false, message: 'Error validating account. Please try again.' };
    }
  };

  // Post-login role revalidation by uid
  const revalidateRoleAfterAuth = async (uid: string, userEmail: string | null): Promise<{ isValid: boolean; message?: string }> => {
    if (!firestore) {
      return { isValid: false, message: 'Firestore not available.' };
    }

    try {
      // First try to find by uid
      let result = await findUserDocByUid(uid);

      // If not found by uid, fall back to email search
      if (!result.exists && userEmail) {
        result = await findUserDocByEmail(userEmail);
      }

      if (!result.exists || !result.userData) {
        return { 
          isValid: false, 
          message: 'Account not recognized as staff. Contact admin.' 
        };
      }

      const userRole = result.userData.role;

      if (userRole !== role) {
        return { 
          isValid: false, 
          message: 'Access denied: account does not have the required staff role.' 
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('[StaffLogin] Error revalidating role after auth:', error);
      return { isValid: false, message: 'Error verifying account role.' };
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!auth) {
      console.error('Auth not initialized');
      return;
    }
    
    setIsLoading(true);
    setRoleError(null);
    
    try {
      let email = data.identifier.trim();
      
      // Check if the identifier is an email or a staff ID
      const isEmail = email.includes('@');
      
      if (!isEmail) {
        // Try to look up email by staff ID
        const lookedUpEmail = await lookupEmailByStaffId(email);
        if (!lookedUpEmail) {
          setRoleError(`No ${role} account found with this staff ID. Please check your credentials or use your email address.`);
          setIsLoading(false);
          return;
        }
        email = lookedUpEmail;
      }
      
      // IMPORTANT: Validate role BEFORE Firebase Auth sign-in
      // This prevents the user from being signed in as a patient if they don't have the correct role
      const roleValidation = await validateRoleBeforeAuth(email);
      if (!roleValidation.isValid) {
        setRoleError(roleValidation.message || 'Access denied.');
        setIsLoading(false);
        return;
      }
      
      // Set persistence based on remember me
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      // Now sign in with Firebase Auth (role is already validated)
      const result = await signInWithEmailAndPassword(auth, email, data.password);
      console.log(`[${role}Login] Sign-in successful for:`, result.user.email);
      
      // Post-login role revalidation by uid (extra security layer)
      const postAuthValidation = await revalidateRoleAfterAuth(result.user.uid, result.user.email);
      if (!postAuthValidation.isValid) {
        // Role mismatch detected - sign out and show error
        await auth.signOut();
        setRoleError(postAuthValidation.message || 'Access denied: account does not have the required staff role.');
        setIsLoading(false);
        return;
      }
      
      toast({ title: 'Signed in successfully!' });
      router.push(redirectPath);
    } catch (error: any) {
      console.error(`[${role}Login] Sign-in error:`, error);
      
      // Provide specific error messages based on Firebase error codes
      let errorMessage = 'Invalid credentials. Please check your email/staff ID and password.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Please check your email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email/staff ID and password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please check your email or contact the administrator.';
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

  const RoleIcon = role === 'admin' ? Shield : Stethoscope;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Logo />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <RoleIcon className="w-5 h-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
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
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Staff ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder={role === 'admin' ? 'admin@example.com or admin1' : 'doctor@example.com or doc123'} 
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
              <Link href={PATIENT_LOGIN_PATH} className="font-semibold text-primary hover:underline">
                Patient Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
