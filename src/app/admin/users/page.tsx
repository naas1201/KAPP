
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor';
}

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [isModalOpen, setModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({
    email: '',
    role: 'doctor' as 'admin' | 'doctor',
  });

  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersRef);

  const resetForm = () => {
    setUserDetails({ email: '', role: 'doctor' });
  };

  const handleOpenModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleInvite = () => {
    if (!firestore || !userDetails.email) {
      toast({
        variant: 'destructive',
        title: 'Email is required.',
      });
      return;
    }

    // In a real app, this would trigger a cloud function to create an auth user.
    // For this prototype, we'll create a user document that pre-assigns the role.
    // The user will then need to sign up with this exact email.
    
    // We use the email as the document ID to easily query it later.
    // NOTE: This is not a secure way to do this in production. For prototyping only.
    const userDocRef = doc(firestore, 'users', userDetails.email);

    setDocumentNonBlocking(userDocRef, userDetails, {});

    toast({ title: 'Invitation Sent', description: `${userDetails.email} has been invited as a ${userDetails.role}. They can now sign up.` });
    
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (email: string) => {
    if (!firestore) return;
    if (window.confirm(`Are you sure you want to remove ${email}? This will revoke their access.`)) {
        const userDocRef = doc(firestore, 'users', email);
        deleteDocumentNonBlocking(userDocRef);
        toast({ title: 'User removed.', variant: 'destructive' });
    }
  };


  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Invite and manage staff and doctors.
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <PlusCircle className="w-4 h-4 mr-2" /> Invite User
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                     <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.email)}
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
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Enter the user's email and assign them a role. They will be able to sign up and access the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="user@example.com"
              type="email"
              value={userDetails.email}
              onChange={(e) =>
                setUserDetails({ ...userDetails, email: e.target.value })
              }
            />
             <Select
              value={userDetails.role}
              onValueChange={(value: 'admin' | 'doctor') => setUserDetails({ ...userDetails, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
