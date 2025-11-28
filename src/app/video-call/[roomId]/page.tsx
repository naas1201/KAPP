
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useDoc,
  useFirebase,
  useUser,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Firestore document structure for signaling
interface Room {
  id?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  // Candidates need to be in subcollections
}

export default function VideoCallPage() {
  const { roomId } = useParams();
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    pc.current = new RTCPeerConnection(servers);

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        setHasCameraPermission(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          pc.current?.addTrack(track, stream);
        });
      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description:
            'Please allow camera and microphone access to start the call.',
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
    if (!firestore || !roomId || !pc.current) return;

    const roomRef = doc(firestore, 'video-calls', roomId as string);
    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        // This assumes we know if we are the caller or callee
        // For simplicity, let's say doctor is caller, patient is callee
        // A more robust solution would be needed in a real app
        addDoc(callerCandidatesCollection, event.candidate.toJSON());
      }
    };
    
    pc.current.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            if (remoteStream) {
                remoteStream.addTrack(track);
            } else {
                setRemoteStream(event.streams[0]);
            }
        });

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
        }
    };

    // Listen for room changes
    const unsubscribeRoom = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data() as Room;
      if (data.answer && pc.current && !pc.current.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.current.setRemoteDescription(answerDescription);
      }
      
      // Create offer if not exists
      if (!data.offer && pc.current) {
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);
        
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await setDoc(roomRef, { offer });
      }
    });

    const unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.current?.addIceCandidate(candidate);
            }
        });
    });


    return () => {
      unsubscribeRoom();
      unsubscribeCalleeCandidates();
    };
  }, [firestore, roomId, pc, remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const hangUp = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    pc.current?.close();
    // Also need to update room status in firestore
    router.back();
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Video Call</h1>
      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertTitle>Camera and Microphone Required</AlertTitle>
          <AlertDescription>
            Please grant permission to your camera and microphone to use the video call feature.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="relative aspect-video">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-md" />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            You
          </div>
        </Card>
        <Card className="relative aspect-video bg-muted">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-md" />
           <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            Patient
          </div>
        </Card>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'outline'} size="icon" className="rounded-full h-14 w-14">
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button onClick={toggleVideo} variant={isVideoOff ? 'destructive' : 'outline'} size="icon" className="rounded-full h-14 w-14">
          {isVideoOff ? <VideoOff /> : <VideoIcon />}
        </Button>
        <Button onClick={hangUp} variant="destructive" size="icon" className="rounded-full h-14 w-14">
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
