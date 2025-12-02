'use client';

import { Shield, Award, Clock, Users, CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Licensed & Verified',
    description: 'Board-certified physicians with verified credentials',
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: 'Quality Assured',
    description: 'Following international medical standards',
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: '24/7 Support',
    description: 'Round-the-clock patient care assistance',
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: '1000+ Patients',
    description: 'Trusted by patients across the Philippines',
  },
];

const certifications = [
  { name: 'DOH Licensed', verified: true },
  { name: 'PMA Member', verified: true },
  { name: 'PAFPRS Certified', verified: true },
  { name: 'CPD Compliant', verified: true },
];

export function TrustIndicators() {
  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center p-6 text-center rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-3 mb-3 rounded-full bg-primary/10 text-primary">
                {badge.icon}
              </div>
              <h3 className="font-semibold text-sm md:text-base">{badge.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Certifications Bar */}
        <div className="mt-8 py-4 px-6 bg-card rounded-xl border">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                {cert.verified && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span>{cert.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Summary */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-5 h-5 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">4.9/5</span> average
            rating from <span className="font-semibold">500+</span> patient
            reviews
          </p>
        </div>
      </div>
    </section>
  );
}

export function VerifiedDoctorBadge({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ${className}`}
    >
      <CheckCircle className="w-3.5 h-3.5" />
      <span>Verified Physician</span>
    </div>
  );
}

export function SecureBookingBadge() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Shield className="w-4 h-4 text-green-500" />
      <span>Secure & Confidential Booking</span>
    </div>
  );
}
