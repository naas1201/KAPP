
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  useFirebase,
  useUser,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Star,
  Flag,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface Room {
  id?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status?: 'pending' | 'active' | 'completed' | 'declined';
}

export default function VideoCallPage() {
  const { roomId } = useParams();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('peerId');
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [callStatus, setCallStatus] = useState<string>('connecting');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  const pc = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const servers = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
    iceCandidatePoolSize: 10,
  };

  // Start media devices
  useEffect(() => {
    pc.current = new RTCPeerConnection(servers);

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setHasCameraPermission(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.current?.addTrack(track, stream));
      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please allow camera and microphone access to start the call.',
        });
      }
    };

    getMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      pc.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signaling logic
  useEffect(() => {
    if (!firestore || !roomId || !pc.current || !user) return;

    const roomRef = doc(firestore, 'video-calls', roomId as string);
    const callerCandidatesCollection = collection(roomRef, `${user.uid}_candidates`);
    const calleeCandidatesCollection = collection(roomRef, `${otherUserId}_candidates`);

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDocumentNonBlocking(callerCandidatesCollection, event.candidate.toJSON());
      }
    };
    
    pc.current.ontrack = (event) => {
        setCallStatus('active');
        const stream = event.streams[0];
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
        setRemoteStream(stream);
    };

    const unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.current?.addIceCandidate(candidate);
            }
        });
    });

    const unsubscribeRoom = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data() as Room;
      if (!pc.current) return;

      if (data?.answer && !pc.current.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.current.setRemoteDescription(answerDescription);
      }

      if (searchParams.get('role') === 'caller' && !data.offer) {
          const offerDescription = await pc.current.createOffer();
          await pc.current.setLocalDescription(offerDescription);
          setDocumentNonBlocking(roomRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type }}, { merge: true });
      }
       if (searchParams.get('role') === 'receiver' && data.offer && !data.answer) {
         await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
         const answerDescription = await pc.current.createAnswer();
         await pc.current.setLocalDescription(answerDescription);
         setDocumentNonBlocking(roomRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type }}, { merge: true });
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribeCalleeCandidates();
    };
  }, [firestore, roomId, pc, user, otherUserId, searchParams]);

  const hangUp = async () => {
    localStream?.getTracks().forEach((track) => track.stop());
    pc.current?.close();
    setCallStatus('completed');
    setShowRating(true);

    if (firestore && roomId) {
        const roomRef = doc(firestore, 'video-calls', roomId as string);
        await updateDoc(roomRef, { status: 'completed' });
    }
  };
  
  const submitRating = async () => {
    if (!firestore || !user || !otherUserId || !roomId) return;
    const ratingRef = collection(firestore, 'ratings');
    await addDocumentNonBlocking(ratingRef, {
        consultationId: roomId,
        ratedId: otherUserId,
        raterId: user.uid,
        rating: rating,
        createdAt: new Date().toISOString(),
    });
    toast({ title: 'Thank you for your feedback!' });
    router.back();
  }
  
  const toggleMute = () => { localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled)); setIsMuted(!isMuted); };
  const toggleVideo = () => { localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled)); setIsVideoOff(!isVideoOff); };

  if (showRating) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
            <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
            <Card className="p-8 text-center max-w-md">
                <h2 className="text-2xl font-bold font-headline mb-2">Consultation Ended</h2>
                <p className="text-muted-foreground mb-6">Thank you! Please rate your experience.</p>
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn('w-10 h-10 cursor-pointer transition-colors', star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                <Button onClick={submitRating} className="w-full">Submit Feedback</Button>
                <Button variant="link" onClick={() => router.back()} className="mt-2">Skip</Button>
            </Card>
        </div>
    );
  }

  return (
    <div className="container p-4 mx-auto min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-center">Video Consultation</h1>
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Camera and Microphone Required</AlertTitle>
          <AlertDescription>
            Please grant permission to your camera and microphone to use this feature.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="relative aspect-video overflow-hidden shadow-lg">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-md" />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            You
          </div>
        </Card>
        <Card className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden shadow-lg">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-md" />
          {!remoteStream && callStatus === 'connecting' && (
              <div className="absolute text-center text-muted-foreground">
                  <p>Connecting...</p>
              </div>
          )}
           <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {searchParams.get('role') === 'caller' ? 'Patient' : 'Doctor'}
          </div>
        </Card>
      </div>

      <div className="flex justify-center gap-4 mt-6 py-4">
        <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'outline'} size="icon" className="rounded-full h-14 w-14">
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button onClick={hangUp} variant="destructive" size="icon" className="rounded-full h-16 w-16">
          <PhoneOff />
        </Button>
        <Button onClick={toggleVideo} variant={isVideoOff ? 'destructive' : 'outline'} size="icon" className="rounded-full h-14 w-14">
          {isVideoOff ? <VideoOff /> : <VideoIcon />}
        </Button>
      </div>
    </div>
  );
}
