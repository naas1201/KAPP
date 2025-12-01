'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useCollection, 
  useFirebase, 
  useMemoFirebase,
} from '@/firebase/hooks';
import { updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  Search, 
  Mail, 
  Download, 
  Users, 
  UserCheck, 
  UserX,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: any;
  unsubscribedAt?: any;
  isActive: boolean;
  source?: string;
}

const ITEMS_PER_PAGE = 20;

export default function NewsletterPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const subscribersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'newsletterSubscribers'), orderBy('subscribedAt', 'desc'));
  }, [firestore]);

  const { data: subscribers, isLoading } = useCollection<Subscriber>(subscribersRef);

  // Filter and search subscribers
  const filteredSubscribers = useMemo(() => {
    if (!subscribers) return [];
    
    return subscribers.filter(sub => {
      // Apply status filter
      if (filter === 'active' && !sub.isActive) return false;
      if (filter === 'inactive' && sub.isActive) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return sub.email.toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [subscribers, filter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!subscribers) return { total: 0, active: 0, inactive: 0 };
    return {
      total: subscribers.length,
      active: subscribers.filter(s => s.isActive).length,
      inactive: subscribers.filter(s => !s.isActive).length,
    };
  }, [subscribers]);

  // Pagination
  const paginatedSubscribers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubscribers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubscribers, currentPage]);

  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);

  const handleReactivate = (subscriber: Subscriber) => {
    if (!firestore) return;
    
    const subscriberRef = doc(firestore, 'newsletterSubscribers', subscriber.email);
    updateDocumentNonBlocking(subscriberRef, {
      isActive: true,
      reactivatedAt: new Date(),
    });
    
    toast({
      title: 'Subscriber reactivated',
      description: `${subscriber.email} has been reactivated.`,
    });
  };

  const exportToCSV = () => {
    if (!subscribers) return;
    
    const activeSubscribers = subscribers.filter(s => s.isActive);
    const csvContent = [
      ['Email', 'Subscribed Date', 'Source'].join(','),
      ...activeSubscribers.map(s => [
        s.email,
        s.subscribedAt?.toDate ? format(s.subscribedAt.toDate(), 'yyyy-MM-dd') : 'N/A',
        s.source || 'website',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export complete',
      description: `Exported ${activeSubscribers.length} active subscribers.`,
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">
            Manage and export your newsletter mailing list.
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!subscribers || stats.active === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export Active ({stats.active})
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-100">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Unsubscribed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => { setFilter('active'); setCurrentPage(1); }}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'inactive' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => { setFilter('inactive'); setCurrentPage(1); }}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && paginatedSubscribers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchQuery || filter !== 'all' 
                      ? 'No subscribers found matching your criteria.' 
                      : 'No newsletter subscribers yet.'}
                  </TableCell>
                </TableRow>
              )}
              {paginatedSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {subscriber.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscriber.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Unsubscribed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subscriber.subscribedAt?.toDate 
                      ? format(subscriber.subscribedAt.toDate(), 'MMM d, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {subscriber.source || 'website'}
                  </TableCell>
                  <TableCell className="text-right">
                    {!subscriber.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivate(subscriber)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscribers.length)} of {filteredSubscribers.length}
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
    </div>
  );
}
