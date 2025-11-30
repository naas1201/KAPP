'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp, deleteDoc, deleteField } from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  Plus,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { services } from '@/lib/data';

// Discount code types
type DiscountType = 'percentage' | 'fixed';
type CriteriaType = 'all' | 'service' | 'category' | 'minimum_amount' | 'returning_client';

interface DiscountCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: string;
  criteriaType: CriteriaType;
  // Criteria-specific fields
  serviceId?: string;
  categorySlug?: string;
  minimumAmount?: number;
  requiresReturningClient?: boolean;
  minAppointmentCount?: number; // For returning client criteria (e.g., applies after 1st booking)
  createdAt: any;
  updatedAt: any;
}

const defaultFormData = {
  code: '',
  discountType: 'percentage' as DiscountType,
  discountValue: 10,
  isActive: true,
  usageLimit: undefined as number | undefined,
  expiresAt: '',
  criteriaType: 'all' as CriteriaType,
  serviceId: '',
  categorySlug: '',
  minimumAmount: 0,
  requiresReturningClient: false,
  minAppointmentCount: 1,
};

export default function DiscountCodesPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // Fetch all discount codes
  const discountCodesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'discountCodes'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: discountCodes, isLoading: isLoadingCodes } = useCollection(discountCodesQuery);

  // Get all services for the dropdown
  const allServices = useMemo(() => {
    return services.flatMap(s => s.treatments.map(t => ({
      id: t.id,
      name: t.name,
      category: s.slug,
      categoryTitle: s.title
    })));
  }, []);

  // Get categories
  const categories = useMemo(() => {
    return services.map(s => ({
      slug: s.slug,
      title: s.title
    }));
  }, []);

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedCode(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (code: DiscountCode) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      isActive: code.isActive,
      usageLimit: code.usageLimit,
      expiresAt: code.expiresAt ? format(new Date(code.expiresAt), "yyyy-MM-dd'T'HH:mm") : '',
      criteriaType: code.criteriaType,
      serviceId: code.serviceId || '',
      categorySlug: code.categorySlug || '',
      minimumAmount: code.minimumAmount || 0,
      requiresReturningClient: code.requiresReturningClient || false,
      minAppointmentCount: code.minAppointmentCount || 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (code: DiscountCode) => {
    setSelectedCode(code);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a discount code.',
      });
      return false;
    }

    if (formData.discountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Discount value must be greater than 0.',
      });
      return false;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Percentage discount cannot exceed 100%.',
      });
      return false;
    }

    if (formData.criteriaType === 'service' && !formData.serviceId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a service for service-specific discount.',
      });
      return false;
    }

    if (formData.criteriaType === 'category' && !formData.categorySlug) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a category for category-specific discount.',
      });
      return false;
    }

    if (formData.criteriaType === 'minimum_amount' && formData.minimumAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Minimum amount must be greater than 0.',
      });
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!firestore || !validateForm()) return;

    try {
      const codeData: any = {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        isActive: formData.isActive,
        usageCount: 0,
        criteriaType: formData.criteriaType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (formData.usageLimit && formData.usageLimit > 0) {
        codeData.usageLimit = formData.usageLimit;
      }

      if (formData.expiresAt) {
        codeData.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      // Add criteria-specific fields
      if (formData.criteriaType === 'service') {
        codeData.serviceId = formData.serviceId;
      } else if (formData.criteriaType === 'category') {
        codeData.categorySlug = formData.categorySlug;
      } else if (formData.criteriaType === 'minimum_amount') {
        codeData.minimumAmount = formData.minimumAmount;
      } else if (formData.criteriaType === 'returning_client') {
        codeData.requiresReturningClient = true;
        codeData.minAppointmentCount = formData.minAppointmentCount;
      }

      const codesRef = collection(firestore, 'discountCodes');
      await addDocumentNonBlocking(codesRef, codeData);

      toast({
        title: 'Discount Code Created',
        description: `Code "${formData.code.toUpperCase()}" has been created successfully.`,
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create discount code. Please try again.',
      });
    }
  };

  const handleUpdate = async () => {
    if (!firestore || !selectedCode || !validateForm()) return;

    try {
      const codeRef = doc(firestore, 'discountCodes', selectedCode.id);
      const updateData: any = {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        isActive: formData.isActive,
        criteriaType: formData.criteriaType,
        updatedAt: serverTimestamp(),
      };

      if (formData.usageLimit && formData.usageLimit > 0) {
        updateData.usageLimit = formData.usageLimit;
      }

      if (formData.expiresAt) {
        updateData.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      // Add criteria-specific fields
      if (formData.criteriaType === 'service') {
        updateData.serviceId = formData.serviceId;
        // Clear other criteria fields
        updateData.categorySlug = deleteField();
        updateData.minimumAmount = deleteField();
        updateData.requiresReturningClient = deleteField();
        updateData.minAppointmentCount = deleteField();
      } else if (formData.criteriaType === 'category') {
        updateData.categorySlug = formData.categorySlug;
        updateData.serviceId = deleteField();
        updateData.minimumAmount = deleteField();
        updateData.requiresReturningClient = deleteField();
        updateData.minAppointmentCount = deleteField();
      } else if (formData.criteriaType === 'minimum_amount') {
        updateData.minimumAmount = formData.minimumAmount;
        updateData.serviceId = deleteField();
        updateData.categorySlug = deleteField();
        updateData.requiresReturningClient = deleteField();
        updateData.minAppointmentCount = deleteField();
      } else if (formData.criteriaType === 'returning_client') {
        updateData.requiresReturningClient = true;
        updateData.minAppointmentCount = formData.minAppointmentCount;
        updateData.serviceId = deleteField();
        updateData.categorySlug = deleteField();
        updateData.minimumAmount = deleteField();
      } else {
        // 'all' criteria - clear all specific fields
        updateData.serviceId = deleteField();
        updateData.categorySlug = deleteField();
        updateData.minimumAmount = deleteField();
        updateData.requiresReturningClient = deleteField();
        updateData.minAppointmentCount = deleteField();
      }

      await updateDocumentNonBlocking(codeRef, updateData);

      toast({
        title: 'Discount Code Updated',
        description: `Code "${formData.code.toUpperCase()}" has been updated successfully.`,
      });

      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update discount code. Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !selectedCode) return;

    try {
      const codeRef = doc(firestore, 'discountCodes', selectedCode.id);
      await deleteDoc(codeRef);

      toast({
        title: 'Discount Code Deleted',
        description: `Code "${selectedCode.code}" has been deleted.`,
      });

      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete discount code. Please try again.',
      });
    }
  };

  const getCriteriaDescription = (code: DiscountCode): string => {
    switch (code.criteriaType) {
      case 'service':
        const service = allServices.find(s => s.id === code.serviceId);
        return `Service: ${service?.name || 'Unknown'}`;
      case 'category':
        const category = categories.find(c => c.slug === code.categorySlug);
        return `Category: ${category?.title || 'Unknown'}`;
      case 'minimum_amount':
        return `Min. amount: ₱${code.minimumAmount?.toLocaleString()}`;
      case 'returning_client':
        return `Returning clients (${code.minAppointmentCount || 1}+ bookings)`;
      default:
        return 'All services';
    }
  };

  const isLoading = isUserLoading || isLoadingCodes;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderForm = () => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="code">Discount Code</Label>
          <Input
            id="code"
            placeholder="e.g., SUMMER20"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="uppercase"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Code will be automatically converted to uppercase.
          </p>
        </div>
        <div>
          <Label htmlFor="discountType">Discount Type</Label>
          <Select
            value={formData.discountType}
            onValueChange={(value: DiscountType) => setFormData({ ...formData, discountType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Percentage
                </div>
              </SelectItem>
              <SelectItem value="fixed">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Fixed Amount (₱)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue">
            {formData.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₱)'}
          </Label>
          <Input
            id="discountValue"
            type="number"
            min={0}
            max={formData.discountType === 'percentage' ? 100 : undefined}
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">Usage Limit (optional)</Label>
          <Input
            id="usageLimit"
            type="number"
            min={0}
            placeholder="No limit"
            value={formData.usageLimit || ''}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div>
          <Label htmlFor="criteriaType">Discount Criteria</Label>
          <Select
            value={formData.criteriaType}
            onValueChange={(value: CriteriaType) => setFormData({ ...formData, criteriaType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services (No restrictions)</SelectItem>
              <SelectItem value="service">Specific Service</SelectItem>
              <SelectItem value="category">Service Category</SelectItem>
              <SelectItem value="minimum_amount">Minimum Amount</SelectItem>
              <SelectItem value="returning_client">Returning Clients Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.criteriaType === 'service' && (
          <div>
            <Label htmlFor="serviceId">Select Service</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {allServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.categoryTitle})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.criteriaType === 'category' && (
          <div>
            <Label htmlFor="categorySlug">Select Category</Label>
            <Select
              value={formData.categorySlug}
              onValueChange={(value) => setFormData({ ...formData, categorySlug: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.criteriaType === 'minimum_amount' && (
          <div>
            <Label htmlFor="minimumAmount">Minimum Order Amount (₱)</Label>
            <Input
              id="minimumAmount"
              type="number"
              min={0}
              value={formData.minimumAmount}
              onChange={(e) => setFormData({ ...formData, minimumAmount: Number(e.target.value) })}
            />
          </div>
        )}

        {formData.criteriaType === 'returning_client' && (
          <div>
            <Label htmlFor="minAppointmentCount">Minimum Appointments Required</Label>
            <Input
              id="minAppointmentCount"
              type="number"
              min={1}
              value={formData.minAppointmentCount}
              onChange={(e) => setFormData({ ...formData, minAppointmentCount: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Client must have completed at least this many appointments to use this code.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Discount Codes</h1>
          <p className="text-muted-foreground">Manage promotional codes and discounts</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discount Codes</CardTitle>
          <CardDescription>
            Create and manage discount codes with various criteria. Codes cannot be stacked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!discountCodes || discountCodes.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No discount codes yet.</p>
                    <p className="text-sm">Create your first discount code to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                discountCodes.map((code: any) => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                  const isUsedUp = code.usageLimit && code.usageCount >= code.usageLimit;
                  const effectivelyActive = code.isActive && !isExpired && !isUsedUp;

                  return (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono font-semibold">{code.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {code.discountType === 'percentage' 
                            ? `${code.discountValue}%` 
                            : `₱${code.discountValue.toLocaleString()}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getCriteriaDescription(code)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {code.usageCount || 0}
                          {code.usageLimit && ` / ${code.usageLimit}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {effectivelyActive ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Expired
                          </Badge>
                        ) : isUsedUp ? (
                          <Badge variant="secondary">
                            Used Up
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenEdit(code)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleOpenDelete(code)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
            <DialogDescription>
              Create a new promotional discount code. Codes cannot be stacked with other discounts.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
            <DialogDescription>
              Update the discount code settings.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Discount Code
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this discount code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCode && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="font-mono font-semibold">{selectedCode.code}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCode.discountType === 'percentage' 
                  ? `${selectedCode.discountValue}% off` 
                  : `₱${selectedCode.discountValue.toLocaleString()} off`}
              </p>
              <p className="text-sm text-muted-foreground">
                Used {selectedCode.usageCount || 0} times
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
