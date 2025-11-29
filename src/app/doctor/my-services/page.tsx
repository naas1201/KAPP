
'use client';

import { useState, useEffect } from 'react';
import {
  useCollection,
  useFirebase,
  setDocumentNonBlocking,
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
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useMemoFirebase } from '@/firebase/hooks';

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

export default function MyServicesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const treatmentsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'treatments') : null), [firestore]);
  const { data: allTreatments, isLoading: isLoadingTreatments } = useCollection<Treatment>(treatmentsRef);

  const doctorServicesRef = useMemoFirebase(() => (user ? collection(firestore, 'doctors', user.uid, 'services') : null), [user, firestore]);
  const { data: myServicesData, isLoading: isLoadingMyServices } = useCollection(doctorServicesRef);

  const [myServices, setMyServices] = useState<DoctorServicesState>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (myServicesData) {
      const initialServices = myServicesData.reduce((acc, service: any) => {
        acc[service.id] = {
          price: service.price || 0,
          providesService: service.providesService,
        };
        return acc;
      }, {} as DoctorServicesState);
      setMyServices(initialServices);
    }
  }, [myServicesData]);

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
  
  const handleSave = async () => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const promises = Object.entries(myServices).map(([treatmentId, serviceData]) => {
      const serviceRef = doc(firestore, 'doctors', user.uid, 'services', treatmentId);
      return setDocumentNonBlocking(serviceRef, {
        treatmentId: treatmentId,
        providesService: serviceData.providesService,
        price: serviceData.providesService ? serviceData.price : 0,
      }, { merge: true });
    });

    await Promise.all(promises);

    toast({ title: 'Your services have been updated successfully.' });
    setIsSaving(false);
  };

  const hasNewTreatments = allTreatments?.some(t => !myServices.hasOwnProperty(t.id));

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-2">My Services</h1>
      <p className="text-muted-foreground mb-6">
        Select the services you provide and set your prices.
      </p>

      {hasNewTreatments && (
        <Alert className="mb-6 bg-primary/10 border-primary/20 text-primary-foreground">
          <Info className="h-4 w-4 !text-primary" />
          <AlertTitle className="!text-primary font-semibold">New Procedures Available</AlertTitle>
          <AlertDescription className="!text-primary/80">
            The clinic has added new procedures. Please review the list below and update your offerings.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          {isLoadingTreatments || isLoadingMyServices ? (
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
                     <p className="text-sm text-muted-foreground font-normal">{treatment.description}</p>
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
      </Card>
      
      <div className="mt-6 flex justify-end gap-4">
        <Button 
            variant="outline"
            onClick={() => toast({ title: 'Request Sent', description: 'Your request for a new service has been sent to the admin.'})}
        >
            Request New Service
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save My Services'}
        </Button>
      </div>
    </div>
  );
}
