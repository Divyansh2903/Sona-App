import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { env } from '@/config/env';

/**
 * Firebase singletons (SONA_TECHNICAL_PLAN.md §2).
 * Firestore is an index/cache — the chain is the source of truth for ownership (§6.7).
 *
 * Every accessor is guarded so Fast Refresh does not re-initialize.
 */
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(env.firebase) : getApp();

/**
 * Anonymous auth must survive cold starts: §4 keys Firestore rules off the
 * wallet mapped to the session uid, so a uid that changes every launch would
 * orphan the mapping. `initializeAuth` throws if auth was already created
 * (Fast Refresh), hence the fallback to `getAuth`.
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
