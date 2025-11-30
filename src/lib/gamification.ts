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
  // Extended levels for long-term engagement (500+ consultations)
  { level: 11, minXp: 7500, title: 'Healthcare Pioneer', color: 'bg-gradient-to-r from-purple-400 to-pink-500' },
  { level: 12, minXp: 10000, title: 'Healing Virtuoso', color: 'bg-gradient-to-r from-blue-400 to-purple-500' },
  { level: 13, minXp: 13000, title: 'Medical Maestro', color: 'bg-gradient-to-r from-green-400 to-blue-500' },
  { level: 14, minXp: 16500, title: 'Clinical Sage', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  { level: 15, minXp: 20500, title: 'Wellness Architect', color: 'bg-gradient-to-r from-pink-400 to-red-500' },
  { level: 16, minXp: 25000, title: 'Health Guardian', color: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
  { level: 17, minXp: 30000, title: 'Care Luminary', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
  { level: 18, minXp: 36000, title: 'Medical Prodigy', color: 'bg-gradient-to-r from-violet-400 to-purple-600' },
  { level: 19, minXp: 43000, title: 'Healing Grandmaster', color: 'bg-gradient-to-r from-rose-400 to-pink-600' },
  { level: 20, minXp: 50000, title: 'Healthcare Legend', color: 'bg-gradient-to-r from-yellow-300 via-amber-500 to-orange-600' },
  // Elite levels
  { level: 21, minXp: 60000, title: 'Platinum Healer', color: 'bg-gradient-to-r from-slate-300 to-slate-500' },
  { level: 22, minXp: 72000, title: 'Diamond Physician', color: 'bg-gradient-to-r from-cyan-200 via-blue-400 to-purple-500' },
  { level: 23, minXp: 85000, title: 'Emerald Expert', color: 'bg-gradient-to-r from-green-300 via-emerald-500 to-teal-600' },
  { level: 24, minXp: 100000, title: 'Ruby Master', color: 'bg-gradient-to-r from-red-300 via-rose-500 to-pink-600' },
  { level: 25, minXp: 120000, title: 'Sapphire Sage', color: 'bg-gradient-to-r from-blue-300 via-indigo-500 to-purple-600' },
  // Legendary levels
  { level: 26, minXp: 145000, title: 'Mythic Healer', color: 'bg-gradient-to-r from-fuchsia-300 via-purple-500 to-indigo-600' },
  { level: 27, minXp: 175000, title: 'Celestial Physician', color: 'bg-gradient-to-r from-sky-300 via-blue-500 to-indigo-600' },
  { level: 28, minXp: 210000, title: 'Immortal Doctor', color: 'bg-gradient-to-r from-amber-200 via-yellow-500 to-orange-600' },
  { level: 29, minXp: 250000, title: 'Eternal Guardian', color: 'bg-gradient-to-r from-rose-200 via-pink-500 to-red-600' },
  { level: 30, minXp: 300000, title: 'Supreme Healer', color: 'bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 animate-pulse' },
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
  
  // ===== EXTENDED ACHIEVEMENTS (20+ new elements) =====
  
  // High Volume Consultation Milestones
  {
    id: 'consultations-750',
    name: 'Healthcare Titan',
    description: 'Completed 750 consultations',
    icon: '🦾',
    category: 'consultations',
    tier: 'diamond',
    xpReward: 1500,
    requirement: 750,
  },
  {
    id: 'consultations-1000',
    name: 'Millennium Healer',
    description: 'Completed 1,000 consultations',
    icon: '🌟',
    category: 'consultations',
    tier: 'diamond',
    xpReward: 2500,
    requirement: 1000,
  },
  {
    id: 'consultations-2000',
    name: 'Healthcare Immortal',
    description: 'Completed 2,000 consultations',
    icon: '🏛️',
    category: 'consultations',
    tier: 'diamond',
    xpReward: 5000,
    requirement: 2000,
  },
  
  // Extended Patient Milestones
  {
    id: 'patients-250',
    name: 'Village Doctor',
    description: 'Treated 250 unique patients',
    icon: '🏡',
    category: 'patients',
    tier: 'platinum',
    xpReward: 500,
    requirement: 250,
  },
  {
    id: 'patients-500',
    name: 'Community Champion',
    description: 'Treated 500 unique patients',
    icon: '🌆',
    category: 'patients',
    tier: 'diamond',
    xpReward: 1000,
    requirement: 500,
  },
  {
    id: 'patients-1000',
    name: 'Regional Healthcare Hero',
    description: 'Treated 1,000 unique patients',
    icon: '🗺️',
    category: 'patients',
    tier: 'diamond',
    xpReward: 2000,
    requirement: 1000,
  },
  
  // Extended Streak Achievements
  {
    id: 'streak-60',
    name: 'Iron Will',
    description: '60 days with consultations in a row',
    icon: '🔩',
    category: 'streak',
    tier: 'diamond',
    xpReward: 1000,
    requirement: 60,
  },
  {
    id: 'streak-90',
    name: 'Quarterly Champion',
    description: '90 days with consultations in a row',
    icon: '📅',
    category: 'streak',
    tier: 'diamond',
    xpReward: 2000,
    requirement: 90,
  },
  {
    id: 'streak-180',
    name: 'Half-Year Hero',
    description: '180 days with consultations in a row',
    icon: '🌓',
    category: 'streak',
    tier: 'diamond',
    xpReward: 5000,
    requirement: 180,
  },
  {
    id: 'streak-365',
    name: 'Year-Round Warrior',
    description: '365 days with consultations in a row',
    icon: '🌍',
    category: 'streak',
    tier: 'diamond',
    xpReward: 10000,
    requirement: 365,
  },
  
  // Rating Achievements
  {
    id: 'rating-5-stars-10',
    name: 'Highly Rated',
    description: 'Received 10 five-star reviews',
    icon: '⭐',
    category: 'special',
    tier: 'silver',
    xpReward: 100,
    requirement: 10,
  },
  {
    id: 'rating-5-stars-50',
    name: 'Patient Favorite',
    description: 'Received 50 five-star reviews',
    icon: '🌟',
    category: 'special',
    tier: 'gold',
    xpReward: 300,
    requirement: 50,
  },
  {
    id: 'rating-5-stars-100',
    name: 'Excellence Embodied',
    description: 'Received 100 five-star reviews',
    icon: '💫',
    category: 'special',
    tier: 'platinum',
    xpReward: 750,
    requirement: 100,
  },
  {
    id: 'rating-5-stars-500',
    name: 'Legendary Reputation',
    description: 'Received 500 five-star reviews',
    icon: '👑',
    category: 'special',
    tier: 'diamond',
    xpReward: 2500,
    requirement: 500,
  },
  
  // Weekly Performance Achievements
  {
    id: 'weekly-10',
    name: 'Productive Week',
    description: 'Completed 10 consultations in a week',
    icon: '📈',
    category: 'special',
    tier: 'bronze',
    xpReward: 25,
    requirement: 10,
  },
  {
    id: 'weekly-25',
    name: 'Power Week',
    description: 'Completed 25 consultations in a week',
    icon: '🚀',
    category: 'special',
    tier: 'silver',
    xpReward: 75,
    requirement: 25,
  },
  {
    id: 'weekly-50',
    name: 'Superhuman Week',
    description: 'Completed 50 consultations in a week',
    icon: '💥',
    category: 'special',
    tier: 'gold',
    xpReward: 200,
    requirement: 50,
  },
  
  // Monthly Performance Achievements
  {
    id: 'monthly-50',
    name: 'Strong Month',
    description: 'Completed 50 consultations in a month',
    icon: '📊',
    category: 'special',
    tier: 'silver',
    xpReward: 100,
    requirement: 50,
  },
  {
    id: 'monthly-100',
    name: 'Century Month',
    description: 'Completed 100 consultations in a month',
    icon: '💯',
    category: 'special',
    tier: 'gold',
    xpReward: 300,
    requirement: 100,
  },
  {
    id: 'monthly-150',
    name: 'Marathon Month',
    description: 'Completed 150 consultations in a month',
    icon: '🏃',
    category: 'special',
    tier: 'platinum',
    xpReward: 600,
    requirement: 150,
  },
  
  // Connection Milestones (for 500+ connections)
  {
    id: 'connections-100',
    name: 'Network Builder',
    description: 'Connected with 100 patients via chat/video',
    icon: '🔗',
    category: 'patients',
    tier: 'silver',
    xpReward: 100,
    requirement: 100,
  },
  {
    id: 'connections-250',
    name: 'Communication Expert',
    description: 'Connected with 250 patients via chat/video',
    icon: '📡',
    category: 'patients',
    tier: 'gold',
    xpReward: 300,
    requirement: 250,
  },
  {
    id: 'connections-500',
    name: 'Digital Health Pioneer',
    description: 'Connected with 500 patients via chat/video',
    icon: '🌐',
    category: 'patients',
    tier: 'platinum',
    xpReward: 750,
    requirement: 500,
  },
  {
    id: 'connections-1000',
    name: 'Telemedicine Titan',
    description: 'Connected with 1,000 patients via chat/video',
    icon: '🛰️',
    category: 'patients',
    tier: 'diamond',
    xpReward: 2000,
    requirement: 1000,
  },
  
  // Specialty Achievements
  {
    id: 'prescription-master',
    name: 'Prescription Master',
    description: 'Written 100 prescriptions',
    icon: '💊',
    category: 'special',
    tier: 'silver',
    xpReward: 75,
    requirement: 100,
  },
  {
    id: 'prescription-expert',
    name: 'Prescription Expert',
    description: 'Written 500 prescriptions',
    icon: '📋',
    category: 'special',
    tier: 'gold',
    xpReward: 250,
    requirement: 500,
  },
  {
    id: 'records-keeper',
    name: 'Records Keeper',
    description: 'Created 100 medical records',
    icon: '📁',
    category: 'special',
    tier: 'silver',
    xpReward: 75,
    requirement: 100,
  },
  {
    id: 'records-archivist',
    name: 'Medical Archivist',
    description: 'Created 500 medical records',
    icon: '🗄️',
    category: 'special',
    tier: 'gold',
    xpReward: 250,
    requirement: 500,
  },
  
  // Time-based Achievements
  {
    id: 'loyal-physician-1',
    name: 'Loyal Physician',
    description: 'Active on the platform for 1 year',
    icon: '🎂',
    category: 'special',
    tier: 'gold',
    xpReward: 500,
    requirement: 365,
  },
  {
    id: 'loyal-physician-2',
    name: 'Veteran Physician',
    description: 'Active on the platform for 2 years',
    icon: '🎖️',
    category: 'special',
    tier: 'platinum',
    xpReward: 1000,
    requirement: 730,
  },
  {
    id: 'loyal-physician-5',
    name: 'Legendary Veteran',
    description: 'Active on the platform for 5 years',
    icon: '🏅',
    category: 'special',
    tier: 'diamond',
    xpReward: 5000,
    requirement: 1825,
  },
  
  // Special Time Achievements
  {
    id: 'lunch-hero',
    name: 'Lunch Break Hero',
    description: 'Completed a consultation during lunch hours (12-1 PM)',
    icon: '🍱',
    category: 'special',
    tier: 'bronze',
    xpReward: 10,
    requirement: 1,
  },
  {
    id: 'midnight-healer',
    name: 'Midnight Healer',
    description: 'Completed a consultation after midnight',
    icon: '🌙',
    category: 'special',
    tier: 'silver',
    xpReward: 25,
    requirement: 1,
  },
  {
    id: 'dawn-patrol',
    name: 'Dawn Patrol',
    description: 'Completed a consultation before 6 AM',
    icon: '🌄',
    category: 'special',
    tier: 'silver',
    xpReward: 25,
    requirement: 1,
  },
  
  // Team & Mentorship Achievements
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Collaborated on 10 patient cases with colleagues',
    icon: '🤝',
    category: 'special',
    tier: 'silver',
    xpReward: 50,
    requirement: 10,
  },
  {
    id: 'mentor-badge',
    name: 'Mentor',
    description: 'Helped onboard 5 new doctors',
    icon: '👨‍🏫',
    category: 'special',
    tier: 'gold',
    xpReward: 200,
    requirement: 5,
  },
  
  // Emergency Response
  {
    id: 'rapid-responder',
    name: 'Rapid Responder',
    description: 'Responded to an urgent consultation within 5 minutes',
    icon: '⚡',
    category: 'special',
    tier: 'silver',
    xpReward: 30,
    requirement: 1,
  },
  {
    id: 'emergency-hero',
    name: 'Emergency Hero',
    description: 'Handled 10 emergency consultations',
    icon: '🚑',
    category: 'special',
    tier: 'gold',
    xpReward: 150,
    requirement: 10,
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
