
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Eye, 
  Flag, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  User,
  Clock
} from 'lucide-react';

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export default function ReportsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const reportsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'reports'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const patientsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const doctorsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);

  const { data: reports, isLoading } = useCollection<Report>(reportsRef);
  const { data: patients } = useCollection(patientsRef);
  const { data: doctors } = useCollection(doctorsRef);

  const getReporterName = (reporterId: string) => {
    const doctor = doctors?.find((d: any) => d.id === reporterId);
    if (doctor) return `Dr. ${(doctor as any).firstName} ${(doctor as any).lastName}`;
    return 'Unknown Doctor';
  };

  const getReportedName = (reportedId: string) => {
    const patient = patients?.find((p: any) => p.id === reportedId);
    if (patient) return `${(patient as any).firstName} ${(patient as any).lastName}`;
    return 'Unknown Patient';
  };

  const pendingReports = useMemo(() => 
    reports?.filter(r => r.status === 'pending') || [], 
    [reports]
  );

  const handleOpenReport = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (status: 'reviewed' | 'resolved' | 'dismissed') => {
    if (!firestore || !selectedReport || !user) return;
    
    setIsProcessing(true);
    try {
      const reportRef = doc(firestore, 'reports', selectedReport.id);
      await updateDocumentNonBlocking(reportRef, {
        status,
        reviewedAt: serverTimestamp(),
        adminNotes,
      });

      toast({
        title: 'Report Updated',
        description: `Report has been marked as ${status}.`,
      });
      
      setIsDialogOpen(false);
      setSelectedReport(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update the report.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      case 'reviewed':
        return <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />Reviewed</Badge>;
      default:
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Patient Reports</h1>
        <p className="text-muted-foreground">
          Review reports filed by doctors about patient behavior or concerns.
        </p>
      </div>

      {pendingReports.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800 dark:text-amber-200">
              You have <strong>{pendingReports.length}</strong> pending report(s) that require attention.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            All Reports
          </CardTitle>
          <CardDescription>
            Reports from doctors about patient issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported By</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && renderSkeleton()}
              {!isLoading && (!reports || reports.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No reports filed yet.
                  </TableCell>
                </TableRow>
              )}
              {reports?.map((report) => (
                <TableRow key={report.id} className={report.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                  <TableCell className="font-medium">{getReporterName(report.reporterId)}</TableCell>
                  <TableCell>{getReportedName(report.reportedId)}</TableCell>
                  <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleOpenReport(report)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review the report and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reported By</p>
                  <p className="font-medium">{getReporterName(selectedReport.reporterId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient Reported</p>
                  <p className="font-medium">{getReportedName(selectedReport.reportedId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Filed</p>
                  <p className="font-medium">{format(new Date(selectedReport.createdAt), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Reason for Report</p>
                <p className="p-3 bg-muted rounded-md">{selectedReport.reason}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  placeholder="Add notes about this report..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateStatus('dismissed')}
                  disabled={isProcessing}
                >
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('reviewed')}
                  disabled={isProcessing}
                >
                  Mark Reviewed
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={isProcessing}
                >
                  Resolve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
