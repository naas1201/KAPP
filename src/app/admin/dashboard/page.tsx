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
import { leads, customers, clients } from '@/lib/admin-data';
import { ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
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
                        <TableHead className="hidden sm:table-cell">Service Interest</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-right">Follow Up</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div className="font-medium">{lead.name}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {lead.email}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{lead.serviceInterest}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant={lead.status === 'New' ? 'default' : 'outline'}>
                                    {lead.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{lead.date}</TableCell>
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
                        <TableHead className="hidden sm:table-cell">Last Visit</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Appointments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                        <TableRow key={customer.id}>
                            <TableCell>
                                <div className="font-medium">{customer.name}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {customer.email}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{customer.lastVisit}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant="secondary">
                                    {customer.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{customer.totalAppointments}</TableCell>
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
                        <TableHead className="hidden sm:table-cell">Last Visit</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Appointments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                        <TableRow key={client.id} className="bg-accent/40">
                            <TableCell>
                                <div className="font-medium">{client.name}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {client.email}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{client.lastVisit}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge className="text-xs" variant="default">
                                    {client.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{client.totalAppointments}</TableCell>
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
