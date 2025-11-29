
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  useFirebase,
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  writeBatch,
  getDocs,
  limit,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Heart, Check, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton }from '@/components/ui/skeleton';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: any;
  readByPatient?: boolean;
  liked?: boolean;
}

export default function ChatPage() {
  const { patientId } = useParams();
  const { firestore, user: doctor } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    if (!firestore || !doctor || !patientId) return;

    const fetchPatientData = async () => {
        const patientRef = doc(firestore, 'patients', patientId as string);
        onSnapshot(patientRef, (doc) => {
            if (doc.exists()) {
                setPatientData({ id: doc.id, ...doc.data() });
            }
        });
    };
    fetchPatientData();

    const roomQuery = query(
      collection(firestore, 'chatRooms'),
      where('participants', 'array-contains', doctor.uid),
    );

    const unsubscribe = onSnapshot(roomQuery, async (snapshot) => {
      let foundRoom = false;
      for (const doc of snapshot.docs) {
        const roomData = doc.data();
        if (roomData.participants.includes(patientId)) {
          setChatRoomId(doc.id);
          foundRoom = true;
          break;
        }
      }

      if (!foundRoom) {
        const newRoomData = {
          participants: [doctor.uid, patientId],
          doctorId: doctor.uid,
          patientId: patientId,
          lastActivity: serverTimestamp(),
          status: 'open',
          doctorUnreadCount: 0,
          patientUnreadCount: 0,
          lastMessageText: 'Chat initiated.',
        };
        const newRoom = await addDocumentNonBlocking(collection(firestore, 'chatRooms'), newRoomData);
        if(newRoom) setChatRoomId(newRoom.id);
      }
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, doctor, patientId]);

  useEffect(() => {
    if (!firestore || !chatRoomId) return;

    const messagesQuery = query(
      collection(firestore, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);

      // Mark messages as read by doctor
      const batch = writeBatch(firestore);
      let hasUnread = false;
      snapshot.docs.forEach(doc => {
          if(doc.data().senderId === patientId && !doc.data().readByDoctor) {
            batch.update(doc.ref, { readByDoctor: true });
            hasUnread = true;
          }
      });
      if (hasUnread) {
        batch.update(doc(firestore, 'chatRooms', chatRoomId), { doctorUnreadCount: 0 });
        await batch.commit();
      }
    });

    return () => unsubscribeMessages();
  }, [firestore, chatRoomId, patientId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!firestore || !doctor || !chatRoomId || newMessage.trim() === '') return;
    triggerHaptic('light');

    const messageData = {
      senderId: doctor.uid,
      text: newMessage,
      createdAt: serverTimestamp(),
      readByPatient: false,
    };

    const messagesRef = collection(firestore, 'chatRooms', chatRoomId, 'messages');
    await addDocumentNonBlocking(messagesRef, messageData);
    
    const roomRef = doc(firestore, 'chatRooms', chatRoomId);
    await updateDocumentNonBlocking(roomRef, {
        lastMessageText: newMessage,
        lastActivity: serverTimestamp(),
        'patientUnreadCount': (patientData?.unreadCount || 0) + 1,
    });

    setNewMessage('');
  };
  
  const handleLike = (messageId: string) => {
    if (!firestore || !chatRoomId) return;
    triggerHaptic('light');
    const messageRef = doc(firestore, 'chatRooms', chatRoomId, 'messages', messageId);
    const message = messages.find(m => m.id === messageId);
    updateDocumentNonBlocking(messageRef, { liked: !message?.liked });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };
  
  const renderReadReceipt = (message: ChatMessage) => {
    if (message.senderId !== doctor?.uid) return null;
    if (message.readByPatient) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    return <Check className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading || !patientData) {
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
      )
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
        <header className="p-4 border-b bg-background flex items-center gap-3">
            <Avatar>
                <AvatarFallback>{patientData.firstName?.charAt(0)}{patientData.lastName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="font-semibold">{patientData.firstName} {patientData.lastName}</h2>
                <p className="text-sm text-muted-foreground">Online</p>
            </div>
        </header>
        
        <div className="flex-grow p-4 overflow-y-auto">
            <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
                <motion.div 
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="mb-4"
                >
                    <div className={`flex items-end gap-2 group ${msg.senderId === doctor?.uid ? 'justify-end' : ''}`}>
                         {msg.senderId !== doctor?.uid && (
                            <Avatar className="w-8 h-8">
                                <AvatarFallback>{patientData.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                         )}
                         <div className={`relative px-4 py-2 rounded-2xl max-w-sm md:max-w-md ${msg.senderId === doctor?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                            <span className="text-xs opacity-70 float-right mt-1">
                                {formatTimestamp(msg.createdAt)}
                            </span>
                            {msg.senderId === doctor?.uid && (
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
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleLike(msg.id)}>
                            <Heart className={`w-4 h-4 ${msg.liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}/>
                        </Button>
                         {msg.senderId === doctor?.uid && (
                            <Avatar className="w-8 h-8">
                                <AvatarFallback>Dr</AvatarFallback>
                            </Avatar>
                         )}
                    </div>
                </motion.div>
            ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>

      <div className="p-4 bg-background border-t">
        <div className="relative">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="pr-24"
          />
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex gap-1">
            <Button variant="ghost" size="icon">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
            This is a secure channel. For emergencies, please call the clinic directly.
        </div>
      </div>
    </div>
  );
}
