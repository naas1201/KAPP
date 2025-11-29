
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BellRing } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase/hooks';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'leads');
  }, [firestore]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection(leadsQuery);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'patients');
  }, [firestore]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  const expiringPrescriptionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return query(
      collection(firestore, 'prescriptions'),
      where('expiresAt', '<=', thirtyDaysFromNow.toISOString()),
      where('expiresAt', '>=', new Date().toISOString())
    );
  }, [firestore]);

  const { data: expiringPrescriptions, isLoading: isLoadingPrescriptions } = useCollection(expiringPrescriptionsQuery);
  
  const enrichedPrescriptions = useMemoFirebase(() => {
    if (!expiringPrescriptions || !patients) return [];
    return expiringPrescriptions.map((rx: any) => {
        const patient = patients.find((p: any) => p.id === rx.patientId);
        return {
            ...rx,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
            patientEmail: patient ? patient.email : '',
        };
    });
  }, [expiringPrescriptions, patients]);


  const customers = patients?.filter(p => (p as any).appointmentCount === 1);
  const clients = patients?.filter(p => (p as any).appointmentCount > 1);

  const renderSkeleton = (cols = 5) => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({length: cols}).map((_, j) => (
            <TableCell key={j} className={j === cols - 1 ? 'text-right' : ''}>
                <Skeleton className="h-5 w-full" />
            </TableCell>
        ))}
      </TableRow>
    ))
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-6">
        Client & Lead Dashboard
      </h1>
      <Tabs defaultValue="leads">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="expiring" className="relative">
            Expiring RX
            {expiringPrescriptions && expiringPrescriptions.length > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <Card>
            <CardHeader className="px-7">
                <CardTitle>Leads</CardTitle>
                <CardDescription>Potential clients who have shown interest.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Source</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead className="text-right">Follow Up</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingLeads && renderSkeleton()}
                        {leads?.map((lead: any) => (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {lead.email}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{lead.source}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant={'default'}>
                                    New
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild size="sm" className="ml-auto gap-1">
                                    <a href={`mailto:${lead.email}`}>Contact <ArrowUpRight className="h-4 w-4" /></a>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers">
        <Card>
            <CardHeader className="px-7">
                <CardTitle>One-Time Clients (Customers)</CardTitle>
                <CardDescription>Clients who have had one appointment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Appointments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingPatients && renderSkeleton()}
                        {customers?.map((customer: any) => (
                        <TableRow key={customer.id}>
                            <TableCell>
                                <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {customer.phone}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{customer.email}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant="secondary">
                                    One-Time
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{customer.appointmentCount || 1}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm">View Details</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clients">
        <Card>
            <CardHeader className="px-7">
                <CardTitle>Returning Clients</CardTitle>
                <CardDescription>Loyal clients with multiple appointments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Appointments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingPatients && renderSkeleton()}
                        {clients?.map((client: any) => (
                        <TableRow key={client.id} className="bg-accent/40">
                            <TableCell>
                                <div className="font-medium">{client.firstName} {client.lastName}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {client.phone}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{client.email}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant="default">
                                    Returning
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{client.appointmentCount || 0}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm">View Details</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expiring">
          <Card>
            <CardHeader className="px-7">
              <CardTitle>Expiring Prescriptions</CardTitle>
              <CardDescription>
                Prescriptions expiring in the next 30 days. Contact patients to schedule a follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Drug</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isLoadingPrescriptions || isLoadingPatients) && renderSkeleton(4)}
                  {enrichedPrescriptions?.map((rx: any) => (
                    <TableRow key={rx.id}>
                      <TableCell>
                        <div className="font-medium">{rx.patientName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {rx.patientEmail}
                        </div>
                      </TableCell>
                      <TableCell>{rx.drugName}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(rx.expiresAt), { addSuffix: true })}
                        <div className="text-sm text-muted-foreground">
                            {format(new Date(rx.expiresAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" className="ml-auto gap-1">
                          <Link href={`/doctor/patient/${rx.patientId}`}>
                            View Patient <ArrowUpRight className="h-4 w-4" />
                          </Link>
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
    </div>
  );

}


