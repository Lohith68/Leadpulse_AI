/**
 * LEADPULSE AI - Global Authentication & RBAC Authorization Context
 * Manages Firebase Auth session, user profile, authoritative roles,
 * Admin 5-role preview mode, and granular permission checking.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { CRMUser, UserRole, UserStatus, PermissionAction, Resource } from '../types/crm';
import {
  authenticateUser,
  bootstrapAdminAndBenchmarkAccounts,
  dispatchPasswordReset,
  INITIAL_ADMIN_CONFIG,
  recordAuditLog,
} from '../services/authService';
import { hasPermission, getAuthorizedNavItems, navIdToResource } from '../services/rbacService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: CRMUser | null;
  actualRole: UserRole;
  activeRole: UserRole;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  isDemoMode: boolean;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  status: UserStatus;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  can: (action: PermissionAction, resource: Resource) => boolean;
  canAccessNav: (navId: string) => boolean;
  bootstrapComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<CRMUser | null>(null);
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [bootstrapComplete, setBootstrapComplete] = useState<boolean>(false);

  // Run initial bootstrap on mount
  useEffect(() => {
    let mounted = true;
    bootstrapAdminAndBenchmarkAccounts()
      .then(() => {
        if (mounted) setBootstrapComplete(true);
      })
      .catch(err => {
        console.warn('Initial admin bootstrap check notice:', err);
        if (mounted) setBootstrapComplete(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        setCurrentUser(fbUser);
        // Subscribe to user's profile document in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeProfile = onSnapshot(
          userDocRef,
          async docSnap => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as CRMUser);
            } else {
              // Create default profile doc if not yet existing
              const isAdmin = fbUser.email?.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase();
              const initialProfile: CRMUser = {
                uid: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                email: fbUser.email || '',
                role: isAdmin ? 'Admin' : 'Analyst',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
            }
            setIsLoadingAuth(false);
          },
          error => {
            console.warn('Profile sync notice:', error.message);
            // Fallback profile if offline
            const isAdmin = fbUser.email?.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase();
            setUserProfile({
              uid: fbUser.uid,
              name: fbUser.displayName || 'CRM User',
              email: fbUser.email || '',
              role: isAdmin ? 'Admin' : 'Analyst',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setIsLoadingAuth(false);
          }
        );
        return () => unsubscribeProfile();
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setPreviewRoleState(null);
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Compute actual vs active role
  const actualRole: UserRole = useMemo(() => {
    if (userProfile?.role) return userProfile.role;
    if (currentUser?.email?.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase()) return 'Admin';
    return 'Analyst';
  }, [userProfile, currentUser]);

  // Demo mode is ONLY valid if the authentic user is an Admin
  const isDemoMode = useMemo(() => {
    return actualRole === 'Admin' && previewRole !== null && previewRole !== 'Admin';
  }, [actualRole, previewRole]);

  // Effective role for UI checks
  const activeRole: UserRole = useMemo(() => {
    if (actualRole === 'Admin' && previewRole) {
      return previewRole;
    }
    return actualRole;
  }, [actualRole, previewRole]);

  const setPreviewRole = useCallback(
    (role: UserRole | null) => {
      if (actualRole !== 'Admin') {
        console.warn('Unauthorized attempt to set preview role: current user is not an Admin');
        return;
      }
      setPreviewRoleState(role);
    },
    [actualRole]
  );

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoadingAuth(true);
    try {
      const { user, profile } = await authenticateUser(email, pass);
      setCurrentUser(user);
      setUserProfile(profile);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (currentUser && userProfile) {
      await recordAuditLog({
        userId: currentUser.uid,
        userEmail: userProfile.email,
        role: userProfile.role,
        action: 'USER_LOGOUT',
        targetRecord: userProfile.email,
        details: 'User logged out of LeadPulse AI.',
        status: 'SUCCESS',
      });
    }
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setPreviewRoleState(null);
  }, [currentUser, userProfile]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      await dispatchPasswordReset(userProfile?.email || 'system@leadpulse.ai', email);
    },
    [userProfile]
  );

  const can = useCallback(
    (action: PermissionAction, resource: Resource) => {
      return hasPermission(activeRole, action, resource);
    },
    [activeRole]
  );

  const canAccessNav = useCallback(
    (navId: string) => {
      const authorizedNavs = getAuthorizedNavItems(activeRole);
      return authorizedNavs.includes(navId);
    },
    [activeRole]
  );

  const status: UserStatus = userProfile?.status || 'active';
  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        actualRole,
        activeRole,
        previewRole,
        setPreviewRole,
        isDemoMode,
        isAuthenticated,
        isLoadingAuth,
        status,
        login,
        logout,
        sendPasswordReset,
        can,
        canAccessNav,
        bootstrapComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
