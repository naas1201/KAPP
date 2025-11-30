'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Heart, Check, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: any;
  readByDoctor?: boolean;
  liked?: boolean;
}

interface ChatRoom {
  id: string;
  participants: string[];
  doctorId: string;
  patientId: string;
  status: 'open' | 'closed';
  lastMessageText?: string;
}

export default function PatientChatPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat room details
  useEffect(() => {
    if (!firestore || !user || !roomId) return;

    const roomRef = doc(firestore, 'chatRooms', roomId as string);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data() as Omit<ChatRoom, 'id'>;
        // Verify user is a participant
        if (roomData.participants.includes(user.uid)) {
          setChatRoom({ id: snapshot.id, ...roomData });
        } else {
          // Not authorized
          router.push('/patient/messages');
        }
      } else {
        router.push('/patient/messages');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user, roomId, router]);

  // Fetch messages
  useEffect(() => {
    if (!firestore || !roomId) return;

    const messagesQuery = query(
      collection(firestore, 'chatRooms', roomId as string, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);

      // Mark messages as read by patient - only if there are unread messages
      if (user) {
        const unreadDocs = snapshot.docs.filter(
          docSnap => docSnap.data().senderId !== user.uid && !docSnap.data().readByPatient
        );
        
        if (unreadDocs.length > 0) {
          const batch = writeBatch(firestore);
          unreadDocs.forEach(docSnap => {
            batch.update(docSnap.ref, { readByPatient: true });
          });
          batch.update(doc(firestore, 'chatRooms', roomId as string), { patientUnreadCount: 0 });
          await batch.commit();
        }
      }
    });

    return () => unsubscribeMessages();
  }, [firestore, roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!firestore || !user || !roomId || newMessage.trim() === '' || chatRoom?.status !== 'open') return;

    const messageData = {
      senderId: user.uid,
      text: newMessage,
      createdAt: serverTimestamp(),
      readByDoctor: false,
    };

    const messagesRef = collection(firestore, 'chatRooms', roomId as string, 'messages');
    await addDocumentNonBlocking(messagesRef, messageData);

    const roomRef = doc(firestore, 'chatRooms', roomId as string);
    await updateDocumentNonBlocking(roomRef, {
      lastMessageText: newMessage,
      lastMessageAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    });

    setNewMessage('');
  };

  const handleLike = (messageId: string) => {
    if (!firestore || !roomId) return;
    const messageRef = doc(firestore, 'chatRooms', roomId as string, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    updateDocumentNonBlocking(messageRef, { liked: !message?.liked });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) return format(date, 'p');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const renderReadReceipt = (message: ChatMessage) => {
    if (message.senderId !== user?.uid) return null;
    if (message.readByDoctor) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    return <Check className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex-grow space-y-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-3/4 ml-auto" />
          <Skeleton className="h-10 w-1/2" />
        </div>
        <Skeleton className="h-12 w-full mt-4" />
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="p-4 sm:p-6">
        <p>Chat room not found.</p>
        <Button asChild className="mt-4">
          <Link href="/patient/messages">Back to Messages</Link>
        </Button>
      </div>
    );
  }

  const isClosed = chatRoom.status !== 'open';

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <header className="p-4 border-b bg-background flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patient/messages">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <Avatar>
          <AvatarFallback>Dr</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">Doctor Consultation</h2>
          <p className="text-sm text-muted-foreground">
            {isClosed ? 'Closed' : 'Active conversation'}
          </p>
        </div>
      </header>

      {isClosed && (
        <Card className="m-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-start gap-3 pt-4">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Conversation Closed</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This chat has been closed. You can still read the messages but cannot send new ones.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-grow p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation with your doctor.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="mb-4"
              >
                <div className={`flex items-end gap-2 group ${msg.senderId === user?.uid ? 'justify-end' : ''}`}>
                  {msg.senderId !== user?.uid && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>Dr</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`relative px-4 py-2 rounded-2xl max-w-sm md:max-w-md ${
                      msg.senderId === user?.uid
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-xs opacity-70 float-right mt-1">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                    {msg.senderId === user?.uid && (
                      <span className="text-xs opacity-70 float-right mt-1 ml-2">
                        {renderReadReceipt(msg)}
                      </span>
                    )}
                    {msg.liked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-3 -right-3 bg-background p-1 rounded-full shadow-md"
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </motion.div>
                    )}
                  </div>
                  {!isClosed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleLike(msg.id)}
                    >
                      <Heart className={`w-4 h-4 ${msg.liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                    </Button>
                  )}
                  {msg.senderId === user?.uid && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isClosed && (
        <div className="p-4 bg-background border-t">
          <div className="relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="pr-12"
            />
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
              <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            This is a secure channel. For emergencies, please call the clinic directly.
          </div>
        </div>
      )}
    </div>
  );
}
