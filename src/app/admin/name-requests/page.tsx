
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
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileImage, 
  Clock, 
  User,
  AlertTriangle,
  Shield
} from 'lucide-react';

// Number of days to retain ID documents after request is processed
const ID_DOCUMENT_RETENTION_DAYS = 6;

interface NameChangeRequest {
  id: string;
  patientId: string;
  patientEmail: string;
  currentLastName: string;
  requestedLastName: string;
  reason: string;
  idDocumentUrl?: string;
  idDocumentName?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export default function NameRequestsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [selectedRequest, setSelectedRequest] = useState<NameChangeRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'nameChangeRequests'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: requests, isLoading } = useCollection<NameChangeRequest>(requestsRef);

  const pendingRequests = useMemo(() => 
    requests?.filter(r => r.status === 'pending') || [], 
    [requests]
  );
  
  const processedRequests = useMemo(() => 
    requests?.filter(r => r.status !== 'pending') || [], 
    [requests]
  );

  const handleOpenReview = (request: NameChangeRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!firestore || !selectedRequest || !user) return;
    
    setIsProcessing(true);
    try {
      // Update the request status
      const requestRef = doc(firestore, 'nameChangeRequests', selectedRequest.id);
      await updateDocumentNonBlocking(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        adminNotes,
        idDocumentDeleteAt: addDays(new Date(), ID_DOCUMENT_RETENTION_DAYS).toISOString(),
      });

      // Update the patient's last name
      const patientRef = doc(firestore, 'patients', selectedRequest.patientId);
      await updateDocumentNonBlocking(patientRef, {
        lastName: selectedRequest.requestedLastName,
        lastNameUpdatedAt: serverTimestamp(),
      });

      toast({
        title: 'Request Approved',
        description: `Patient's last name has been updated to ${selectedRequest.requestedLastName}`,
      });
      
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process the request. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!firestore || !selectedRequest || !user) return;
    
    if (!adminNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a reason for denying this request.',
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const requestRef = doc(firestore, 'nameChangeRequests', selectedRequest.id);
      await updateDocumentNonBlocking(requestRef, {
        status: 'denied',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        adminNotes,
        idDocumentDeleteAt: addDays(new Date(), ID_DOCUMENT_RETENTION_DAYS).toISOString(),
      });

      toast({
        title: 'Request Denied',
        description: 'The patient will be notified of the decision.',
      });
      
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process the request. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Name Change Requests</h1>
        <p className="text-muted-foreground">
          Review and process patient name change requests with ID verification.
        </p>
      </div>

      {/* Security Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ID documents are stored securely and automatically deleted 6 days after the request is processed.
              Always verify the ID document matches the patient before approving.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Requests awaiting review. ID verification required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Email</TableHead>
                <TableHead>Current Name</TableHead>
                <TableHead>Requested Name</TableHead>
                <TableHead>ID Document</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && renderSkeleton()}
              {!isLoading && pendingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No pending name change requests.
                  </TableCell>
                </TableRow>
              )}
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.patientEmail}</TableCell>
                  <TableCell>{request.currentLastName}</TableCell>
                  <TableCell className="font-semibold">{request.requestedLastName}</TableCell>
                  <TableCell>
                    {request.idDocumentUrl ? (
                      <Badge variant="outline" className="gap-1">
                        <FileImage className="w-3 h-3" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleOpenReview(request)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>
            Previously processed requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Email</TableHead>
                <TableHead>Name Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && renderSkeleton()}
              {!isLoading && processedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No processed requests yet.
                  </TableCell>
                </TableRow>
              )}
              {processedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.patientEmail}</TableCell>
                  <TableCell>
                    {request.currentLastName} → {request.requestedLastName}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.reviewedAt && formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenReview(request)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Name Change Request</DialogTitle>
            <DialogDescription>
              Verify the ID document and approve or deny the request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient Email</p>
                  <p className="font-medium">{selectedRequest.patientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Last Name</p>
                  <p className="font-medium">{selectedRequest.currentLastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Last Name</p>
                  <p className="font-semibold text-primary">{selectedRequest.requestedLastName}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason for Change</p>
                <p className="p-3 bg-muted rounded-md">{selectedRequest.reason}</p>
              </div>

              {/* ID Document */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">ID Document</p>
                {selectedRequest.idDocumentUrl ? (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-3 mb-3">
                      <FileImage className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{selectedRequest.idDocumentName || 'ID Document'}</p>
                        <p className="text-xs text-muted-foreground">
                          Will be deleted 6 days after processing
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedRequest.idDocumentUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      <p className="font-medium">No ID document uploaded</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cannot approve without ID verification.
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes (optional for approval, required for denial)</p>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Previous Admin Notes */}
              {selectedRequest.adminNotes && selectedRequest.status !== 'pending' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="p-3 bg-muted rounded-md">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleDeny}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing || !selectedRequest.idDocumentUrl}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
