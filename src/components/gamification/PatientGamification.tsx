'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PATIENT_BADGES, 
  type PatientBadge,
  type PatientGamificationData,
} from '@/lib/gamification';
import { Sparkles, Star, Trophy } from 'lucide-react';

interface FirstVisitCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

export function FirstVisitCelebration({ isOpen, onClose, patientName }: FirstVisitCelebrationProps) {
  const { width, height } = useWindowSize();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        {isOpen && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="py-6">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Welcome to KAPP, {patientName}!
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-2">
              We're so glad you're here! Your health journey with us starts now.
            </p>
            
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Achievement Unlocked!</span>
              </div>
              <Badge className="text-lg px-4 py-1">
                🎉 First Step Badge
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                You've taken the first step towards better health!
              </p>
            </div>

            <Button onClick={onClose} className="mt-6 w-full">
              Let's Get Started!
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface BadgeDisplayProps {
  badges: PatientBadge[];
  showLocked?: boolean;
}

export function BadgeDisplay({ badges, showLocked = false }: BadgeDisplayProps) {
  const allBadges = showLocked ? PATIENT_BADGES : badges;
  const earnedIds = new Set(badges.map(b => b.id));

  return (
    <div className="grid grid-cols-4 gap-3">
      {allBadges.map((badge) => {
        const isEarned = earnedIds.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.1 }}
            className={`flex flex-col items-center p-3 rounded-lg ${
              isEarned ? 'bg-primary/10' : 'bg-muted/30 opacity-50'
            }`}
            title={badge.description}
          >
            <span className={`text-2xl ${!isEarned && 'grayscale'}`}>
              {badge.icon}
            </span>
            <span className="text-xs text-center mt-1 font-medium">
              {badge.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg">
      <div className="text-4xl">🔥</div>
      <div>
        <p className="text-2xl font-bold">{currentStreak} Day Streak</p>
        <p className="text-sm text-muted-foreground">
          Best: {longestStreak} days
        </p>
      </div>
    </div>
  );
}

interface LevelProgressProps {
  xp: number;
  level: number;
}

export function LevelProgress({ xp, level }: LevelProgressProps) {
  const xpForNextLevel = level * 50;
  const xpInCurrentLevel = xp % 50;
  const progress = (xpInCurrentLevel / 50) * 100;

  return (
    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Level {level}</span>
        </div>
        <span className="text-sm text-muted-foreground">{xp} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="bg-primary h-2 rounded-full"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-right">
        {50 - xpInCurrentLevel} XP to Level {level + 1}
      </p>
    </div>
  );
}

interface NewBadgeToastProps {
  badge: PatientBadge | null;
  onClose: () => void;
}

export function NewBadgeToast({ badge, onClose }: NewBadgeToastProps) {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className="fixed bottom-4 right-4 z-50 p-4 bg-card border rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{badge.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">New Badge!</span>
              </div>
              <p className="font-medium">{badge.name}</p>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
