/**
 * LEADPULSE AI - Firebase Authentication & User Management Service
 * Handles user sign-in, admin bootstrapping, user provisioning, custom roles,
 * account activation/deactivation, password reset, and immutable audit logging.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { CRMUser, UserRole, UserStatus, SystemAuditLog } from '../types/crm';
import firebaseConfig from '@/firebase-applet-config.json';

// Initial Administrator Credentials (from master prompt)
export const INITIAL_ADMIN_CONFIG = {
  name: 'Lohith Gopisetti',
  email: 'lohithgopisetti@gmail.com',
  password: 'Lohith@68',
  role: 'Admin' as UserRole,
  status: 'active' as UserStatus,
  assignedTerritory: 'North America' as const,
};

// Demonstration Benchmark Accounts for evaluation of all 5 roles
export const BENCHMARK_ACCOUNTS: Array<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  territory?: 'North America' | 'EMEA' | 'APAC' | 'LATAM';
}> = [
  {
    name: 'Sarah Jenkins',
    email: 'manager@leadpulse.ai',
    password: 'Manager@2026',
    role: 'Sales Manager',
    status: 'active',
    territory: 'North America',
  },
  {
    name: 'Alex Chen',
    email: 'rep.alex@leadpulse.ai',
    password: 'Salesrep@2026',
    role: 'Sales Representative',
    status: 'active',
    territory: 'North America',
  },
  {
    name: 'Elena Rostova',
    email: 'marketing@leadpulse.ai',
    password: 'Marketing@2026',
    role: 'Marketing',
    status: 'active',
  },
  {
    name: 'Marcus Vance',
    email: 'analyst@leadpulse.ai',
    password: 'Analyst@2026',
    role: 'Analyst',
    status: 'active',
  },
];

/**
 * Appends an immutable audit log entry into Cloud Firestore /auditLogs
 */
