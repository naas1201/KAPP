'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

// If using local emulators during development/e2e, connect the client SDKs to them.
if (typeof window !== 'undefined') {
  const fsHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (fsHost) {
    import('firebase/firestore')
      .then(({ connectFirestoreEmulator }) => {
        try {
          const [host, portStr] = fsHost.split(':');
          const port = portStr ? Number(portStr) : 8080;
          connectFirestoreEmulator(firestore, host, port);
          // eslint-disable-next-line no-console
          console.log('Connected Firestore client to emulator', fsHost);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to connect Firestore emulator', e);
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('Failed dynamic import of firestore connector', e);
      });
  }
  if (authHost) {
    import('firebase/auth')
      .then(({ connectAuthEmulator }) => {
        try {
          const url = authHost.startsWith('http') ? authHost : `http://${authHost}`;
          connectAuthEmulator(auth, url);
          // eslint-disable-next-line no-console
          console.log('Connected Auth client to emulator', url);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to connect Auth emulator', e);
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('Failed dynamic import of auth connector', e);
      });
  }
}

export { firebaseApp, auth, firestore };
