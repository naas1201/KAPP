'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let firestore: Firestore;

if (getApps().length === 0) {
    try {
        app = initializeApp();
    } catch (e) {
        if (process.env.NODE_ENV === "production") {
            console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        app = initializeApp(firebaseConfig);
    }
} else {
    app = getApp();
}

auth = getAuth(app);
firestore = getFirestore(app);


export function initializeFirebase() {
  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore,
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
