import fs from 'fs';
import path from 'path';
import { seedBookingAppointment } from './utils/firestore-emulator';

export default async function globalSetup() {
  const outPath = path.resolve(__dirname, '.seed.json');
  console.log('[e2e] globalSetup: seeding firestore emulator...');

  try {
    const res = await seedBookingAppointment();
    fs.writeFileSync(outPath, JSON.stringify(res, null, 2));
    console.log('[e2e] seeded:', res);
  } catch (err) {
    console.warn('[e2e] globalSetup: could not seed emulator — continuing without seeded data', (err as any)?.message || err);

    // Write a minimal seed file so tests know seeding was attempted but failed.
    try {
      fs.writeFileSync(outPath, JSON.stringify({ seeded: [] }, null, 2));
    } catch (writeErr) {
      console.warn('[e2e] globalSetup: failed to write seed file', writeErr);
    }
  }

  return;
}
