'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

interface QuickStatusToggleProps {
  appointmentId: string;
  patientId: string;
  currentStatus: AppointmentStatus;
  onStatusChange?: (newStatus: AppointmentStatus) => void;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, variant: 'default' as const, color: 'text-green-600' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
  completed: { label: 'Completed', icon: CheckCircle, variant: 'outline' as const, color: 'text-blue-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'outline' as const, color: 'text-gray-600' },
};

export function QuickStatusToggle({
  appointmentId,
  patientId,
  currentStatus,
  onStatusChange,
}: QuickStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    if (!firestore || newStatus === currentStatus) return;

    setIsUpdating(true);

    try {
      // Update the appointment in the patient's subcollection
      const appointmentRef = doc(
        firestore,
        'patients',
        patientId,
        'appointments',
        appointmentId
      );

      updateDocumentNonBlocking(appointmentRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusChangedAt: serverTimestamp(),
      });

      toast({
        title: 'Status Updated',
        description: `Appointment marked as ${STATUS_CONFIG[newStatus].label.toLowerCase()}.`,
      });

      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update appointment status.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const config = STATUS_CONFIG[currentStatus];
  const Icon = config.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className={`w-4 h-4 ${config.color}`} />
          )}
          <span>{config.label}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(STATUS_CONFIG).map(([status, statusConfig]) => {
          const StatusIcon = statusConfig.icon;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status as AppointmentStatus)}
              className="gap-2"
              disabled={status === currentStatus}
            >
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span>{statusConfig.label}</span>
              {status === currentStatus && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Current
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact badge version for tables
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
