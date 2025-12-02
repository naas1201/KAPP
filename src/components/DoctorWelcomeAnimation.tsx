'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Sun, Stethoscope, Star, Coffee, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Motivational quotes for healthcare professionals
const motivationalQuotes = [
  {
    quote: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "William Osler",
    icon: Stethoscope
  },
  {
    quote: "Wherever the art of medicine is loved, there is also a love of humanity.",
    author: "Hippocrates",
    icon: Heart
  },
  {
    quote: "The greatest medicine of all is teaching people how not to need it.",
    author: "Hippocrates",
    icon: Sparkles
  },
  {
    quote: "Healing is a matter of time, but it is sometimes also a matter of opportunity.",
    author: "Hippocrates",
    icon: Sun
  },
  {
    quote: "Medicine is not only a science; it is also an art. It does not consist of compounding pills but in the intangible power that inspires hope.",
    author: "Paracelsus",
    icon: Star
  },
  {
    quote: "The art of medicine consists of amusing the patient while nature cures the disease.",
    author: "Voltaire",
    icon: Smile
  },
  {
    quote: "Let food be thy medicine and medicine be thy food.",
    author: "Hippocrates",
    icon: Coffee
  },
  {
    quote: "To cure sometimes, to relieve often, to comfort always.",
    author: "Hippocrates",
    icon: Heart
  },
  {
    quote: "The doctor of the future will give no medicine, but will interest his patient in the care of the human frame.",
    author: "Thomas Edison",
    icon: Sparkles
  },
  {
    quote: "Medicine cures the man who is fated not to die.",
    author: "Chinese Proverb",
    icon: Sun
  }
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Configuration constants
const QUOTE_SHOW_DELAY_MS = 800;
const AUTO_DISMISS_DELAY_MS = 6000;

interface DoctorWelcomeAnimationProps {
  doctorName?: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function DoctorWelcomeAnimation({ 
  doctorName = 'Doctor', 
  onDismiss,
  autoDismissMs = AUTO_DISMISS_DELAY_MS 
}: DoctorWelcomeAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [quote, setQuote] = useState<typeof motivationalQuotes[0] | null>(null);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    // Check if we've already shown the welcome today
    const lastWelcome = localStorage.getItem('kapp_doctor_last_welcome');
    const today = new Date().toDateString();
    
    if (lastWelcome === today) {
      setIsVisible(false);
      return;
    }

    // Select a random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);

    // Show quote after greeting animation
    const quoteTimer = setTimeout(() => {
      setShowQuote(true);
    }, QUOTE_SHOW_DELAY_MS);

    // Auto-dismiss after configured delay
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => {
      clearTimeout(quoteTimer);
      clearTimeout(dismissTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    const today = new Date().toDateString();
    localStorage.setItem('kapp_doctor_last_welcome', today);
    onDismiss?.();
  };

  if (!isVisible || !quote) return null;

  const IconComponent = quote.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-w-lg mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20 shadow-xl">
              <CardContent className="pt-8 pb-6 px-8">
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, damping: 15 }}
                  className="mb-4"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: 2, duration: 0.5, delay: 0.5 }}
                    >
                      <IconComponent className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Greeting */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold font-headline mb-2"
                >
                  {getGreeting()}, {doctorName}! 👋
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  Ready to make a difference today
                </motion.p>

                {/* Quote */}
                <AnimatePresence>
                  {showQuote && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border-t border-primary/20 pt-6"
                    >
                      <motion.blockquote
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base italic text-foreground/80 mb-2"
                      >
                        "{quote.quote}"
                      </motion.blockquote>
                      <motion.cite
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-muted-foreground not-italic"
                      >
                        — {quote.author}
                      </motion.cite>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dismiss Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6"
                >
                  <Button onClick={handleDismiss} className="px-8">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Let's Go!
                  </Button>
                </motion.div>

                {/* Skip hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-xs text-muted-foreground mt-4"
                >
                  Click anywhere to dismiss
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
