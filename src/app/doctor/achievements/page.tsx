'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDoc,
  useCollection,
  useFirebase,
  useMemoFirebase,
} from '@/firebase/hooks';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
  Trophy, 
  Flame, 
  Star, 
  Users, 
  Calendar,
  Sparkles,
  Lock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { 
  DOCTOR_ACHIEVEMENTS, 
  DOCTOR_LEVELS,
  calculateDoctorLevel,
  TIER_COLORS,
  type DoctorAchievement,
  type DoctorGamificationData,
} from '@/lib/gamification';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function DoctorAchievementsPage() {
  const { firestore, user } = useFirebase();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [newAchievement, setNewAchievement] = useState<DoctorAchievement | null>(null);

  // Fetch doctor gamification data
  const gamificationRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'doctors', user.uid, 'gamification', 'stats');
  }, [firestore, user]);

  const { data: gamificationData, isLoading: isLoadingGamification } = useDoc<DoctorGamificationData>(gamificationRef);

  // Fetch consultations count
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appointments'), orderBy('dateTime', 'desc'));
  }, [firestore, user]);

  const { data: appointments } = useCollection(appointmentsQuery);

  // Calculate stats
  const stats = useMemo(() => {
    const data = gamificationData || {
      xp: 0,
      level: 1,
      totalConsultations: 0,
      totalPatients: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
    };

    // If we have appointments, calculate from them
    if (appointments) {
      data.totalConsultations = appointments.filter((a: any) => 
        a.status === 'completed' || a.status === 'confirmed'
      ).length;
      
      // Count unique patients
      const uniquePatients = new Set(appointments.map((a: any) => a.patientId));
      data.totalPatients = uniquePatients.size;
    }

    const levelInfo = calculateDoctorLevel(data.xp || 0);

    return {
      ...data,
      ...levelInfo,
    };
  }, [gamificationData, appointments]);

  // Calculate earned achievements based on stats
  const { earnedAchievements, lockedAchievements } = useMemo(() => {
    const earned: DoctorAchievement[] = [];
    const locked: DoctorAchievement[] = [];

    DOCTOR_ACHIEVEMENTS.forEach((achievement) => {
      let isEarned = false;

      switch (achievement.category) {
        case 'consultations':
          isEarned = stats.totalConsultations >= achievement.requirement;
          break;
        case 'patients':
          isEarned = stats.totalPatients >= achievement.requirement;
          break;
        case 'streak':
          isEarned = stats.longestStreak >= achievement.requirement;
          break;
        default:
          // Special and holiday achievements need manual tracking
          isEarned = gamificationData?.achievements?.some((a: any) => a.id === achievement.id) || false;
      }

      if (isEarned) {
        earned.push(achievement);
      } else {
        locked.push(achievement);
      }
    });

    return { earnedAchievements: earned, lockedAchievements: locked };
  }, [stats, gamificationData]);

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const categories: Record<string, { earned: DoctorAchievement[], locked: DoctorAchievement[] }> = {
      consultations: { earned: [], locked: [] },
      patients: { earned: [], locked: [] },
      streak: { earned: [], locked: [] },
      special: { earned: [], locked: [] },
      holiday: { earned: [], locked: [] },
    };

    earnedAchievements.forEach((a) => categories[a.category].earned.push(a));
    lockedAchievements.forEach((a) => categories[a.category].locked.push(a));

    return categories;
  }, [earnedAchievements, lockedAchievements]);

  // Calculate total XP from earned achievements
  const totalXpFromAchievements = earnedAchievements.reduce((sum, a) => sum + a.xpReward, 0);

  if (isLoadingGamification) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements & Progress
        </h1>
        <p className="text-muted-foreground">
          Track your accomplishments and level up as you help more patients
        </p>
      </div>

      {/* Level Card */}
      <Card className="mb-6 overflow-hidden">
        <div className={`h-2 ${stats.color}`} />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Level</p>
              <h2 className="text-3xl font-bold">{stats.title}</h2>
              <p className="text-muted-foreground">Level {stats.level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total XP</p>
              <p className="text-3xl font-bold text-primary">{stats.xp?.toLocaleString() || totalXpFromAchievements}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {Math.min(stats.level + 1, 10)}</span>
              <span>{Math.round(stats.progress)}%</span>
            </div>
            <Progress value={stats.progress} className="h-3" />
            {stats.level < 10 && (
              <p className="text-xs text-muted-foreground text-right">
                {stats.nextLevelXp - (stats.xp || 0)} XP to next level
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsultations}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Unique patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">Consecutive days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnedAchievements.length}/{DOCTOR_ACHIEVEMENTS.length}
            </div>
            <p className="text-xs text-muted-foreground">Unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
          <CardDescription>
            Complete milestones to earn XP and unlock new titles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="consultations">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="streak">Streaks</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
              <TabsTrigger value="holiday">Holidays</TabsTrigger>
            </TabsList>

            {Object.entries(achievementsByCategory).map(([category, { earned, locked }]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="space-y-4">
                  {/* Earned Achievements */}
                  {earned.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Unlocked ({earned.length})
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {earned.map((achievement) => (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg border-2 ${TIER_COLORS[achievement.tier]}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{achievement.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{achievement.name}</h4>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {achievement.tier}
                                  </Badge>
                                </div>
                                <p className="text-sm opacity-80">{achievement.description}</p>
                                <p className="text-xs mt-1 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  +{achievement.xpReward} XP
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locked Achievements */}
                  {locked.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Locked ({locked.length})
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {locked.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="p-4 rounded-lg border bg-muted/30 opacity-60"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl grayscale">{achievement.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{achievement.name}</h4>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {achievement.tier}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  +{achievement.xpReward} XP
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {earned.length === 0 && locked.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No achievements in this category yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Leveling Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Level Progression
          </CardTitle>
          <CardDescription>
            Your journey from Resident to Medical Legend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DOCTOR_LEVELS.map((level, index) => (
              <div
                key={level.level}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  stats.level === level.level ? 'bg-primary/10 border border-primary' : 'bg-muted/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${level.color}`}>
                  {level.level}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{level.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {level.minXp.toLocaleString()} XP required
                  </p>
                </div>
                {stats.level >= level.level && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
