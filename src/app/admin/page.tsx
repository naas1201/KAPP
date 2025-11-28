import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Users, ClipboardList, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold font-headline mb-6">Admin Overview</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/dashboard">
            <Card className="hover:bg-muted transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                        Client Dashboard
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Manage leads, customers, and clients.
                    </p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/admin/procedures">
            <Card className="hover:bg-muted transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                       Manage Procedures
                    </CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                    Add, edit, or remove clinic treatments.
                    </p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/users">
            <Card className="hover:bg-muted transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                       User Management
                    </CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                    Add and manage staff and doctor accounts.
                    </p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/admin/generate-faq">
            <Card className="hover:bg-muted transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                    GenAI FAQ Tool
                    </CardTitle>
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                    Automatically generate FAQ sections for new treatments.
                    </p>
                </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
