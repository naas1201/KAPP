'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Download,
  Share2,
  CheckCircle,
  QrCode,
  Stethoscope,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface AppointmentConfirmationProps {
  appointment: {
    id: string;
    bookingId?: string;
    serviceType: string;
    dateTime: string;
    doctorName?: string;
    status: string;
    paymentStatus?: 'paid' | 'pending' | 'pay_later';
    amountPaid?: number;
    notes?: string;
  };
  patientName?: string;
  showActions?: boolean;
}

export function AppointmentConfirmation({
  appointment,
  patientName,
  showActions = true,
}: AppointmentConfirmationProps) {
  const appointmentDate = new Date(appointment.dateTime);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Appointment at Castillo Health & Aesthetics',
          text: `Appointment for ${appointment.serviceType} on ${format(appointmentDate, 'MMMM d, yyyy')} at ${format(appointmentDate, 'h:mm a')}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-primary/20">
        {/* Header with Status */}
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/20">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-headline">
                  Appointment {appointment.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Booking ID: {appointment.bookingId || appointment.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(appointment.status)} text-white`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Main Appointment Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-semibold">{appointment.serviceType}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-semibold">{appointment.doctorName || 'Dr. Katheryne Castillo'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{format(appointmentDate, 'h:mm a')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Status */}
          {appointment.paymentStatus && (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.paymentStatus === 'paid' && appointment.amountPaid
                        ? `₱${appointment.amountPaid.toLocaleString()} paid`
                        : appointment.paymentStatus === 'pay_later'
                        ? 'Pay at clinic'
                        : 'Pending payment'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={appointment.paymentStatus === 'paid' ? 'default' : 'secondary'}
                  className={appointment.paymentStatus === 'paid' ? 'bg-green-500' : ''}
                >
                  {appointment.paymentStatus === 'paid' ? 'Paid' : 'Pay Later'}
                </Badge>
              </div>
            </div>
          )}

          {/* Clinic Information */}
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Clinic Location
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Castillo Health & Aesthetics</p>
              <p className="text-muted-foreground">Unit 123, Medical Plaza Building</p>
              <p className="text-muted-foreground">Makati City, Metro Manila, Philippines</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                <a href="tel:+639123456789" className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="w-4 h-4" />
                  +63 912 345 6789
                </a>
                <a href="mailto:info@castillohealth.ph" className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Your Notes</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{appointment.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2">
                <QrCode className="w-4 h-4" />
                Show QR
              </Button>
            </div>
          )}

          {/* Reminders */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
              📋 Appointment Reminders
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Please arrive 15 minutes before your scheduled time</li>
              <li>• Bring a valid ID and any relevant medical records</li>
              <li>• Inform us immediately if you need to reschedule</li>
              <li>• For aesthetic treatments, avoid sun exposure 24 hours before</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
