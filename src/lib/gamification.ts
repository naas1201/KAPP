// Gamification types and constants for medical clinic app

// ===== PATIENT GAMIFICATION =====
export interface PatientBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'special' | 'health';
  earnedAt?: string;
}

export interface PatientGamificationData {
  firstVisitCelebrated?: boolean;
  appointmentStreak: number;
  longestStreak: number;
  totalAppointments: number;
  badges: PatientBadge[];
  xp: number;
  level: number;
  lastAppointmentDate?: string;
}

export const PATIENT_BADGES: PatientBadge[] = [
  {
    id: 'first-visit',
    name: 'First Step',
    description: 'Completed your first appointment',
    icon: '🎉',
    category: 'milestone',
  },
  {
    id: 'health-hero-5',
    name: 'Health Hero',
    description: 'Completed 5 appointments',
    icon: '🏥',
    category: 'milestone',
  },
  {
    id: 'wellness-warrior-10',
    name: 'Wellness Warrior',
    description: 'Completed 10 appointments',
    icon: '⚔️',
    category: 'milestone',
  },
  {
    id: 'streak-3',
    name: 'On a Roll',
    description: 'Maintained a 3-appointment streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: 'streak-5',
    name: 'Consistency Champion',
    description: 'Maintained a 5-appointment streak',
    icon: '🏆',
    category: 'streak',
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Booked an appointment for a morning slot',
    icon: '🌅',
    category: 'special',
  },
  {
    id: 'prepared-patient',
    name: 'Prepared Patient',
    description: 'Added notes before your appointment',
    icon: '📝',
    category: 'health',
  },
  {
    id: 'profile-complete',
    name: 'Profile Pro',
    description: 'Completed your patient profile',
    icon: '✅',
    category: 'health',
  },
];

// ===== DOCTOR GAMIFICATION =====
export interface DoctorAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'consultations' | 'patients' | 'streak' | 'special' | 'holiday';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xpReward: number;
  requirement: number;
  earnedAt?: string;
}

export interface DoctorGamificationData {
  xp: number;
  level: number;
  totalConsultations: number;
  totalPatients: number;
  weeklyConsultations: number;
  monthlyConsultations: number;
  currentStreak: number;
  longestStreak: number;
  achievements: DoctorAchievement[];
  lastConsultationDate?: string;
  joinedAt?: string;
}

