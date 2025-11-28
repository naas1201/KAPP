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
import { ArrowUpRight } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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

  const customers = patients?.filter(p => (p as any).appointmentCount === 1);
  const clients = patients?.filter(p => (p as any).appointmentCount > 1);

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-6">
        Client & Lead Dashboard
      </h1>
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
