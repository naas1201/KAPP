
'use client';

import { useState, useMemo } from 'react';
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
} from '@/components/ui/card';
import { PlusCircle, Trash2, Search, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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

type UserRole = 'admin' | 'doctor' | 'patient';

interface User {
  id: string;
  email: string;
  role: UserRole;
  staffId?: string;
  accessCode?: string;
  name?: string;
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  // User states
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('patient');
  const [userDetails, setUserDetails] = useState({
    email: '',
    role: 'doctor' as UserRole,
    staffId: '',
    accessCode: '',
    name: '',
  });

  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersRef);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setUserDetails({ email: '', role: 'doctor', staffId: '', accessCode: '', name: '' });
  };

  // Generate a cryptographically secure random access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(array[i] % chars.length);
    }
    setUserDetails({ ...userDetails, accessCode: code });
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

    // Require access code for staff members
    if ((userDetails.role === 'admin' || userDetails.role === 'doctor') && !userDetails.accessCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Access code is required for staff members.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = users?.find(u => u.email.toLowerCase() === userDetails.email.toLowerCase());
    if (existingUser) {
      toast({
        variant: 'destructive',
        title: 'User already exists',
        description: 'This email is already registered in the system.',
      });
      return;
    }

    const normalizedEmail = userDetails.email.toLowerCase().trim();
    const userDocRef = doc(firestore, 'users', normalizedEmail);
    const userData: any = { 
      email: normalizedEmail,
      role: userDetails.role 
    };
    
    // Add staffId for admin and doctor roles
    if ((userDetails.role === 'admin' || userDetails.role === 'doctor') && userDetails.staffId.trim()) {
      userData.staffId = userDetails.staffId.toLowerCase().trim();
    }

    // Add access code for staff members
    if ((userDetails.role === 'admin' || userDetails.role === 'doctor') && userDetails.accessCode.trim()) {
      userData.accessCode = userDetails.accessCode.trim();
    }

    // Add name if provided
    if (userDetails.name.trim()) {
      userData.name = userDetails.name.trim();
    }
    
    setDocumentNonBlocking(userDocRef, userData, {});

    toast({ 
      title: 'User Added', 
      description: `${userDetails.email} has been added as a ${userDetails.role}. Share the access code securely.` 
    });
    
    setModalOpen(false);
    resetForm();
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setEditRoleValue(user.role);
    setEditModalOpen(true);
  };

  const handleUpdateRole = () => {
    if (!firestore || !userToEdit || !editRoleValue) return;
    if (editRoleValue === userToEdit.role) {
      setEditModalOpen(false);
      setUserToEdit(null);
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', userToEdit.email);
      updateDocumentNonBlocking(userDocRef, { role: editRoleValue });

      toast({ 
        title: 'Role Updated', 
        description: `${userToEdit.email} is now a ${editRoleValue}.` 
      });
    } catch (error) {
      toast({ 
        variant: 'destructive',
        title: 'Failed to Update Role', 
        description: 'An error occurred while updating the role. Please try again.' 
      });
    }
    
    setEditModalOpen(false);
    setUserToEdit(null);
  };

  const handleDelete = (email: string) => {
    setUserToDelete(email);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;
    const userDocRef = doc(firestore, 'users', userToDelete);
    deleteDocumentNonBlocking(userDocRef);
    toast({ title: 'User removed.', variant: 'destructive' });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'default';
      case 'doctor': return 'secondary';
      case 'patient': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage staff roles and permissions.
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or role..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No users found matching your search.' : 'No users found. Add your first user to get started.'}
                  </TableCell>
                </TableRow>
              )}
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.staffId || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the user's email and assign them a role. Staff members (admin/doctor) will need an access code to log in.
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
            <Input
              placeholder="Display Name (optional)"
              type="text"
              value={userDetails.name}
              onChange={(e) =>
                setUserDetails({ ...userDetails, name: e.target.value })
              }
            />
             <Select
              value={userDetails.role}
              onValueChange={(value: UserRole) => setUserDetails({ ...userDetails, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {(userDetails.role === 'admin' || userDetails.role === 'doctor') && (
              <>
                <Input
                  placeholder="Staff ID (optional, e.g., admin1 or doc123)"
                  type="text"
                  value={userDetails.staffId}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, staffId: e.target.value })
                  }
                />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Access Code (required for staff login)"
                      type="text"
                      value={userDetails.accessCode}
                      onChange={(e) =>
                        setUserDetails({ ...userDetails, accessCode: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateAccessCode}>
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This code will be used for staff to log in at /staff/login
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {userToEdit?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={editRoleValue}
              onValueChange={(value: UserRole) => setEditRoleValue(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToDelete}? This will revoke their role-based access to the system. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
