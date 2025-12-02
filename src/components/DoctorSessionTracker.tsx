'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, intervalToDuration } from 'date-fns';
import { doc, serverTimestamp, increment } from 'firebase/firestore';
import { firestore } from '@/firebase/client';
import { setDocumentNonBlocking } from '@/firebase';
import { Clock, Monitor, Globe, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SessionInfo {
  sessionId: string;
  startTime: Date;
  ip: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
}

interface DoctorSessionTrackerProps {
  doctorId: string;
  doctorName?: string;
  showTimer?: boolean;
}

// Parse user agent to get device info
function parseUserAgent(ua: string): { deviceType: string; browser: string; os: string } {
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    deviceType = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  // Detect browser
  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Chrome') && !ua.includes('Edge')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Configuration constants
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const IP_LOOKUP_TIMEOUT_MS = 3000; // 3 seconds timeout for IP lookup

export function DoctorSessionTracker({ doctorId, doctorName, showTimer = true }: DoctorSessionTrackerProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const sessionInfoRef = useRef<SessionInfo | null>(null);

  // Keep ref in sync with state for use in cleanup
  useEffect(() => {
    sessionInfoRef.current = sessionInfo;
  }, [sessionInfo]);

  // Fetch IP address with timeout (optional feature - fails gracefully)
  const fetchIP = useCallback(async (): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IP_LOOKUP_TIMEOUT_MS);
    
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return data.ip || 'Unknown';
    } catch {
      clearTimeout(timeoutId);
      return 'Unknown';
    }
  }, []);

  // Log session to Firestore (non-blocking, fire-and-forget)
  const logSession = useCallback((info: SessionInfo, action: 'start' | 'heartbeat' | 'end') => {
    if (!firestore || !doctorId) return;
    
    const sessionLogRef = doc(firestore, 'doctors', doctorId, 'sessionLogs', info.sessionId);
    const now = new Date();
    
    try {
      if (action === 'start') {
        // Create new session log
        setDocumentNonBlocking(sessionLogRef, {
          sessionId: info.sessionId,
          doctorId,
          doctorName: doctorName || 'Unknown',
          startTime: info.startTime.toISOString(),
          ip: info.ip,
          userAgent: info.userAgent,
          deviceType: info.deviceType,
          browser: info.browser,
          os: info.os,
          status: 'active',
          lastHeartbeat: serverTimestamp(),
          createdAt: serverTimestamp(),
        }, { merge: true });

        // Also add to global audit log for admin visibility
        const auditRef = doc(firestore, 'auditLogs', `doctor_login_${info.sessionId}`);
        setDocumentNonBlocking(auditRef, {
          action: 'doctor_login',
          actorId: doctorId,
          actorName: doctorName || 'Unknown',
          actorRole: 'doctor',
          details: {
            sessionId: info.sessionId,
            ip: info.ip,
            deviceType: info.deviceType,
            browser: info.browser,
            os: info.os,
          },
          timestamp: serverTimestamp(),
        }, { merge: true });
      } else if (action === 'heartbeat') {
        // Update heartbeat
        setDocumentNonBlocking(sessionLogRef, {
          lastHeartbeat: serverTimestamp(),
          duration: Math.floor((now.getTime() - info.startTime.getTime()) / 1000),
        }, { merge: true });
      } else if (action === 'end') {
        // Mark session as ended
        const duration = Math.floor((now.getTime() - info.startTime.getTime()) / 1000);
        setDocumentNonBlocking(sessionLogRef, {
          endTime: now.toISOString(),
          duration,
          status: 'ended',
          lastHeartbeat: serverTimestamp(),
        }, { merge: true });

        // Update doctor's total session time
        const doctorRef = doc(firestore, 'doctors', doctorId);
        setDocumentNonBlocking(doctorRef, {
          'stats.totalSessionTime': increment(duration),
          'stats.lastActiveAt': serverTimestamp(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error logging session:', error);
    }
  }, [doctorId, doctorName]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const userAgent = navigator.userAgent;
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      const ip = await fetchIP();
      const sessionId = generateSessionId();
      const startTime = new Date();

      const info: SessionInfo = {
        sessionId,
        startTime,
        ip,
        userAgent,
        deviceType,
        browser,
        os,
      };

      setSessionInfo(info);
      
      // Log session start
      logSession(info, 'start');
    };

    initSession();
  }, [fetchIP, logSession]);

  // Update elapsed time every second
  useEffect(() => {
    if (!sessionInfo) return;

    const interval = setInterval(() => {
      const now = new Date();
      const duration = intervalToDuration({
        start: sessionInfo.startTime,
        end: now,
      });

      const hours = String(duration.hours || 0).padStart(2, '0');
      const minutes = String(duration.minutes || 0).padStart(2, '0');
      const seconds = String(duration.seconds || 0).padStart(2, '0');
      
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo]);

  // Send heartbeat every 5 minutes
  useEffect(() => {
    if (!sessionInfo) return;

    const heartbeatInterval = setInterval(() => {
      logSession(sessionInfo, 'heartbeat');
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(heartbeatInterval);
  }, [sessionInfo, logSession]);

  // Log session end on unmount or page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use ref to get current session info for cleanup
      if (sessionInfoRef.current) {
        logSession(sessionInfoRef.current, 'end');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Log end on component unmount
      if (sessionInfoRef.current) {
        logSession(sessionInfoRef.current, 'end');
      }
    };
  }, [logSession]);

  if (!sessionInfo) return null;

  if (!showTimer) {
    // Just track without showing UI
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 p-2 px-3 rounded-lg bg-muted/50 border text-sm">
        {/* Session Timer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-mono font-medium">{elapsedTime}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session Duration</p>
            <p className="text-xs text-muted-foreground">
              Started: {format(sessionInfo.startTime, 'PPpp')}
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        {/* Device Info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">{sessionInfo.deviceType}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Device: {sessionInfo.deviceType}</p>
            <p className="text-xs text-muted-foreground">
              {sessionInfo.browser} on {sessionInfo.os}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* IP Info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs hidden sm:inline">
                {sessionInfo.ip !== 'Unknown' ? sessionInfo.ip.substring(0, 12) + '...' : 'IP N/A'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>IP Address: {sessionInfo.ip}</p>
          </TooltipContent>
        </Tooltip>

        {/* Security Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-xs">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="hidden sm:inline">Secure</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Session is being logged for security</p>
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionInfo.sessionId.substring(0, 20)}...
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
