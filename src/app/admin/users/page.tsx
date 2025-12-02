
'use client';

import { useState, useMemo, useEffect } from 'react';
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
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Trash2, Search, Edit2, ChevronLeft, ChevronRight, UserCheck, Clock, AlertCircle } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type UserRole = 'admin' | 'doctor' | 'patient';

interface User {
  id: string;
  email: string;
  role: UserRole;
  staffId?: string;
  accessCode?: string;
  name?: string;
}

interface PendingStaff {
  id: string;
  email: string;
  role: UserRole;
  staffId?: string;
  accessCode?: string;
  name?: string;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  // User states
  const [userToDelete, setUserToDelete] = useState<{ id: string; type: 'user' | 'pending' } | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToUpgrade, setUserToUpgrade] = useState<User | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('patient');
  const [upgradeRoleValue, setUpgradeRoleValue] = useState<UserRole>('doctor');
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
  const [activeTab, setActiveTab] = useState('active');

  // Fetch active users from Firestore (these have UIDs as document IDs)
  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersRef);

  // Fetch pending staff invites
  const pendingStaffRef = useMemoFirebase(() => (firestore ? collection(firestore, 'pendingStaff') : null), [firestore]);
  const { data: pendingStaff, isLoading: isLoadingPending } = useCollection<PendingStaff>(pendingStaffRef);

  const isLoading = isLoadingUsers || isLoadingPending;

  // Filter users based on search query and active tab
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    
    const queryLower = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.email?.toLowerCase().includes(queryLower) ||
      user.role?.toLowerCase().includes(queryLower) ||
      user.name?.toLowerCase().includes(queryLower)
    );
  }, [users, searchQuery]);

  const filteredPending = useMemo(() => {
    if (!pendingStaff) return [];
    if (!searchQuery.trim()) return pendingStaff;
    
    const queryLower = searchQuery.toLowerCase().trim();
    return pendingStaff.filter(staff => 
      staff.email?.toLowerCase().includes(queryLower) ||
      staff.role?.toLowerCase().includes(queryLower) ||
      staff.name?.toLowerCase().includes(queryLower)
    );
  }, [pendingStaff, searchQuery]);

  // Get current data based on active tab
  const currentData = activeTab === 'active' ? filteredUsers : filteredPending;

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentData, currentPage]);

  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search or tab changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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

  const handleInviteStaff = async () => {
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

    const normalizedEmail = userDetails.email.toLowerCase().trim();

    // Check if user already exists in users collection
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail);
    if (existingUser) {
      toast({
        variant: 'destructive',
        title: 'User already exists',
        description: 'This email is already registered. Use "Upgrade Existing User" to change their role.',
      });
      return;
    }

    // Check if already pending
    const existingPending = pendingStaff?.find(p => p.email?.toLowerCase() === normalizedEmail);
    if (existingPending) {
      toast({
        variant: 'destructive',
        title: 'Invite already pending',
        description: 'This email already has a pending staff invite.',
      });
      return;
    }

    // Create pending staff invite
    const pendingStaffDocRef = doc(firestore, 'pendingStaff', normalizedEmail);
    const pendingData: Record<string, string> = { 
      email: normalizedEmail,
      role: userDetails.role,
      createdAt: new Date().toISOString(),
    };
    
    if (userDetails.staffId.trim()) {
      pendingData.staffId = userDetails.staffId.toLowerCase().trim();
    }

    if (userDetails.accessCode.trim()) {
      pendingData.accessCode = userDetails.accessCode.trim();
    }

    if (userDetails.name.trim()) {
      pendingData.name = userDetails.name.trim();
    }
    
    setDocumentNonBlocking(pendingStaffDocRef, pendingData, {});

    // Also create staffCredentials document for staff members
    if (userDetails.role === 'admin' || userDetails.role === 'doctor') {
      const staffCredentialsRef = doc(firestore, 'staffCredentials', normalizedEmail);
      const credentialData: Record<string, string> = {
        email: normalizedEmail,
        role: userDetails.role,
        accessCode: userDetails.accessCode.trim(),
        status: 'pending',
      };
      if (userDetails.name.trim()) {
        credentialData.name = userDetails.name.trim();
      }
      setDocumentNonBlocking(staffCredentialsRef, credentialData, {});
    }

    toast({ 
      title: 'Staff Invite Created', 
      description: `${userDetails.email} has been invited as ${userDetails.role}. They need to sign up to activate their account.` 
    });
    
    setModalOpen(false);
    resetForm();
  };

  const handleOpenUpgradeModal = (user: User) => {
    setUserToUpgrade(user);
    setUpgradeRoleValue(user.role === 'patient' ? 'doctor' : user.role);
    setUpgradeModalOpen(true);
  };

  const handleUpgradeUser = () => {
    if (!firestore || !userToUpgrade) return;
    
    // Update the user document with new role
    const userDocRef = doc(firestore, 'users', userToUpgrade.id);
    updateDocumentNonBlocking(userDocRef, { role: upgradeRoleValue });

    // If upgrading to staff, create staffCredentials
    if (upgradeRoleValue === 'admin' || upgradeRoleValue === 'doctor') {
      const email = userToUpgrade.email.toLowerCase();
      const staffCredentialsRef = doc(firestore, 'staffCredentials', email);
      setDocumentNonBlocking(staffCredentialsRef, {
        email,
        role: upgradeRoleValue,
        uid: userToUpgrade.id,
        name: userToUpgrade.name || '',
      }, { merge: true });
    }

    toast({ 
      title: 'User Role Updated', 
      description: `${userToUpgrade.email} is now a ${upgradeRoleValue}.` 
    });
    
    setUpgradeModalOpen(false);
    setUserToUpgrade(null);
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
      // Update user document using the ID (UID)
      const userDocRef = doc(firestore, 'users', userToEdit.id);
      updateDocumentNonBlocking(userDocRef, { role: editRoleValue });

      // Update or create staffCredentials if promoting to staff
      if (editRoleValue === 'admin' || editRoleValue === 'doctor') {
        const email = userToEdit.email.toLowerCase();
        const staffCredentialsRef = doc(firestore, 'staffCredentials', email);
        setDocumentNonBlocking(staffCredentialsRef, {
          email,
          role: editRoleValue,
          uid: userToEdit.id,
          name: userToEdit.name || '',
        }, { merge: true });
      } else if (userToEdit.email) {
        // Remove from staffCredentials if demoting from staff
        const staffCredentialsRef = doc(firestore, 'staffCredentials', userToEdit.email.toLowerCase());
        deleteDocumentNonBlocking(staffCredentialsRef);
      }

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

  const handleDelete = (id: string, type: 'user' | 'pending') => {
    setUserToDelete({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;
    
    if (userToDelete.type === 'user') {
      // Delete active user
      const userDocRef = doc(firestore, 'users', userToDelete.id);
      deleteDocumentNonBlocking(userDocRef);
      
      // Also delete from staffCredentials if exists
      const user = users?.find(u => u.id === userToDelete.id);
      if (user?.email) {
        const staffCredentialsRef = doc(firestore, 'staffCredentials', user.email.toLowerCase());
        deleteDocumentNonBlocking(staffCredentialsRef);
      }
    } else {
      // Delete pending invite
      const pendingDocRef = doc(firestore, 'pendingStaff', userToDelete.id);
      deleteDocumentNonBlocking(pendingDocRef);
      
      // Also delete from staffCredentials
      const staffCredentialsRef = doc(firestore, 'staffCredentials', userToDelete.id);
      deleteDocumentNonBlocking(staffCredentialsRef);
    }
    
    toast({ title: userToDelete.type === 'user' ? 'User removed.' : 'Invite cancelled.', variant: 'destructive' });
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
            Manage staff roles, pending invites, and user permissions.
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <PlusCircle className="w-4 h-4 mr-2" /> Invite Staff
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Invite staff by email → They sign up with that email → They get the assigned role automatically. 
          You can also upgrade existing patients to staff roles.
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, role, or name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Active Users vs Pending Invites */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Active Users ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Invites ({pendingStaff?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>
                Users who have signed up and have active accounts. You can change their roles here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No users found matching your search.' : 'No active users found.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === 'active' && paginatedData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{(user as User).email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(user as User).name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant((user as User).role)} className="capitalize">
                          {(user as User).role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user as User)}
                          title="Edit Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user.id, 'user')}
                          title="Delete User"
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
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Staff Invites</CardTitle>
              <CardDescription>
                Staff invites waiting for users to sign up. Once they create an account with the invited email, they'll automatically get the assigned role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No pending invites found matching your search.' : 'No pending invites. Click "Invite Staff" to add one.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === 'pending' && paginatedData.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{(staff as PendingStaff).email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(staff as PendingStaff).name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant((staff as PendingStaff).role)} className="capitalize">
                          {(staff as PendingStaff).role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(staff as PendingStaff).accessCode || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(staff.id, 'pending')}
                          title="Cancel Invite"
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
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, currentData.length)} of {currentData.length} items
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

      {/* Invite Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Staff</DialogTitle>
            <DialogDescription>
              Enter the staff member's email and assign them a role. They'll need to sign up with this email to activate their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="staff@example.com"
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
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
                  placeholder="Access Code (required)"
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
                Share this access code securely with the staff member. They'll use it to log in at /staff/login after signing up.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteStaff}>Send Invite</Button>
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

      {/* Upgrade User Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade User to Staff</DialogTitle>
            <DialogDescription>
              Upgrade {userToUpgrade?.email} to a staff role
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={upgradeRoleValue}
              onValueChange={(value: UserRole) => setUpgradeRoleValue(value)}
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
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgradeUser}>
              Upgrade User
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
              {userToDelete?.type === 'user' 
                ? 'Are you sure you want to remove this user? This will revoke their access to the system. This action cannot be undone.'
                : 'Are you sure you want to cancel this pending invite? The person will not be able to sign up with this role.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {userToDelete?.type === 'user' ? 'Delete User' : 'Cancel Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
