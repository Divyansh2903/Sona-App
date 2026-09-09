import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { env } from '@/config/env';

/**
 * Firebase singletons, guarded so Fast Refresh cannot re-initialize them.
 * Firestore is an index/cache; the chain is the source of truth for ownership.
 */
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(env.firebase) : getApp();

/**
 * Anonymous auth must survive cold starts — a uid that changed every launch would
 * strand the documents it created. `initializeAuth` throws if auth already exists
 * (Fast Refresh), hence the fallback.
 */
function createAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth: Auth = createAuth();
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
