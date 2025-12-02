'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthTip {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: string;
}

// Static health tips for Philippines context - production ready
const healthTipsLibrary: HealthTip[] = [
  {
    id: '1',
    title: 'Stay Hydrated',
    content: 'In the Philippine tropical climate, aim for 8-10 glasses of water daily. Add calamansi for vitamin C boost!',
    icon: '💧',
    category: 'general_wellness',
  },
  {
    id: '2',
    title: 'Sun Protection',
    content: 'Apply SPF 30+ sunscreen daily, even on cloudy days. Reapply every 2 hours when outdoors.',
    icon: '☀️',
    category: 'skin_care',
  },
  {
    id: '3',
    title: 'Local Superfoods',
    content: 'Include malunggay, kamote, and saba in your diet - these local superfoods are packed with nutrients!',
    icon: '🥬',
    category: 'nutrition',
  },
  {
    id: '4',
    title: 'Quality Sleep',
    content: 'Aim for 7-8 hours of sleep. Keep your room cool and dark - use blackout curtains if needed.',
    icon: '😴',
    category: 'general_wellness',
  },
  {
    id: '5',
    title: 'Regular Check-ups',
    content: 'Schedule annual health screenings. Early detection is key to preventing serious conditions.',
    icon: '🩺',
    category: 'preventive_care',
  },
  {
    id: '6',
    title: 'Manage Stress',
    content: 'Practice deep breathing for 5 minutes daily. Find a quiet moment during merienda time to relax.',
    icon: '🧘',
    category: 'general_wellness',
  },
  {
    id: '7',
    title: 'Post-Treatment Care',
    content: 'After aesthetic treatments, avoid direct sunlight and follow your doctor\'s aftercare instructions carefully.',
    icon: '✨',
    category: 'aesthetic_aftercare',
  },
  {
    id: '8',
    title: 'Stay Active',
    content: 'Walk for 30 minutes daily - try morning walks to avoid the midday heat. SM malls are great for air-conditioned exercise!',
    icon: '🚶',
    category: 'general_wellness',
  },
  {
    id: '9',
    title: 'Skin Barrier Health',
    content: 'Use gentle cleansers and moisturize daily. The humid climate doesn\'t mean your skin doesn\'t need hydration.',
    icon: '🧴',
    category: 'skin_care',
  },
  {
    id: '10',
    title: 'Dengue Prevention',
    content: 'Use mosquito repellent and eliminate standing water around your home, especially during rainy season.',
    icon: '🦟',
    category: 'preventive_care',
  },
];

interface HealthTipsWidgetProps {
  patientName?: string;
  category?: string;
}

export function HealthTipsWidget({ patientName, category }: HealthTipsWidgetProps) {
  const [currentTips, setCurrentTips] = useState<HealthTip[]>([]);
  const [featuredTip, setFeaturedTip] = useState<HealthTip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shuffleTips = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      // Filter by category if provided, otherwise use all
      let filteredTips = category 
        ? healthTipsLibrary.filter(t => t.category === category)
        : healthTipsLibrary;
      
      // Shuffle and pick 3 random tips
      const shuffled = [...filteredTips].sort(() => Math.random() - 0.5);
      setCurrentTips(shuffled.slice(0, 3));
      setFeaturedTip(shuffled[0] || null);
      setIsLoading(false);
    }, 500);
  }, [category]);

  useEffect(() => {
    shuffleTips();
  }, [shuffleTips]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Health Tips</CardTitle>
              <CardDescription>
                Personalized wellness advice for you{patientName ? `, ${patientName}` : ''}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffleTips}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatePresence mode="wait">
          {featuredTip && (
            <motion.div
              key={featuredTip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{featuredTip.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{featuredTip.title}</h4>
                    <Badge variant="secondary" className="text-xs">Featured</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{featuredTip.content}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {currentTips.slice(1).map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-xl">{tip.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{tip.title}</h4>
                <p className="text-xs text-muted-foreground">{tip.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            💡 Health tips are for general wellness information only.
            Consult your doctor for personalized medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or smaller spaces
export function HealthTipBanner() {
  const [tip, setTip] = useState<HealthTip | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * healthTipsLibrary.length);
    setTip(healthTipsLibrary[randomIndex]);
  }, []);

  if (!tip) return null;

  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
      <div className="flex items-center gap-2 mb-1">
        <span>{tip.icon}</span>
        <span className="text-xs font-medium text-green-700 dark:text-green-300">Daily Tip</span>
      </div>
      <p className="text-xs text-muted-foreground">{tip.content}</p>
    </div>
  );
}