export const DOCTOR_LEVELS = [
  { level: 1, minXp: 0, title: 'Resident', color: 'bg-gray-500' },
  { level: 2, minXp: 100, title: 'Junior Physician', color: 'bg-green-500' },
  { level: 3, minXp: 300, title: 'Physician', color: 'bg-blue-500' },
  { level: 4, minXp: 600, title: 'Senior Physician', color: 'bg-purple-500' },
  { level: 5, minXp: 1000, title: 'Specialist', color: 'bg-yellow-500' },
  { level: 6, minXp: 1500, title: 'Senior Specialist', color: 'bg-orange-500' },
  { level: 7, minXp: 2200, title: 'Expert', color: 'bg-red-500' },
  { level: 8, minXp: 3000, title: 'Master Physician', color: 'bg-pink-500' },
  { level: 9, minXp: 4000, title: 'Chief Physician', color: 'bg-indigo-500' },
  { level: 10, minXp: 5500, title: 'Medical Legend', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' },
];

export const DOCTOR_ACHIEVEMENTS: DoctorAchievement[] = [
  // Consultation Milestones
  {
    id: 'first-consultation',
    name: 'First Patient',
    description: 'Completed your first consultation',
    icon: '👨‍⚕️',
    category: 'consultations',
    tier: 'bronze',
    xpReward: 10,
    requirement: 1,
  },
  {
    id: 'consultations-10',
    name: 'Getting Started',
    description: 'Completed 10 consultations',
    icon: '🩺',
    category: 'consultations',
    tier: 'bronze',
    xpReward: 25,
    requirement: 10,
  },
  {
    id: 'consultations-25',
    name: 'Rising Star',
    description: 'Completed 25 consultations',
    icon: '⭐',
    category: 'consultations',
    tier: 'silver',
    xpReward: 50,
    requirement: 25,
  },
  {
    id: 'consultations-50',
    name: 'Trusted Doctor',
    description: 'Completed 50 consultations',
    icon: '🌟',
    category: 'consultations',
    tier: 'gold',
    xpReward: 100,
    requirement: 50,
  },
  {
    id: 'consultations-100',
    name: 'Healing Hands',
    description: 'Completed 100 consultations',
    icon: '🙌',
    category: 'consultations',
    tier: 'gold',
    xpReward: 200,
    requirement: 100,
  },
  {
    id: 'consultations-250',
    name: 'Care Champion',
    description: 'Completed 250 consultations',
    icon: '🏅',
    category: 'consultations',
    tier: 'platinum',
    xpReward: 500,
    requirement: 250,
  },
  {
    id: 'consultations-500',
    name: 'Medical Marvel',
    description: 'Completed 500 consultations',
    icon: '💫',
    category: 'consultations',
    tier: 'diamond',
    xpReward: 1000,
    requirement: 500,
  },
  
  // Patient Milestones
  {
    id: 'patients-5',
    name: 'Building Trust',
    description: 'Treated 5 unique patients',
    icon: '👥',
    category: 'patients',
    tier: 'bronze',
    xpReward: 20,
    requirement: 5,
  },
  {
    id: 'patients-25',
    name: 'Growing Practice',
    description: 'Treated 25 unique patients',
    icon: '👨‍👩‍👧‍👦',
    category: 'patients',
    tier: 'silver',
    xpReward: 75,
    requirement: 25,
  },
  {
    id: 'patients-100',
    name: 'Community Healer',
    description: 'Treated 100 unique patients',
    icon: '🏘️',
    category: 'patients',
    tier: 'gold',
    xpReward: 250,
    requirement: 100,
  },
  
  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Consistent Care',
    description: '3 days with consultations in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    xpReward: 15,
    requirement: 3,
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: '7 days with consultations in a row',
    icon: '💪',
    category: 'streak',
    tier: 'silver',
    xpReward: 50,
    requirement: 7,
  },
  {
    id: 'streak-14',
    name: 'Dedication Master',
    description: '14 days with consultations in a row',
    icon: '🏆',
    category: 'streak',
    tier: 'gold',
    xpReward: 150,
    requirement: 14,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: '30 days with consultations in a row',
    icon: '👑',
    category: 'streak',
    tier: 'platinum',
    xpReward: 500,
    requirement: 30,
  },
  
  // Special Achievements
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Completed a consultation on a weekend',
    icon: '🗓️',
    category: 'special',
    tier: 'bronze',
    xpReward: 10,
    requirement: 1,
  },
  {
    id: 'early-start',
    name: 'Early Bird Doctor',
    description: 'Started a consultation before 8 AM',
    icon: '🌅',
    category: 'special',
    tier: 'bronze',
    xpReward: 15,
    requirement: 1,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Completed a consultation after 8 PM',
    icon: '🦉',
    category: 'special',
    tier: 'bronze',
    xpReward: 15,
    requirement: 1,
  },
  {
    id: 'perfect-review',
    name: 'Perfect Review',
    description: 'Received a 5-star review from a patient',
    icon: '⭐',
    category: 'special',
    tier: 'gold',
    xpReward: 50,
    requirement: 1,
  },
  
  // Holiday Achievements (Philippines specific)
  {
    id: 'new-year',
    name: 'New Year Healer',
    description: 'Worked on New Year\'s Day',
    icon: '🎆',
    category: 'holiday',
    tier: 'gold',
    xpReward: 100,
    requirement: 1,
  },
  {
    id: 'christmas',
    name: 'Christmas Angel',
    description: 'Worked on Christmas Day',
    icon: '🎄',
    category: 'holiday',
    tier: 'gold',
    xpReward: 100,
    requirement: 1,
  },
  {
    id: 'independence-day',
    name: 'Independence Day Hero',
    description: 'Worked on June 12 (PH Independence Day)',
    icon: '🇵🇭',
    category: 'holiday',
    tier: 'gold',
    xpReward: 75,
    requirement: 1,
  },
  {
    id: 'heroes-day',
    name: 'Heroes\' Day Champion',
    description: 'Worked on National Heroes Day',
    icon: '🦸',
    category: 'holiday',
    tier: 'gold',
    xpReward: 75,
    requirement: 1,
  },
  {
    id: 'bonifacio-day',
    name: 'Bonifacio Day Warrior',
    description: 'Worked on Bonifacio Day (Nov 30)',
    icon: '⚔️',
    category: 'holiday',
    tier: 'gold',
    xpReward: 75,
    requirement: 1,
  },
  {
    id: 'rizal-day',
    name: 'Rizal Day Scholar',
    description: 'Worked on Rizal Day (Dec 30)',
    icon: '📖',
    category: 'holiday',
    tier: 'gold',
    xpReward: 75,
    requirement: 1,
  },
  {
    id: 'holy-week',
    name: 'Holy Week Guardian',
    description: 'Worked during Holy Week',
    icon: '✝️',
    category: 'holiday',
    tier: 'platinum',
    xpReward: 150,
    requirement: 1,
  },
  {
    id: 'all-saints',
    name: 'All Saints Caregiver',
    description: 'Worked on All Saints\' Day',
    icon: '👼',
    category: 'holiday',
    tier: 'gold',
    xpReward: 75,
    requirement: 1,
  },
];

// Helper functions
export function calculateDoctorLevel(xp: number): { level: number; title: string; color: string; progress: number; nextLevelXp: number } {
  let currentLevel = DOCTOR_LEVELS[0];
  let nextLevel = DOCTOR_LEVELS[1];
  
  for (let i = DOCTOR_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= DOCTOR_LEVELS[i].minXp) {
      currentLevel = DOCTOR_LEVELS[i];
      nextLevel = DOCTOR_LEVELS[i + 1] || DOCTOR_LEVELS[i];
      break;
    }
  }
  
  const xpInCurrentLevel = xp - currentLevel.minXp;
  const xpNeededForNextLevel = nextLevel.minXp - currentLevel.minXp;
  const progress = xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100;
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    color: currentLevel.color,
    progress: Math.min(progress, 100),
    nextLevelXp: nextLevel.minXp,
  };
}

export function calculatePatientLevel(xp: number): number {
  // Simple level calculation: every 50 XP = 1 level
  return Math.floor(xp / 50) + 1;
}

export const TIER_COLORS = {
  bronze: 'text-orange-700 bg-orange-100 border-orange-300',
  silver: 'text-gray-600 bg-gray-100 border-gray-300',
  gold: 'text-yellow-700 bg-yellow-100 border-yellow-400',
  platinum: 'text-blue-700 bg-blue-100 border-blue-400',
  diamond: 'text-purple-700 bg-purple-100 border-purple-400',
};
