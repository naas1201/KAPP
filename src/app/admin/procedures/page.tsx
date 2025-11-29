
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Treatment {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function ProceduresPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<string | null>(null);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(
    null
  );
  const [treatmentDetails, setTreatmentDetails] = useState({
    name: '',
    description: '',
    category: 'Aesthetic',
  });

  const treatmentsRef = collection(firestore, 'treatments');
  const { data: treatments, isLoading } = useCollection<Treatment>(
    treatmentsRef
  );

  const resetForm = () => {
    setEditingTreatment(null);
    setTreatmentDetails({ name: '', description: '', category: 'Aesthetic' });
  };

  const handleOpenModal = (treatment: Treatment | null = null) => {
    if (treatment) {
      setEditingTreatment(treatment);
      setTreatmentDetails({
        name: treatment.name,
        description: treatment.description,
        category: treatment.category,
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!firestore) return;

    if (editingTreatment) {
      const treatmentRef = doc(firestore, 'treatments', editingTreatment.id);
      updateDocumentNonBlocking(treatmentRef, treatmentDetails);
      toast({ title: 'Procedure updated successfully.' });
    } else {
      addDocumentNonBlocking(treatmentsRef, treatmentDetails);
      toast({ title: 'New procedure added.' });
    }
    setModalOpen(false);
    resetForm();
  };
  
  const handleDelete = (treatmentId: string) => {
    setTreatmentToDelete(treatmentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !treatmentToDelete) return;
    const treatmentRef = doc(firestore, 'treatments', treatmentToDelete);
    deleteDocumentNonBlocking(treatmentRef);
    toast({ title: 'Procedure deleted.', variant: 'destructive' });
    setIsDeleteDialogOpen(false);
    setTreatmentToDelete(null);
  };


  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            Procedure Management
          </h1>
          <p className="text-muted-foreground">
            Add, edit, or remove clinic treatments.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Procedure
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedure Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {treatments?.map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell className="font-medium">{treatment.name}</TableCell>
                  <TableCell>{treatment.category}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-sm truncate">{treatment.description}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(treatment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                     <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(treatment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'Edit Procedure' : 'Add New Procedure'}
            </DialogTitle>
            <DialogDescription>
              {editingTreatment
                ? 'Update the details for this procedure.'
                : 'Add a new treatment to the master list.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Procedure Name (e.g., Breast Augmentation)"
              value={treatmentDetails.name}
              onChange={(e) =>
                setTreatmentDetails({ ...treatmentDetails, name: e.target.value })
              }
            />
             <Select
              value={treatmentDetails.category}
              onValueChange={(value) => setTreatmentDetails({ ...treatmentDetails, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aesthetic">Aesthetic</SelectItem>
                <SelectItem value="General Medicine">General Medicine</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Description of the procedure..."
              rows={4}
              value={treatmentDetails.description}
              onChange={(e) =>
                setTreatmentDetails({
                  ...treatmentDetails,
                  description: e.target.value,
                })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Procedure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this procedure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Procedure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
