
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCollection,
  useFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface DoctorService {
  price: number;
  providesService: boolean;
}

type DoctorServicesState = Record<string, DoctorService>;

export default function OnboardingPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const treatmentsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'treatments') : null), [firestore]);
  const { data: allTreatments, isLoading: isLoadingTreatments } = useCollection<Treatment>(treatmentsRef);

  const [myServices, setMyServices] = useState<DoctorServicesState>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (allTreatments) {
        const initialServices = allTreatments.reduce((acc, treatment) => {
            acc[treatment.id] = { providesService: false, price: 0 };
            return acc;
        }, {} as DoctorServicesState);
        setMyServices(initialServices);
    }
  }, [allTreatments]);

  const handleProvidesServiceChange = (treatmentId: string, checked: boolean) => {
    setMyServices((prev) => ({
      ...prev,
      [treatmentId]: { ...prev[treatmentId], providesService: checked, price: prev[treatmentId]?.price || 0 },
    }));
  };

  const handlePriceChange = (treatmentId: string, price: string) => {
    const numericPrice = Number(price);
    if (!isNaN(numericPrice)) {
      setMyServices((prev) => ({
        ...prev,
        [treatmentId]: { ...prev[treatmentId], price: numericPrice },
      }));
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!firestore || !user) return;
    setIsSaving(true);

    // Save selected services and prices
    const servicePromises = Object.entries(myServices).map(([treatmentId, serviceData]) => {
      const serviceRef = doc(firestore, 'doctors', user.uid, 'services', treatmentId);
      return setDocumentNonBlocking(serviceRef, {
        treatmentId: treatmentId,
        providesService: serviceData.providesService,
        price: serviceData.providesService ? serviceData.price : 0,
      }, { merge: true });
    });

    await Promise.all(servicePromises);

    // Mark onboarding as complete
    const doctorRef = doc(firestore, 'doctors', user.uid);
    updateDocumentNonBlocking(doctorRef, { onboardingCompleted: true });

    toast({ title: 'Welcome!', description: 'Your service setup is complete.' });
    router.push('/doctor/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-fit"><Logo /></div>
          <CardTitle className="text-2xl font-headline">Welcome, Doctor!</CardTitle>
          <CardDescription>
            Let's set up your profile. Please select the services you provide and set your prices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto p-6">
          {isLoadingTreatments ? (
             Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                </div>
            ))
          ) : (
            allTreatments?.map((treatment) => (
              <div
                key={treatment.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md gap-4"
              >
                 <div className="flex items-center gap-4">
                  <Checkbox
                    id={`service-${treatment.id}`}
                    checked={myServices[treatment.id]?.providesService || false}
                    onCheckedChange={(checked) =>
                      handleProvidesServiceChange(treatment.id, !!checked)
                    }
                  />
                  <label htmlFor={`service-${treatment.id}`} className="font-medium">
                    {treatment.name}
                  </label>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto pl-8 sm:pl-0">
                    <span className="text-muted-foreground">₱</span>
                    <Input
                        type="number"
                        placeholder="Price"
                        className="w-full sm:w-32"
                        value={myServices[treatment.id]?.price || ''}
                        onChange={(e) => handlePriceChange(treatment.id, e.target.value)}
                        disabled={!myServices[treatment.id]?.providesService}
                    />
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-6">
          <Button
            onClick={handleCompleteOnboarding}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </Button>
           <Button 
            variant="ghost"
            size="sm"
            onClick={() => toast({ title: 'Request Sent', description: 'Your request for a new service has been sent to the admin.'})}
        >
            Don't see a service you provide? Request to add it.
        </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
