'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth, firestore } from '@/firebase/client';
import { signInStaffUser, lookupEmailByStaffId, type StaffRole } from '@/firebase/admin-auth';
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

// Re-export StaffRole from admin-auth
export type { StaffRole };

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

  const onSubmit = async (data: FormData) => {
    if (!auth || !firestore) {
      console.error('Auth or Firestore not initialized');
      return;
    }
    
    setIsLoading(true);
    setRoleError(null);
    
    try {
      let email = data.identifier.trim();
      
      // Check if the identifier is an email or a staff ID
      const isEmail = email.includes('@');
      
      if (!isEmail) {
        // Use centralized staff ID lookup from admin-auth
        const lookedUpEmail = await lookupEmailByStaffId(firestore, email, role);
        if (!lookedUpEmail) {
          setRoleError(`No ${role} account found with this staff ID. Please check your credentials or use your email address.`);
          setIsLoading(false);
          return;
        }
        email = lookedUpEmail;
      }
      
      // Set persistence based on remember me
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      // Use the BLOCKING signInStaffUser function
      // This waits for Firebase Auth to confirm credentials AND validates the role
      const result = await signInStaffUser(auth, firestore, email, data.password, role);
      
      if (result.success) {
        console.log(`[${role}Login] Sign-in successful for:`, result.user?.email);
        toast({ title: 'Signed in successfully!' });
        router.push(redirectPath);
      } else {
        // Show the error message from the blocking auth function
        setRoleError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error(`[${role}Login] Unexpected error:`, error);
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: 'An unexpected error occurred. Please try again.',
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
