'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  lastVisit?: string;
}

interface QuickPatientSearchProps {
  patients: Patient[];
  isLoading?: boolean;
}

export function QuickPatientSearch({ patients, isLoading }: QuickPatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim() || !patients) return [];
    
    const query = searchQuery.toLowerCase();
    return patients
      .filter((patient) => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        return (
          fullName.includes(query) ||
          patient.email?.toLowerCase().includes(query) ||
          patient.phone?.includes(query)
        );
      })
      .slice(0, 10); // Limit results
  }, [patients, searchQuery]);

  const handlePatientClick = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Search className="w-4 h-4" />
          <span>Quick search patients...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search Patients</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 pt-2">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading patients...
              </div>
            ) : searchQuery && filteredPatients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No patients found matching "{searchQuery}"</p>
              </div>
            ) : !searchQuery ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search patients</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/doctor/patient/${patient.id}`}
                    onClick={handlePatientClick}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {patient.firstName?.charAt(0)}
                        {patient.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {patient.email || patient.phone || 'No contact info'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href={`/doctor/patient/${patient.id}/appointments`}>
                          <Calendar className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href={`/doctor/chat/${patient.id}`}>
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
