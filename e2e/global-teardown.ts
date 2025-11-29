import fs from 'fs';
import path from 'path';
import { teardownSeeded } from './utils/firestore-emulator';

export default async function globalTeardown() {
  const outPath = path.resolve(__dirname, '.seed.json');
  console.log('[e2e] globalTeardown: reading seed file...');
  if (!fs.existsSync(outPath)) {
    console.log('[e2e] no seed file found, skipping teardown');
    return;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const seeded: string[] = payload.seeded || [];
    await teardownSeeded(seeded);
    fs.unlinkSync(outPath);
    console.log('[e2e] teardown complete');
  } catch (err) {
    console.warn('[e2e] teardown error', err);
  }
}
