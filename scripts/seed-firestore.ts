/**
 * Seed Firestore with initial data
 * 
 * This script creates the 'treatments' collection with all default procedures.
 * Run with: npm run seed:firestore
 * 
 * Prerequisites:
 * 1. Place your Firebase Admin SDK service account key as 'service-account.json' in the project root
 * 2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Check for service account file
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

let app: App;
if (getApps().length === 0) {
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Using service account from service-account.json');
    app = initializeApp({
      credential: cert(serviceAccountPath),
      projectId: 'studio-8822072999-a4137'
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using service account from GOOGLE_APPLICATION_CREDENTIALS');
    app = initializeApp({
      projectId: 'studio-8822072999-a4137'
    });
  } else {
    console.error('❌ No service account found!');
    console.error('Please either:');
    console.error('1. Place your service-account.json file in the project root');
    console.error('2. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('\nTo get a service account:');
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('2. Click "Generate new private key"');
    console.error('3. Save the file as service-account.json in the project root');
    process.exit(1);
  }
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);

// Default treatments/procedures
const treatments = [
  {
    name: 'Annual Physical Exam',
    description: 'A comprehensive check-up to assess your overall health and prevent potential health issues.',
    category: 'General Medicine'
  },
  {
    name: 'Vaccinations',
    description: 'Stay protected with essential vaccinations for flu, HPV, pneumonia, and more.',
    category: 'General Medicine'
  },
  {
    name: 'Chronic Disease Management',
    description: 'Ongoing care and support for managing conditions like diabetes, hypertension, and asthma.',
    category: 'General Medicine'
  },
  {
    name: 'Minor Injury Care',
    description: 'Treatment for non-life-threatening injuries such as cuts, sprains, and minor burns.',
    category: 'General Medicine'
  },
  {
    name: 'Botox Injections',
    description: 'Smooth out wrinkles and fine lines for a refreshed, youthful appearance.',
    category: 'Aesthetic'
  },
  {
    name: 'Dermal Fillers',
    description: 'Restore volume, contour facial features, and soften creases with hyaluronic acid fillers.',
    category: 'Aesthetic'
  },
  {
    name: 'Chemical Peels',
    description: 'Improve skin texture and tone by removing the outermost layers of the skin.',
    category: 'Aesthetic'
  },
  {
    name: 'Microneedling with PRP',
    description: "Stimulate collagen production and enhance skin repair using your body's own growth factors.",
    category: 'Aesthetic'
  },
  {
    name: 'Dermatology Consultation',
    description: 'Expert consultation for skin conditions, acne, eczema, and other dermatological concerns.',
    category: 'Dermatology'
  },
  {
    name: 'Skin Cancer Screening',
    description: 'Comprehensive skin examination to detect early signs of skin cancer and melanoma.',
    category: 'Dermatology'
  }
];

async function seedTreatments(): Promise<void> {
  console.log('\n📋 Seeding treatments collection...');
  
  // Check if treatments already exist
  const existingTreatments = await db.collection('treatments').get();
  if (!existingTreatments.empty) {
    console.log(`   Found ${existingTreatments.size} existing treatments`);
    console.log('   Skipping treatments seeding to avoid duplicates');
    console.log('   To re-seed, delete the treatments collection first');
    return;
  }
  
  for (const treatment of treatments) {
    const docRef = await db.collection('treatments').add(treatment);
    console.log(`   ✓ Added: ${treatment.name} (${docRef.id})`);
  }
  
  console.log(`✅ Added ${treatments.length} treatments`);
}

async function seedDefaultDoctor(): Promise<void> {
  console.log('\n👨‍⚕️ Checking default doctor...');
  
  const doctorId = 'default-doctor-id';
  const doctorRef = db.collection('doctors').doc(doctorId);
  const doctorDoc = await doctorRef.get();
  
  if (doctorDoc.exists) {
    console.log('   Default doctor already exists, skipping...');
    return;
  }
  
  await doctorRef.set({
    firstName: 'Katheryne',
    lastName: 'Castillo',
    email: 'dr.castillo@example.com',
    displayName: 'Dr. Katheryne Castillo',
    specialization: 'General & Aesthetic Medicine',
    bio: 'Board-certified physician specializing in general medicine and aesthetic treatments.',
    gamification: {
      xp: 0,
      level: 1,
      totalConsultations: 0,
      totalPatients: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: new Date()
    },
    createdAt: new Date()
  });
  
  console.log('   ✓ Created default doctor profile');
  console.log('✅ Default doctor seeded');
}

async function main(): Promise<void> {
  console.log('🌱 Starting Firestore database seeding...');
  console.log(`   Project: studio-8822072999-a4137`);
  
  try {
    await seedTreatments();
    await seedDefaultDoctor();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/procedures to manage treatments');
    console.log('2. Visit /doctor/my-services to configure doctor services');
    console.log('3. Book an appointment to test the system');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
