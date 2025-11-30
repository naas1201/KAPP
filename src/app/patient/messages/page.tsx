'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  ChevronRight,
  Stethoscope,
  Info
} from 'lucide-react';

export default function PatientMessagesPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  // Fetch all chat rooms where user is a participant
  const chatRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
  }, [firestore, user]);

  const { data: chatRooms, isLoading: isLoadingChatRooms } = useCollection(chatRoomsQuery);

  const isLoading = isUserLoading || isLoadingChatRooms;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const openRooms = chatRooms?.filter((room: any) => room.status === 'open') || [];
  const closedRooms = chatRooms?.filter((room: any) => room.status !== 'open') || [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">Messages</h1>
        <p className="text-muted-foreground">
          Chat with your doctors during active consultations
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">How Messaging Works</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Doctors can open chat sessions during consultations for follow-up questions.
              Chat sessions are automatically closed 24 hours after the last message for your privacy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Conversations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Conversations</CardTitle>
          <CardDescription>
            Ongoing chats with your doctors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active conversations</p>
              <p className="text-sm">Doctors can initiate chats during or after consultations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openRooms.map((room: any) => (
                <Link 
                  key={room.id} 
                  href={`/patient/messages/${room.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Dr. Consultation</p>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      {room.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {room.lastMessage}
                        </p>
                      )}
                      {room.lastMessageAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Conversations */}
      {closedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Closed Conversations</CardTitle>
            <CardDescription>
              Previous chat sessions (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {closedRooms.map((room: any) => (
                <Link 
                  key={room.id} 
                  href={`/patient/messages/${room.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-muted">
                      <Stethoscope className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-muted-foreground">Dr. Consultation</p>
                        <Badge variant="outline">Closed</Badge>
                      </div>
                      {room.closedAt && (
                        <p className="text-xs text-muted-foreground">
                          Closed {formatDistanceToNow(new Date(room.closedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