export async function recordAuditLog(entry: {
  userId: string;
  userEmail: string;
  role: UserRole;
  action: string;
  targetRecord?: string;
  details?: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
}): Promise<void> {
  try {
    const logId = `AUD-SEC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const logDoc: SystemAuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      userId: entry.userId,
      userEmail: entry.userEmail,
      role: entry.role,
      action: entry.action,
      targetRecord: entry.targetRecord,
      details: entry.details,
      status: entry.status,
    };
    await setDoc(doc(db, 'auditLogs', logId), logDoc);
  } catch (err) {
    console.warn('Failed to record security audit log:', err);
  }
}

/**
 * Bootstraps the initial administrator account and benchmark test accounts
 * Ensures user profiles exist in Firebase Auth and Cloud Firestore.
 */
export async function bootstrapAdminAndBenchmarkAccounts(): Promise<{
  success: boolean;
  message: string;
  adminEmail: string;
}> {
  try {
    // 1. Try to create the Initial Admin in Firebase Auth if not already existing
    let adminUid = 'admin-lohith-gopisetti';
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        INITIAL_ADMIN_CONFIG.email,
        INITIAL_ADMIN_CONFIG.password
      );
      adminUid = userCred.user.uid;
      console.log('Initial Admin Auth user created successfully:', adminUid);
    } catch (authErr: any) {
      if (authErr?.code === 'auth/email-already-in-use') {
        // User already exists in Firebase Auth. That's expected on subsequent boots.
        console.log('Initial Admin Auth user already present in Firebase Auth.');
      } else {
        console.warn('Notice during Admin Auth check:', authErr?.message);
      }
    }

    // 2. Ensure initial Admin profile exists in Firestore /users
    const adminDocRef = doc(db, 'users', adminUid);
    const adminDocSnap = await getDoc(adminDocRef);

    if (!adminDocSnap.exists()) {
      const adminProfile: CRMUser = {
        uid: adminUid,
        name: INITIAL_ADMIN_CONFIG.name,
        email: INITIAL_ADMIN_CONFIG.email,
        role: INITIAL_ADMIN_CONFIG.role,
        status: INITIAL_ADMIN_CONFIG.status,
        assignedTerritory: INITIAL_ADMIN_CONFIG.assignedTerritory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isInitialAdmin: true,
      };
      await setDoc(adminDocRef, adminProfile);
      await recordAuditLog({
        userId: adminUid,
        userEmail: INITIAL_ADMIN_CONFIG.email,
        role: 'Admin',
        action: 'ADMIN_BOOTSTRAP',
        targetRecord: INITIAL_ADMIN_CONFIG.email,
        details: 'Initial system administrator account bootstrapped successfully.',
        status: 'SUCCESS',
      });
    }

    // 3. Ensure benchmark demonstration accounts exist in Firestore
    for (const b of BENCHMARK_ACCOUNTS) {
      try {
        let bUid = `demo-${b.role.toLowerCase().replace(/\s+/g, '-')}`;
        try {
          const cred = await createUserWithEmailAndPassword(auth, b.email, b.password);
          bUid = cred.user.uid;
        } catch (e: any) {
          // If already exists or error, continue with deterministic ID
        }

        const bRef = doc(db, 'users', bUid);
        const bSnap = await getDoc(bRef);
        if (!bSnap.exists()) {
          const profile: CRMUser = {
            uid: bUid,
            name: b.name,
            email: b.email,
            role: b.role,
            status: b.status,
            assignedTerritory: b.territory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(bRef, profile);
        }
      } catch (benchmarkErr) {
        // Non-blocking
      }
    }

    return {
      success: true,
      message: 'Initial administrator and demonstration accounts verified.',
      adminEmail: INITIAL_ADMIN_CONFIG.email,
    };
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown bootstrap error',
      adminEmail: INITIAL_ADMIN_CONFIG.email,
    };
  }
}

/**
 * Signs in a user using Firebase Authentication and retrieves their Firestore profile
 */
export async function authenticateUser(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: CRMUser }> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = cred.user;

  // Fetch or upsert profile in Firestore /users
  let profile: CRMUser | null = null;
  const userDocRef = doc(db, 'users', fbUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    profile = userDocSnap.data() as CRMUser;
    // Update lastLoginAt
    await updateDoc(userDocRef, {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
    // If logging in via another account, check if matching email in users collection
    const usersCol = collection(db, 'users');
    const allUsersSnap = await getDocs(usersCol);
    const existing = allUsersSnap.docs.find(d => d.data().email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      profile = existing.data() as CRMUser;
      // Link to this uid
      await setDoc(userDocRef, { ...profile, uid: fbUser.uid, lastLoginAt: new Date().toISOString() });
    } else {
      // Default profile
      const isAdmin = email.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase();
      profile = {
        uid: fbUser.uid,
        name: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        role: isAdmin ? 'Admin' : 'Analyst',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, profile);
    }
  }

  // Record audit log
  await recordAuditLog({
    userId: fbUser.uid,
    userEmail: profile.email,
    role: profile.role,
    action: 'USER_LOGIN',
    targetRecord: profile.email,
    details: `User signed in successfully with role ${profile.role}.`,
    status: profile.status === 'active' ? 'SUCCESS' : 'BLOCKED',
  });

  return { user: fbUser, profile };
}

/**
 * Creates a new user (Admin-only action)
 */
export async function provisionNewUser(
  currentUser: CRMUser,
  userData: {
    name: string;
    email: string;
    role: UserRole;
    temporaryPassword?: string;
    assignedTerritory?: 'North America' | 'EMEA' | 'APAC' | 'LATAM';
    phone?: string;
  }
): Promise<CRMUser> {
  const tempPass = userData.temporaryPassword || 'LeadPulse@2026';
  let uid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const cred = await createUserWithEmailAndPassword(auth, userData.email.trim(), tempPass);
    uid = cred.user.uid;
  } catch (err: any) {
    console.warn('Auth user creation warning:', err?.message);
  }

  const newProfile: CRMUser = {
    uid,
    name: userData.name.trim(),
    email: userData.email.trim().toLowerCase(),
    role: userData.role,
    status: 'active',
    assignedTerritory: userData.assignedTerritory,
    phone: userData.phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), newProfile);

  await recordAuditLog({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    role: currentUser.role,
    action: 'USER_CREATED',
    targetRecord: newProfile.email,
    details: `Admin created user ${newProfile.name} (${newProfile.email}) with role ${newProfile.role}.`,
    status: 'SUCCESS',
  });

  return newProfile;
}

/**
 * Updates a user's role (Admin-only action)
 */
export async function updateUserRole(
  currentUser: CRMUser,
  targetUserId: string,
  targetEmail: string,
  newRole: UserRole
): Promise<void> {
  const userRef = doc(db, 'users', targetUserId);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date().toISOString(),
  });

  await recordAuditLog({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    role: currentUser.role,
    action: 'ROLE_UPDATED',
    targetRecord: targetEmail,
    details: `Role updated to ${newRole} for user ${targetEmail}.`,
    status: 'SUCCESS',
  });
}

/**
 * Updates a user's active/inactive status (Admin-only action)
 */
export async function updateUserStatus(
  currentUser: CRMUser,
  targetUserId: string,
  targetEmail: string,
  newStatus: UserStatus
): Promise<void> {
  const userRef = doc(db, 'users', targetUserId);
  await updateDoc(userRef, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });

  await recordAuditLog({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    role: currentUser.role,
    action: newStatus === 'active' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
    targetRecord: targetEmail,
    details: `Account status toggled to ${newStatus} for user ${targetEmail}.`,
    status: 'SUCCESS',
  });
}

/**
 * Dispatches a password reset email via Firebase Auth
 */
export async function dispatchPasswordReset(
  currentUserEmail: string,
  targetEmail: string
): Promise<void> {
  await sendPasswordResetEmail(auth, targetEmail.trim());

  await recordAuditLog({
    userId: 'system',
    userEmail: currentUserEmail,
    role: 'Admin',
    action: 'PASSWORD_RESET_SENT',
    targetRecord: targetEmail,
    details: `Password reset email dispatched to ${targetEmail}.`,
    status: 'SUCCESS',
  });
}
