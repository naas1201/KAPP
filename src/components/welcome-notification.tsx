'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/hooks';

interface WelcomeNotificationProps {
  role?: 'patient' | 'doctor' | 'admin';
  userName?: string;
}

export function WelcomeNotification({ role, userName }: WelcomeNotificationProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (hasShown || !user) return;

    // Check if we've already shown the welcome message in this session
    const sessionKey = `welcome_shown_${user.uid}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    // Get time-based greeting
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const displayName = userName || user.displayName || user.email?.split('@')[0] || 'there';

    // Role-specific messages
    let roleMessage = '';
    switch (role) {
      case 'doctor':
        roleMessage = 'Ready to help your patients today?';
        break;
      case 'admin':
        roleMessage = 'Your dashboard is ready.';
        break;
      case 'patient':
      default:
        roleMessage = 'How can we help you today?';
    }

    // Show welcome toast
    toast({
      title: `${greeting}, ${displayName}! 👋`,
      description: roleMessage,
    });

    // Mark as shown for this session
    sessionStorage.setItem(sessionKey, 'true');
    setHasShown(true);
  }, [user, hasShown, role, userName, toast]);

  return null; // This is a side-effect only component
}
