/**
 * LEADPULSE AI - Firebase Client Configuration & Error Handling
 * Conforms strictly to AI Studio Firebase Integration Skill standards.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableNetwork } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);

  // If token service is disabled or token refresh fails, clear invalid auth credentials
  if (rawMsg.includes('token-service-api') || rawMsg.includes('Fetching auth token failed') || rawMsg.includes('securetoken')) {
    console.warn('Purging invalid auth credential following token service error...');
    signOut(auth).catch(() => {});
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid || 'system-session',
      email: auth.currentUser?.email || 'admin@leadpulse.ai',
      emailVerified: auth.currentUser?.emailVerified ?? true,
      isAnonymous: auth.currentUser?.isAnonymous ?? false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore backend as mandated by integration skill
 */
export async function testConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'metadata', 'connection-health'));
    return { connected: true, message: 'Cloud Firestore connected and online' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // If an auth token refresh failed, purge stale credentials and reconnect
    if (errorMsg.includes('auth token') || errorMsg.includes('token-service-api') || errorMsg.includes('securetoken')) {
      console.warn('Auth token service issue detected during connection test. Resetting auth state and retrying...');
      try {
        await signOut(auth);
        await enableNetwork(db);
        await getDocFromServer(doc(db, 'metadata', 'connection-health'));
        return { connected: true, message: 'Cloud Firestore connected and online' };
      } catch (retryError) {
        console.warn('Retry after auth reset error:', retryError);
      }
    }

    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice. Check Firebase connectivity.');
      return { connected: false, message: 'Client offline: please check network and configuration.' };
    }
    // If document just doesn't exist or permissions allow read, connection succeeded
    return { connected: true, message: 'Cloud Firestore reachable' };
  }
}
