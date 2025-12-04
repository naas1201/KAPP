
'use client';

import { useState, useEffect } from 'react';
import {
  useCollection,
  useFirebase,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Info, Plus, Edit, Trash2, Check, X, Sparkles, Stethoscope } from 'lucide-react';
import { useMemoFirebase } from '@/firebase/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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

interface CustomService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isCustom: boolean;
  createdAt: string;
  createdBy: string;
}

type DoctorServicesState = Record<string, DoctorService>;

export default function MyServicesPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [isAddServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setEditServiceModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<CustomService | null>(null);
  const [editingService, setEditingService] = useState<CustomService | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Aesthetic',
    price: 0,
  });
  
  const treatmentsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'treatments') : null), [firestore]);
  const { data: allTreatments, isLoading: isLoadingTreatments } = useCollection<Treatment>(treatmentsRef);

  const doctorServicesRef = useMemoFirebase(() => (user && firestore ? collection(firestore, 'doctors', user.uid, 'services') : null), [user, firestore]);
  const { data: myServicesData, isLoading: isLoadingMyServices } = useCollection(doctorServicesRef);

  // Custom services created by this doctor
  const customServicesRef = useMemoFirebase(() => (user && firestore ? collection(firestore, 'doctors', user.uid, 'customServices') : null), [user, firestore]);
  const { data: customServices, isLoading: isLoadingCustomServices } = useCollection<CustomService>(customServicesRef);

  const [myServices, setMyServices] = useState<DoctorServicesState>({});
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (allTreatments) {
      setMyServices((prev) => {
        const updated = { ...prev };
        allTreatments.forEach((treatment: Treatment) => {
          if (!Object.prototype.hasOwnProperty.call(updated, treatment.id)) {
            updated[treatment.id] = {
              price: 0,
              providesService: false,
            };
          }
        });
        return updated;
      });
    }
  }, [allTreatments]);

  useEffect(() => {
    if (myServicesData) {
      const initialServices = myServicesData.reduce((acc, service: any) => {
        acc[service.id] = {
          price: service.price || 0,
          providesService: service.providesService,
        };
        return acc;
      }, {} as DoctorServicesState);
      setMyServices((prev) => ({ ...prev, ...initialServices }));
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
    
    try {
      const promises = Object.entries(myServices).map(([treatmentId, serviceData]) => {
        const serviceRef = doc(firestore, 'doctors', user.uid, 'services', treatmentId);
        return setDocumentNonBlocking(serviceRef, {
          treatmentId: treatmentId,
          providesService: serviceData.providesService,
          price: serviceData.providesService ? serviceData.price : 0,
        }, { merge: true });
      });

      await Promise.all(promises);

      // Update gamification data for doctor
      const doctorRef = doc(firestore, 'doctors', user.uid);
      updateDocumentNonBlocking(doctorRef, {
        'gamification.servicesUpdatedAt': serverTimestamp(),
        'gamification.servicesConfigured': Object.values(myServices).filter(s => s.providesService).length
      });

      toast({ 
        title: 'Services Updated', 
        description: 'Your services have been saved successfully.' 
      });
      // Merge saved services into local state to reflect immediately
      setMyServices((prev) => {
        const updated = { ...prev };
        Object.entries(myServices).forEach(([tId, svc]) => {
          updated[tId] = {
            price: svc.price || 0,
            providesService: svc.providesService || false,
          };
        });
        return updated;
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update your services. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add custom service
  const handleAddCustomService = async () => {
    if (!firestore || !user || !newService.name.trim()) return;
    
    try {
      const customServiceRef = collection(firestore, 'doctors', user.uid, 'customServices');
      await addDocumentNonBlocking(customServiceRef, {
        ...newService,
        isCustom: true,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });
      
      toast({ title: 'Custom Service Added', description: `"${newService.name}" has been added to your services.` });
      setAddServiceModalOpen(false);
      setNewService({ name: '', description: '', category: 'Aesthetic', price: 0 });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add custom service.' });
    }
  };

  // Edit custom service
  const handleEditCustomService = async () => {
    if (!firestore || !user || !editingService) return;
    
    try {
      const serviceRef = doc(firestore, 'doctors', user.uid, 'customServices', editingService.id);
      updateDocumentNonBlocking(serviceRef, {
        name: editingService.name,
        description: editingService.description,
        category: editingService.category,
        price: editingService.price,
        updatedAt: new Date().toISOString(),
      });
      
      toast({ title: 'Service Updated', description: 'Your custom service has been updated.' });
      setEditServiceModalOpen(false);
      setEditingService(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update service.' });
    }
  };

  // Delete custom service
  const handleDeleteCustomService = () => {
    if (!firestore || !user || !serviceToDelete) return;
    
    try {
      const serviceRef = doc(firestore, 'doctors', user.uid, 'customServices', serviceToDelete.id);
      deleteDocumentNonBlocking(serviceRef);
      
      toast({ title: 'Service Deleted', description: 'Your custom service has been removed.' });
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete service.' });
    }
  };

  const hasNewTreatments = allTreatments?.some(t => !Object.prototype.hasOwnProperty.call(myServices, t.id));
  
  const servicesProvided = Object.values(myServices).filter(s => s.providesService).length;
  const customServicesCount = customServices?.length || 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">My Services</h1>
          <p className="text-muted-foreground">
            Manage services you provide and set your own prices.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <div className="font-semibold">{servicesProvided + customServicesCount} Services Active</div>
            <div className="text-muted-foreground text-xs">{customServicesCount} custom services</div>
          </div>
          <Button onClick={() => setAddServiceModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {hasNewTreatments && (
        <Alert className="mb-6 bg-primary/10 border-primary/20 text-primary-foreground">
          <Info className="h-4 w-4 !text-primary" />
          <AlertTitle className="!text-primary font-semibold">New Procedures Available</AlertTitle>
          <AlertDescription className="!text-primary/80">
            The clinic has added new procedures. Please review the list below and update your offerings.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clinic">Clinic Services</TabsTrigger>
          <TabsTrigger value="custom">My Custom Services ({customServicesCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Services</CardTitle>
              <CardDescription>
                Toggle services you provide and set your prices. Patients will be able to book these services with you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingTreatments || isLoadingMyServices ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-6 w-10" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                ))
              ) : !allTreatments || allTreatments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg mb-2">No Clinic Services Available</h3>
                  <p className="text-sm max-w-md mx-auto mb-4">
                    The clinic hasn't added any procedures yet. Please contact your clinic administrator 
                    to set up services in the Admin Panel → Procedures page.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    In the meantime, you can add custom services below using the "My Custom Services" tab.
                  </p>
                </div>
              ) : (
                allTreatments?.map((treatment) => {
                  const isProviding = myServices[treatment.id]?.providesService || false;
                  return (
                    <div
                      key={treatment.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 transition-colors ${isProviding ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-start gap-4">
                        <Switch
                          data-testid={`service-toggle-${treatment.id}`}
                          id={`service-${treatment.id}`}
                          checked={isProviding}
                          onCheckedChange={(checked) =>
                            handleProvidesServiceChange(treatment.id, checked)
                          }
                        />
                        <div>
                          <label htmlFor={`service-${treatment.id}`} className="font-medium cursor-pointer flex items-center gap-2">
                            {treatment.name}
                            <Badge variant="outline" className="text-xs">{treatment.category}</Badge>
                          </label>
                          <p className="text-sm text-muted-foreground font-normal mt-1">{treatment.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto pl-12 sm:pl-0">
                        <span className="text-muted-foreground">₱</span>
                        <Input
                          data-testid={`service-price-${treatment.id}`}
                          type="number"
                          placeholder="Your price"
                          className="w-full sm:w-32"
                          value={myServices[treatment.id]?.price || ''}
                          onChange={(e) => handlePriceChange(treatment.id, e.target.value)}
                          disabled={!isProviding}
                        />
                        {isProviding && (
                          <Badge variant="default" className="ml-2">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={() => toast({ title: 'Request Sent', description: 'Your request for a new clinic service has been sent to the admin.'})}>
              Request New Clinic Service
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                My Custom Services
              </CardTitle>
              <CardDescription>
                Services you've created with your own pricing. These are unique to your practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCustomServices ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-md mb-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : customServices && customServices.length > 0 ? (
                <div className="space-y-4">
                  {customServices.map((service) => (
                    <div key={service.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="secondary">{service.category}</Badge>
                          <Badge variant="outline" className="border-primary/50 text-primary">Custom</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        <p className="text-lg font-semibold text-primary mt-2">₱{service.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setEditingService(service); setEditServiceModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setServiceToDelete(service); setDeleteConfirmOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/30" />
                  <p className="text-lg font-medium mb-2">No custom services yet</p>
                  <p className="text-sm mb-4">Create your own services with custom pricing.</p>
                  <Button onClick={() => setAddServiceModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Custom Service Dialog */}
      <Dialog open={isAddServiceModalOpen} onOpenChange={setAddServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Service</DialogTitle>
            <DialogDescription>
              Create a new service with your own pricing. This will be available for patients to book.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                placeholder="e.g., Premium Skin Consultation"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Category</Label>
              <Select
                value={newService.category}
                onValueChange={(value) => setNewService({ ...newService, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aesthetic">Aesthetic</SelectItem>
                  <SelectItem value="General Medicine">General Medicine</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Describe the service..."
                rows={3}
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicePrice">Price (₱)</Label>
              <Input
                id="servicePrice"
                type="number"
                placeholder="0"
                value={newService.price || ''}
                onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddCustomService} disabled={!newService.name.trim()}>
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Custom Service Dialog */}
      <Dialog open={isEditServiceModalOpen} onOpenChange={setEditServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Custom Service</DialogTitle>
            <DialogDescription>
              Update your custom service details.
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editServiceName">Service Name</Label>
                <Input
                  id="editServiceName"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceCategory">Category</Label>
                <Select
                  value={editingService.category}
                  onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aesthetic">Aesthetic</SelectItem>
                    <SelectItem value="General Medicine">General Medicine</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceDescription">Description</Label>
                <Textarea
                  id="editServiceDescription"
                  rows={3}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServicePrice">Price (₱)</Label>
                <Input
                  id="editServicePrice"
                  type="number"
                  value={editingService.price || ''}
                  onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditCustomService}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{serviceToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteCustomService}>
              Delete Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
