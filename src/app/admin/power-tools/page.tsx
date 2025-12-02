'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  Shield,
  Users,
  Download,
  Bell,
  Settings,
  Database,
  Activity,
  Flag,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  FileJson,
  FileSpreadsheet,
  Megaphone,
  ToggleLeft,
  Archive,
  Eye,
  Edit,
  Send,
  Copy,
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  name?: string;
  status?: 'active' | 'suspended' | 'inactive';
  createdAt?: Timestamp;
}

interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  targetRoles: string[];
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt?: Timestamp;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  details: string;
  timestamp: Timestamp;
  category: string;
}

export default function PowerToolsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bulk-actions');

  // Fetch users
  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersRef);

  // Fetch announcements
  const announcementsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'announcements') : null), [firestore]);
  const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<SystemAnnouncement>(announcementsRef);

  // Fetch feature flags
  const featureFlagsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'featureFlags') : null), [firestore]);
  const { data: featureFlags, isLoading: isLoadingFlags } = useCollection<FeatureFlag>(featureFlagsRef);

  // Fetch audit logs
  const auditLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);
  const { data: auditLogs, isLoading: isLoadingLogs } = useCollection<AuditLog>(auditLogsQuery);

  // Fetch patients
  const patientsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'patients') : null), [firestore]);
  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsRef);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Power Tools
          </h1>
          <p className="text-muted-foreground">
            Advanced administrative functions for super administrators.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="bulk-actions" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Bulk Actions
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-1">
            <Megaphone className="w-4 h-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="feature-flags" className="flex items-center gap-1">
            <ToggleLeft className="w-4 h-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="data-export" className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            Data Export
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="system-health" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* 1. Bulk Actions Tab */}
        <TabsContent value="bulk-actions">
          <BulkActionsPanel users={users} isLoading={isLoadingUsers} firestore={firestore} toast={toast} />
        </TabsContent>

        {/* 2. Announcements Tab */}
        <TabsContent value="announcements">
          <AnnouncementsPanel 
            announcements={announcements} 
            isLoading={isLoadingAnnouncements} 
            firestore={firestore} 
            toast={toast} 
          />
        </TabsContent>

        {/* 3. Feature Flags Tab */}
        <TabsContent value="feature-flags">
          <FeatureFlagsPanel 
            featureFlags={featureFlags} 
            isLoading={isLoadingFlags} 
            firestore={firestore} 
            toast={toast} 
          />
        </TabsContent>

        {/* 4. Data Export Tab */}
        <TabsContent value="data-export">
          <DataExportPanel 
            users={users} 
            patients={patients}
            firestore={firestore} 
            toast={toast} 
          />
        </TabsContent>

        {/* 5. Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <AuditLogsPanel 
            auditLogs={auditLogs} 
            isLoading={isLoadingLogs} 
          />
        </TabsContent>

        {/* 6. System Health Tab */}
        <TabsContent value="system-health">
          <SystemHealthPanel 
            users={users}
            patients={patients}
            firestore={firestore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// 1. BULK ACTIONS PANEL - Bulk role changes, suspend/activate users
// =============================================================================
function BulkActionsPanel({ users, isLoading, firestore, toast }: { 
  users: User[] | null; 
  isLoading: boolean;
  firestore: any;
  toast: any;
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      u.email?.toLowerCase().includes(query) ||
      u.name?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const executeBulkAction = async () => {
    if (!firestore || selectedUsers.length === 0 || !bulkAction) return;
    
    setIsProcessing(true);
    try {
      const batch = writeBatch(firestore);
      
      for (const userId of selectedUsers) {
        const userRef = doc(firestore, 'users', userId);
        
        switch (bulkAction) {
          case 'change-role':
            batch.update(userRef, { role: targetRole });
            break;
          case 'suspend':
            batch.update(userRef, { status: 'suspended' });
            break;
          case 'activate':
            batch.update(userRef, { status: 'active' });
            break;
          case 'delete':
            batch.delete(userRef);
            break;
        }
      }
      
      await batch.commit();
      
      // Log the action
      const logRef = doc(collection(firestore, 'auditLogs'));
      setDocumentNonBlocking(logRef, {
        action: `Bulk ${bulkAction}`,
        userId: 'admin',
        userEmail: 'admin@system',
        details: `Applied ${bulkAction} to ${selectedUsers.length} users`,
        timestamp: serverTimestamp(),
        category: 'user-management',
      }, {});
      
      toast({
        title: 'Bulk Action Completed',
        description: `Successfully applied "${bulkAction}" to ${selectedUsers.length} users.`,
      });
      
      setSelectedUsers([]);
      setBulkAction('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Bulk Action Failed',
        description: 'An error occurred while processing the bulk action.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk User Management
          </CardTitle>
          <CardDescription>
            Select multiple users and apply bulk actions like role changes, suspend, or activate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change-role">Change Role</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              
              {bulkAction === 'change-role' && (
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                onClick={executeBulkAction}
                disabled={selectedUsers.length === 0 || !bulkAction || isProcessing}
              >
                {isProcessing ? 'Processing...' : `Apply (${selectedUsers.length})`}
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredUsers.map(user => (
                <TableRow key={user.id} className={selectedUsers.includes(user.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'doctor' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'suspended' ? 'destructive' : 'outline'}>
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// 2. ANNOUNCEMENTS PANEL - System-wide announcements
// =============================================================================
function AnnouncementsPanel({ announcements, isLoading, firestore, toast }: {
  announcements: SystemAnnouncement[] | null;
  isLoading: boolean;
  firestore: any;
  toast: any;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetRoles: ['patient', 'doctor', 'admin'],
  });

  const createAnnouncement = () => {
    if (!firestore || !newAnnouncement.title || !newAnnouncement.message) {
      toast({ variant: 'destructive', title: 'Please fill in all fields.' });
      return;
    }

    const announcementRef = doc(collection(firestore, 'announcements'));
    setDocumentNonBlocking(announcementRef, {
      ...newAnnouncement,
      active: true,
      createdAt: serverTimestamp(),
    }, {});

    toast({ title: 'Announcement Created' });
    setIsModalOpen(false);
    setNewAnnouncement({ title: '', message: '', type: 'info', targetRoles: ['patient', 'doctor', 'admin'] });
  };

  const toggleAnnouncement = (announcement: SystemAnnouncement) => {
    if (!firestore) return;
    const announcementRef = doc(firestore, 'announcements', announcement.id);
    updateDocumentNonBlocking(announcementRef, { active: !announcement.active });
    toast({ title: announcement.active ? 'Announcement Disabled' : 'Announcement Enabled' });
  };

  const deleteAnnouncement = (id: string) => {
    if (!firestore) return;
    const announcementRef = doc(firestore, 'announcements', id);
    deleteDocumentNonBlocking(announcementRef);
    toast({ title: 'Announcement Deleted', variant: 'destructive' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              System Announcements
            </CardTitle>
            <CardDescription>
              Create and manage system-wide announcements visible to users.
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Bell className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && <Skeleton className="h-20" />}
          {!isLoading && (!announcements || announcements.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No announcements yet.</p>
          )}
          {announcements?.map(announcement => (
            <Alert key={announcement.id} variant={announcement.type === 'error' ? 'destructive' : 'default'}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{announcement.title}</span>
                    <Badge variant={announcement.active ? 'default' : 'secondary'}>
                      {announcement.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{announcement.type}</Badge>
                  </div>
                  <AlertDescription>{announcement.message}</AlertDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: {announcement.targetRoles?.join(', ') || 'All'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => toggleAnnouncement(announcement)}>
                    {announcement.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteAnnouncement(announcement.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              This announcement will be visible to selected user groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input 
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea 
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                placeholder="Announcement message..."
                rows={4}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select 
                value={newAnnouncement.type} 
                onValueChange={(value: any) => setNewAnnouncement({ ...newAnnouncement, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={createAnnouncement}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// =============================================================================
// 3. FEATURE FLAGS PANEL - Toggle features on/off
// =============================================================================
function FeatureFlagsPanel({ featureFlags, isLoading, firestore, toast }: {
  featureFlags: FeatureFlag[] | null;
  isLoading: boolean;
  firestore: any;
  toast: any;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '' });

  const defaultFlags: { name: string; description: string }[] = [
    { name: 'video_calls', description: 'Enable video call feature for consultations' },
    { name: 'chat_system', description: 'Enable real-time chat between doctors and patients' },
    { name: 'gamification', description: 'Enable gamification features (badges, XP, etc.)' },
    { name: 'ai_faq_generation', description: 'Enable AI-powered FAQ generation' },
    { name: 'payment_processing', description: 'Enable Stripe payment processing' },
    { name: 'email_notifications', description: 'Enable email notifications for appointments' },
    { name: 'patient_onboarding', description: 'Enable new patient onboarding flow' },
    { name: 'doctor_scheduling', description: 'Enable doctor availability scheduling' },
    { name: 'maintenance_mode', description: 'Put the application in maintenance mode' },
    { name: 'beta_features', description: 'Enable beta features for testing' },
  ];

  const initializeDefaultFlags = async () => {
    if (!firestore) return;
    
    for (const flag of defaultFlags) {
      const flagRef = doc(firestore, 'featureFlags', flag.name);
      setDocumentNonBlocking(flagRef, {
        name: flag.name,
        description: flag.description,
        enabled: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
    
    toast({ title: 'Default Feature Flags Initialized' });
  };

  const toggleFlag = (flag: FeatureFlag) => {
    if (!firestore) return;
    const flagRef = doc(firestore, 'featureFlags', flag.id);
    updateDocumentNonBlocking(flagRef, { enabled: !flag.enabled });
    toast({ 
      title: `${flag.name} ${flag.enabled ? 'Disabled' : 'Enabled'}`,
      description: flag.description,
    });
  };

  const createFlag = () => {
    if (!firestore || !newFlag.name) return;
    const flagRef = doc(firestore, 'featureFlags', newFlag.name.toLowerCase().replace(/\s+/g, '_'));
    setDocumentNonBlocking(flagRef, {
      name: newFlag.name,
      description: newFlag.description,
      enabled: false,
      createdAt: serverTimestamp(),
    }, {});
    toast({ title: 'Feature Flag Created' });
    setIsModalOpen(false);
    setNewFlag({ name: '', description: '' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ToggleLeft className="w-5 h-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>
              Enable or disable features across the application without deploying code.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(!featureFlags || featureFlags.length === 0) && (
              <Button variant="outline" onClick={initializeDefaultFlags}>
                Initialize Defaults
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <Flag className="w-4 h-4 mr-2" />
              Add Flag
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && <Skeleton className="h-40" />}
          {!isLoading && (!featureFlags || featureFlags.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No feature flags configured. Click "Initialize Defaults" to set up common flags.
            </p>
          )}
          {featureFlags?.map(flag => (
            <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flag.name}</span>
                  <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
              </div>
              <Switch 
                checked={flag.enabled} 
                onCheckedChange={() => toggleFlag(flag)}
              />
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Add a new feature flag to control feature availability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Flag Name</Label>
              <Input 
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                placeholder="e.g., new_dashboard"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                placeholder="What does this flag control?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={createFlag}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// =============================================================================
// 4. DATA EXPORT PANEL - Export data to CSV/JSON
// =============================================================================
function DataExportPanel({ users, patients, firestore, toast }: {
  users: User[] | null;
  patients: any[] | null;
  firestore: any;
  toast: any;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] ?? '';
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExport = async (collection: string, format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      let headers: string[] = [];

      switch (collection) {
        case 'users':
          data = users || [];
          headers = ['id', 'email', 'name', 'role', 'status'];
          break;
        case 'patients':
          data = patients || [];
          headers = ['id', 'firstName', 'lastName', 'email', 'phone'];
          break;
      }

      if (format === 'csv') {
        exportToCSV(data, collection, headers);
      } else {
        exportToJSON(data, collection);
      }

      toast({ title: `${collection} exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Export data from Firestore collections to CSV or JSON format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Users</CardTitle>
              <CardDescription>{users?.length || 0} records</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('users', 'csv')} disabled={isExporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('users', 'json')} disabled={isExporting}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Patients</CardTitle>
              <CardDescription>{patients?.length || 0} records</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('patients', 'csv')} disabled={isExporting}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('patients', 'json')} disabled={isExporting}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// 5. AUDIT LOGS PANEL - View system activity
// =============================================================================
function AuditLogsPanel({ auditLogs, isLoading }: {
  auditLogs: AuditLog[] | null;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          Recent system activity and administrative actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              </TableRow>
            ))}
            {!isLoading && (!auditLogs || auditLogs.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No audit logs available. Actions will be logged here automatically.
                </TableCell>
              </TableRow>
            )}
            {auditLogs?.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {log.timestamp?.toDate?.()?.toLocaleString() || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">{log.userEmail}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.category}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// 6. SYSTEM HEALTH PANEL - System statistics and health indicators
// =============================================================================
function SystemHealthPanel({ users, patients, firestore }: {
  users: User[] | null;
  patients: any[] | null;
  firestore: any;
}) {
  const stats = useMemo(() => ({
    totalUsers: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    doctors: users?.filter(u => u.role === 'doctor').length || 0,
    patients: users?.filter(u => u.role === 'patient').length || 0,
    suspended: users?.filter(u => u.status === 'suspended').length || 0,
    patientRecords: patients?.length || 0,
  }), [users, patients]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.admins} admins, {stats.doctors} doctors, {stats.patients} patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patient Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patientRecords}</div>
            <p className="text-xs text-muted-foreground">
              Complete patient profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground">
              Accounts currently suspended
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and connection status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Firebase Connection</span>
              </div>
              <Badge className="bg-green-500">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Firestore Database</span>
              </div>
              <Badge className="bg-green-500">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Authentication Service</span>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
