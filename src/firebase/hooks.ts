
'use client';

import { useState, useEffect, useMemo, type DependencyList } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import {
  onSnapshot,
  doc,
  query,
  collection,
  type DocumentData,
  type DocumentReference,
  type Query,
  type Firestore,
  type CollectionReference,
} from 'firebase/firestore';
import { auth, firestore } from './client';

// --- Auth Hooks ---

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, isLoading, error };
}

export function useAuth() {
  return auth;
}

// --- Firestore Hooks ---

export function useFirestore() {
    return firestore;
}

export type WithId<T> = T & { id: string };
export type WithIdAndPath<T> = T & { id: string; _path: string };

export function useDoc<T>(docRef: DocumentReference<T> | DocumentReference<any> | null | undefined) {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...(snapshot.data() as T) });
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        console.error(`Error fetching document at ${docRef.path}:`, err);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, isLoading, error };
}

export function useCollection<T>(queryRef: Query<T> | Query<any> | CollectionReference<T> | CollectionReference<any> | null | undefined) {
  const [data, setData] = useState<WithIdAndPath<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!queryRef) {
        setData(null);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          _path: d.ref.path,
          ...(d.data() as T),
        }));
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        console.error(`Error fetching collection:`, err);
      }
    );

    return () => unsubscribe();
  }, [queryRef]);

  return { data, isLoading, error };
}

export function useFirebase() {
    const { user, isLoading, error } = useUser();
    return {
        firebaseApp: auth.app,
        auth,
        firestore,
        user,
        isUserLoading: isLoading,
        userError: error
    }
}


export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps || []);
}
