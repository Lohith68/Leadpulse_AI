/**
 * LEADPULSE AI - CRM Global Context & State Store
 * Real-time synchronization with Cloud Firestore.
 * Supports complete CRUD operations, automated score recalculations, stage transitions,
 * audit scanning, validation reporting, and role simulation.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import {
  Company,
  Contact,
  Lead,
  Campaign,
  Activity,
  Consent,
  ScoreRule,
  SalesRep,
  Task,
  Opportunity,
  StageHistory,
  Anomaly,
  GroundTruthRecord,
  UserRole,
  ValidationReport,
  EvaluationMetrics,
  ConsentStatus,
  OpportunityStage,
} from '../types/crm';
import { calculateLeadScore } from '../services/leadScoringEngine';
import { validateLeadConsent, createConsentEvent } from '../services/consentService';
import { validateTerritoryAssignment } from '../services/routingService';
import { generateAutomatedTask } from '../services/taskAutomationService';
import { transitionOpportunityStage, createOpportunityRecord } from '../services/opportunityService';
import { auditDatabaseAnomalies } from '../services/anomalyDetectionService';
import { runFullSystemValidation } from '../services/validationService';
import { runModelEvaluation } from '../services/evaluationEngine';
import {
  generateSyntheticDataset,
  seedFirestoreInBatches,
  GeneratedDataset,
  GeneratorMode,
  BatchProgress,
  verifyFirestoreRecordCounts,
} from '../services/syntheticDataGenerator';

interface CRMContextType {
  // Live Data
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  campaigns: Campaign[];
  activities: Activity[];
  consents: Consent[];
  scoreRules: ScoreRule[];
  salesReps: SalesRep[];
  tasks: Task[];
  opportunities: Opportunity[];
  stageHistories: StageHistory[];
  anomalies: Anomaly[];
  groundTruth: GroundTruthRecord[];

  // State & Loading
  isLoading: boolean;
  isSeeding: boolean;
  seedingProgress: BatchProgress | null;
  isPaused: boolean;
  pauseSeeding: () => void;
  resumeSeeding: () => void;
  cancelSeeding: () => void;
  dbConnected: boolean;
  connectionStatus: string;

  // Server-Side Verification
  liveServerCounts: Record<string, number> | null;
  isVerifyingServer: boolean;
  lastVerifiedAt: string | null;
  verifyLiveCounts: () => Promise<Record<string, number>>;

  // Auth State
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Role Simulation
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Actions
  seedDatabase: (modeOrCount?: GeneratorMode | number) => Promise<void>;
  createLead: (leadData: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  createCompany: (company: Company) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  createContact: (contact: Contact) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  createActivity: (activityData: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  updateLeadConsent: (leadId: string, newStatus: ConsentStatus, channel?: string) => Promise<void>;
  assignRepToLead: (leadId: string, repId: string) => Promise<{ success: boolean; message: string }>;
  advanceOpportunity: (
    oppId: string,
    toStage: OpportunityStage,
    reasons?: { wonReason?: string; lostReason?: string; note?: string }
  ) => Promise<void>;
  createOpportunityFromLead: (leadId: string, dealName: string, dealValue: number) => Promise<Opportunity>;
  createManualTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  resolveAnomaly: (anomalyId: string) => Promise<void>;
  recalculateLeadScoreAction: (leadId: string) => Promise<void>;
  runIntegrityAudit: () => Promise<void>;

  // Reports
  validationReport: ValidationReport;
  evaluationMetrics: EvaluationMetrics;
  refreshValidation: () => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [scoreRules, setScoreRules] = useState<ScoreRule[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stageHistories, setStageHistories] = useState<StageHistory[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [groundTruth, setGroundTruth] = useState<GroundTruthRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [seedingProgress, setSeedingProgress] = useState<BatchProgress | null>(null);
  const [liveServerCounts, setLiveServerCounts] = useState<Record<string, number> | null>(null);
  const [isVerifyingServer, setIsVerifyingServer] = useState<boolean>(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const signalRef = useRef<{ isPaused: boolean; isCancelled: boolean }>({ isPaused: false, isCancelled: false });
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [user, setUser] = useState<User | null>(auth.currentUser);

  // Monitor Firebase Auth state with token service resilience
  useEffect(() => {
    // Proactively verify cached user session on mount
    if (auth.currentUser) {
      auth.currentUser.getIdToken().catch(async (err: unknown) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('token-service-api') || errMsg.includes('Fetching auth token failed') || errMsg.includes('securetoken')) {
          console.warn('Proactively purges stale auth credential on boot due to token service error.');
          try {
            await signOut(auth);
          } catch (_) {}
          setUser(null);
        }
      });
    }

    const unsubAuth = onAuthStateChanged(auth, async u => {
      if (u) {
        try {
          await u.getIdToken();
          setUser(u);
        } catch (tokenErr: unknown) {
          const errMsg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
          if (errMsg.includes('token-service-api') || errMsg.includes('Fetching auth token failed') || errMsg.includes('securetoken')) {
            console.warn('Auth token service error on state change. Purging stale session...');
            try {
              await signOut(auth);
            } catch (_) {}
            setUser(null);
            return;
          }
          setUser(u);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  // Verify connection once on mount
  useEffect(() => {
    testConnection().then(res => {
      setDbConnected(res.connected);
      setConnectionStatus(res.message);
    });
  }, []);

  // Real-time Firestore Listeners with proper error handlers conforming to skill
  useEffect(() => {
    const safeError = (err: unknown, op: OperationType, path: string) => {
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (rawMsg.includes('token-service-api') || rawMsg.includes('Fetching auth token failed') || rawMsg.includes('securetoken')) {
        console.warn(`Firestore token error on ${path}, purging invalid auth session...`);
        signOut(auth).catch(() => {});
      }
      try {
        handleFirestoreError(err, op, path);
      } catch (e) {
        console.warn(`Firestore Error caught for ${path}:`, e);
      }
    };

    const unsubCompanies = onSnapshot(
      collection(db, 'companies'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Company);
        setCompanies(list);
      },
      err => safeError(err, OperationType.LIST, 'companies')
    );

    const unsubContacts = onSnapshot(
      collection(db, 'contacts'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Contact);
        setContacts(list);
      },
      err => safeError(err, OperationType.LIST, 'contacts')
    );

    const unsubLeads = onSnapshot(
      collection(db, 'leads'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Lead);
        setLeads(list);
        setIsLoading(false);
      },
      err => safeError(err, OperationType.LIST, 'leads')
    );

    const unsubCampaigns = onSnapshot(
      collection(db, 'campaigns'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Campaign);
        setCampaigns(list);
      },
      err => safeError(err, OperationType.LIST, 'campaigns')
    );

    const unsubActivities = onSnapshot(
      collection(db, 'activities'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Activity);
        setActivities(list);
      },
      err => safeError(err, OperationType.LIST, 'activities')
    );

    const unsubConsents = onSnapshot(
      collection(db, 'consents'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Consent);
        setConsents(list);
      },
      err => safeError(err, OperationType.LIST, 'consents')
    );

    const unsubScoreRules = onSnapshot(
      collection(db, 'scoreRules'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as ScoreRule);
        setScoreRules(list);
      },
      err => safeError(err, OperationType.LIST, 'scoreRules')
    );

    const unsubSalesReps = onSnapshot(
      collection(db, 'salesReps'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as SalesRep);
        setSalesReps(list);
      },
      err => safeError(err, OperationType.LIST, 'salesReps')
    );

    const unsubTasks = onSnapshot(
      collection(db, 'tasks'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Task);
        setTasks(list);
      },
      err => safeError(err, OperationType.LIST, 'tasks')
    );

    const unsubOpportunities = onSnapshot(
      collection(db, 'opportunities'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Opportunity);
        setOpportunities(list);
      },
      err => safeError(err, OperationType.LIST, 'opportunities')
    );

    const unsubStageHistories = onSnapshot(
      collection(db, 'stageHistories'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as StageHistory);
        setStageHistories(list);
      },
      err => safeError(err, OperationType.LIST, 'stageHistories')
    );

    const unsubAnomalies = onSnapshot(
      collection(db, 'anomalies'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as Anomaly);
        setAnomalies(list);
      },
      err => safeError(err, OperationType.LIST, 'anomalies')
    );

    const unsubGroundTruth = onSnapshot(
      collection(db, 'groundTruth'),
      snapshot => {
        const list = snapshot.docs.map(doc => doc.data() as GroundTruthRecord);
        setGroundTruth(list);
      },
      err => safeError(err, OperationType.LIST, 'groundTruth')
    );

    return () => {
      unsubCompanies();
      unsubContacts();
      unsubLeads();
      unsubCampaigns();
      unsubActivities();
      unsubConsents();
      unsubScoreRules();
      unsubSalesReps();
      unsubTasks();
      unsubOpportunities();
      unsubStageHistories();
      unsubAnomalies();
      unsubGroundTruth();
    };
  }, []);

  // Independent Server-Side Verification Action
  const verifyLiveCounts = useCallback(async (): Promise<Record<string, number>> => {
    setIsVerifyingServer(true);
    try {
      const res = await verifyFirestoreRecordCounts();
      setLiveServerCounts(res.counts);
      setLastVerifiedAt(res.timestamp);
      return res.counts;
    } catch (err) {
      console.error('Failed to verify live Firestore counts:', err);
      return {};
    } finally {
      setIsVerifyingServer(false);
    }
  }, []);

  const pauseSeeding = useCallback(() => {
    signalRef.current.isPaused = true;
    setIsPaused(true);
  }, []);

  const resumeSeeding = useCallback(() => {
    signalRef.current.isPaused = false;
    setIsPaused(false);
  }, []);

  const cancelSeeding = useCallback(() => {
    signalRef.current.isCancelled = true;
    setIsPaused(false);
    setIsSeeding(false);
    setSeedingProgress(null);
  }, []);

  // Database Seed Action supporting Benchmark (200) and Full (20,000) modes
  const seedDatabase = useCallback(async (modeOrCount: GeneratorMode | number = 'BENCHMARK') => {
    setIsSeeding(true);
    setIsPaused(false);
    signalRef.current = { isPaused: false, isCancelled: false };

    setSeedingProgress({
      phase: 'initialization',
      current: 0,
      total: 100,
      percentage: 0,
      batchIndex: 0,
      totalBatches: 0,
      message: 'Generating synthetic dataset with Mulberry32 PRNG (SEED = 20261022)...',
      isPaused: false,
    });

    try {
      let config: { mode: GeneratorMode; leadCount?: number; companyCount?: number; contactCount?: number; opportunityCount?: number };
      if (typeof modeOrCount === 'string') {
        config = { mode: modeOrCount };
      } else if (modeOrCount === 200) {
        config = { mode: 'BENCHMARK' };
      } else if (modeOrCount >= 10000) {
        config = { mode: 'FULL' };
      } else {
        config = {
          mode: 'BENCHMARK',
          leadCount: modeOrCount,
          companyCount: Math.max(30, Math.floor(modeOrCount * 0.25)),
          contactCount: Math.max(50, Math.floor(modeOrCount * 0.5)),
          opportunityCount: Math.max(25, Math.floor(modeOrCount * 0.3)),
        };
      }

      const generated = generateSyntheticDataset({
        ...config,
        injectAnomalies: true,
      });

      // Optimistically update in-memory state so dashboard immediately renders the dataset
      setCompanies(generated.companies);
      setContacts(generated.contacts);
      setCampaigns(generated.campaigns);
      setSalesReps(generated.salesReps);
      setScoreRules(generated.scoreRules);
      setLeads(generated.leads);
      setActivities(generated.activities);
      setConsents(generated.consents);
      setTasks(generated.tasks);
      setOpportunities(generated.opportunities);
      setStageHistories(generated.stageHistories);
      setAnomalies(generated.anomalies);
      setGroundTruth(generated.groundTruth);
      setIsLoading(false);

      const writeResult = await seedFirestoreInBatches(generated, {
        signal: signalRef.current,
        onProgress: progress => {
          setSeedingProgress(progress);
        },
      });

      if (!writeResult.success && signalRef.current.isCancelled) {
        setSeedingProgress(null);
        return;
      }

      // Automatically run independent server-side count verification via getCountFromServer
      await verifyLiveCounts();
      setSeedingProgress(null);
    } catch (error) {
      console.error('Seeding encountered an error:', error);
      setSeedingProgress({
        phase: 'error',
        current: 0,
        total: 100,
        percentage: 0,
        batchIndex: 0,
        totalBatches: 0,
        message: `Seeding error: ${error instanceof Error ? error.message : String(error)}`,
        isPaused: false,
      });
    } finally {
      setIsSeeding(false);
      setIsPaused(false);
    }
  }, [verifyLiveCounts]);

  // Lead CRUD
  const createLead = useCallback(
    async (leadData: Partial<Lead>): Promise<Lead> => {
      const seq = leads.length + 1;
      const id = `LEAD-2026-${String(seq).padStart(6, '0')}`;
      const now = new Date().toISOString();

      const company = companies.find(c => c.id === leadData.companyId);
      const contact = contacts.find(c => c.id === leadData.contactId);

      if (!company || !contact) {
        throw new Error('Valid Company and Contact are required to create a Lead.');
      }

      const scoring = calculateLeadScore({
        company,
        contact,
        activities: [],
      });

      const newLead: Lead = {
        id,
        companyId: company.id,
        contactId: contact.id,
        campaignId: leadData.campaignId || 'CMP-000001',
        assignedRepId: leadData.assignedRepId || 'REP-001',
        productInterest: leadData.productInterest || 'Enterprise Cloud',
        territory: company.territory,
        fitScore: scoring.fitScore,
        intentScore: scoring.intentScore,
        engagementScore: scoring.engagementScore,
        totalScore: scoring.totalScore,
        scoreCategory: scoring.category,
        scoreBreakdown: scoring.scoreBreakdown,
        consentStatus: leadData.consentStatus || 'OPTED_IN',
        lifecycleStatus: 'NEW',
        routingStatus: leadData.assignedRepId ? 'ASSIGNED' : 'UNASSIGNED',
        lastScoredAt: now,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'leads', id), newLead);

        // Auto task creation if eligible
        const taskRes = generateAutomatedTask(newLead, tasks);
        if (taskRes.task) {
          await setDoc(doc(db, 'tasks', taskRes.task.id), taskRes.task);
        }

        // Log initial consent record
        const consentEvent = createConsentEvent(id, newLead.consentStatus, 'ALL', 'WEB_FORM', 'Sales Ingestion');
        await setDoc(doc(db, 'consents', consentEvent.id), consentEvent);

        return newLead;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `leads/${id}`);
      }
    },
    [leads, companies, contacts, tasks]
  );

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      const ref = doc(db, 'leads', id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${id}`);
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${id}`);
    }
  }, []);

  // Company CRUD
  const createCompany = useCallback(async (company: Company) => {
    try {
      await setDoc(doc(db, 'companies', company.id), company);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `companies/${company.id}`);
    }
  }, []);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    try {
      await updateDoc(doc(db, 'companies', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${id}`);
    }
  }, []);

  // Contact CRUD
  const createContact = useCallback(async (contact: Contact) => {
    try {
      await setDoc(doc(db, 'contacts', contact.id), contact);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `contacts/${contact.id}`);
    }
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      await updateDoc(doc(db, 'contacts', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contacts/${id}`);
    }
  }, []);

  // Activity Log & Score Recalculation
  const createActivity = useCallback(
    async (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
      const lead = leads.find(l => l.id === activityData.leadId);
      if (!lead) throw new Error(`Lead ${activityData.leadId} not found.`);

      const leadActivities = activities.filter(a => a.leadId === lead.id);
      const seq = String(leadActivities.length + 1).padStart(3, '0');
      const actId = `ACT-${lead.id}-${seq}`;
      const now = new Date().toISOString();

      const newActivity: Activity = {
        ...activityData,
        id: actId,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, 'activities', actId), newActivity);

        // Recalculate lead score immediately
        const company = companies.find(c => c.id === lead.companyId);
        const contact = contacts.find(c => c.id === lead.contactId);
        if (company && contact) {
          const updatedActs = [...leadActivities, newActivity];
          const scoring = calculateLeadScore({
            company,
            contact,
            activities: updatedActs,
            conversionTimestamp: lead.conversionTimestamp,
          });

          await updateDoc(doc(db, 'leads', lead.id), {
            fitScore: scoring.fitScore,
            intentScore: scoring.intentScore,
            engagementScore: scoring.engagementScore,
            totalScore: scoring.totalScore,
            scoreCategory: scoring.category,
            scoreBreakdown: scoring.scoreBreakdown,
            lastScoredAt: now,
            updatedAt: now,
          });

          // Check if temporal leakage occurred
          if (scoring.temporalLeakageDetected) {
            const anom: Anomaly = {
              id: `ANOM-LEAKAGE-${actId}`,
              type: 'POST_CONVERSION_ACTIVITY_USED_IN_SCORE',
              severity: 'HIGH',
              affectedEntity: 'Activity',
              affectedRecordId: actId,
              expectedDecision: 'EXCLUDE_FROM_HISTORICAL_SCORE',
              actualDecision: 'ACTIVITY_LOGGED_POST_CONVERSION',
              isGroundTruth: false,
              status: 'BLOCKED',
              details: `Activity ${actId} was registered post-conversion. The scoring engine automatically excluded it from historical score calculation.`,
              timestamp: now,
            };
            await setDoc(doc(db, 'anomalies', anom.id), anom);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `activities/${actId}`);
      }
    },
    [leads, activities, companies, contacts]
  );

  // Consent Management
  const updateLeadConsent = useCallback(
    async (leadId: string, newStatus: ConsentStatus, channel: string = 'ALL') => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const consentEvent = createConsentEvent(
        leadId,
        newStatus,
        (channel as any) || 'ALL',
        newStatus === 'OPTED_OUT' ? 'MANUAL_REQUEST' : 'PREFERENCE_CENTER',
        `User Role: ${currentRole}`
      );

      try {
        await setDoc(doc(db, 'consents', consentEvent.id), consentEvent);
        await updateDoc(doc(db, 'leads', leadId), {
          consentStatus: newStatus,
          updatedAt: new Date().toISOString(),
        });

        // If opted out or withdrawn, auto-cancel active pending tasks
        if (newStatus === 'OPTED_OUT' || newStatus === 'WITHDRAWN') {
          const leadTasks = tasks.filter(t => t.leadId === leadId && (t.status === 'PENDING' || t.status === 'IN_PROGRESS'));
          for (const t of leadTasks) {
            await updateDoc(doc(db, 'tasks', t.id), {
              status: 'CANCELLED',
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${leadId}/consent`);
      }
    },
    [leads, tasks, currentRole]
  );

  // Sales Rep Routing & Assignment
  const assignRepToLead = useCallback(
    async (leadId: string, repId: string): Promise<{ success: boolean; message: string }> => {
      const lead = leads.find(l => l.id === leadId);
      const rep = salesReps.find(r => r.id === repId);

      if (!lead || !rep) return { success: false, message: 'Invalid lead or rep ID.' };

      // Territory Guard Check
      const territoryCheck = validateTerritoryAssignment(lead, rep);
      if (!territoryCheck.valid && territoryCheck.anomaly) {
        // Record anomaly in database
        await setDoc(doc(db, 'anomalies', territoryCheck.anomaly.id), territoryCheck.anomaly);
        return {
          success: false,
          message: `Blocked out-of-territory assignment: Lead is in ${lead.territory}, but Rep is in ${rep.territory}. Anomaly logged.`,
        };
      }

      try {
        await updateDoc(doc(db, 'leads', leadId), {
          assignedRepId: repId,
          routingStatus: 'ASSIGNED',
          routingExceptionReason: null,
          updatedAt: new Date().toISOString(),
        });

        return { success: true, message: `Successfully assigned to ${rep.name} (${rep.territory}).` };
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
      }
    },
    [leads, salesReps]
  );

  // Opportunities & Stage Progression
  const createOpportunityFromLead = useCallback(
    async (leadId: string, dealName: string, dealValue: number): Promise<Opportunity> => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) throw new Error(`Lead ${leadId} not found.`);

      // Check single active opportunity invariant
      const activeOpp = opportunities.find(
        o => o.leadId === leadId && o.stage !== 'WON' && o.stage !== 'LOST'
      );
      if (activeOpp) {
        const anom: Anomaly = {
          id: `ANOM-DUPOPP-${Date.now()}`,
          type: 'DUPLICATE_OPPORTUNITY_CREATED',
          severity: 'CRITICAL',
          affectedEntity: 'Opportunity',
          affectedRecordId: activeOpp.id,
          expectedDecision: 'PREVENT_DUPLICATE_CREATION',
          actualDecision: 'BLOCKED_DUPLICATE_CREATION_ATTEMPT',
          isGroundTruth: false,
          status: 'BLOCKED',
          details: `Blocked attempt to create a second opportunity for lead ${leadId}. Existing active opportunity: ${activeOpp.id}.`,
          timestamp: new Date().toISOString(),
        };
        await setDoc(doc(db, 'anomalies', anom.id), anom);
        throw new Error(`Lead ${leadId} already has an active opportunity (${activeOpp.id}). Duplicate creation blocked.`);
      }

      const seq = opportunities.length + 1;
      const { opportunity, initialStageHistory } = createOpportunityRecord(lead, dealName, dealValue, 45, seq);

      try {
        await setDoc(doc(db, 'opportunities', opportunity.id), opportunity);
        await setDoc(doc(db, 'stageHistories', initialStageHistory.id), initialStageHistory);

        // Update lead converted status
        await updateDoc(doc(db, 'leads', leadId), {
          lifecycleStatus: 'CONVERTED',
          convertedOpportunityId: opportunity.id,
          conversionTimestamp: opportunity.createdAt,
          updatedAt: new Date().toISOString(),
        });

        return opportunity;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `opportunities/${opportunity.id}`);
      }
    },
    [leads, opportunities]
  );

  const advanceOpportunity = useCallback(
    async (
      oppId: string,
      toStage: OpportunityStage,
      reasons?: { wonReason?: string; lostReason?: string; note?: string }
    ) => {
      const opp = opportunities.find(o => o.id === oppId);
      if (!opp) throw new Error(`Opportunity ${oppId} not found.`);

      const { updatedOpportunity, newStageHistory } = transitionOpportunityStage(opp, stageHistories, {
        toStage,
        transitionReason: reasons?.note,
        wonReason: reasons?.wonReason,
        lostReason: reasons?.lostReason,
        changedBy: `User Role: ${currentRole}`,
      });

      try {
        await setDoc(doc(db, 'opportunities', oppId), updatedOpportunity);
        await setDoc(doc(db, 'stageHistories', newStageHistory.id), newStageHistory);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `opportunities/${oppId}`);
      }
    },
    [opportunities, stageHistories, currentRole]
  );

  // Tasks
  const createManualTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      const lead = leads.find(l => l.id === taskData.leadId);
      if (lead) {
        const consent = validateLeadConsent(lead);
        if (!consent.canContact) {
          throw new Error(`Task blocked by regulatory consent: ${consent.reason}`);
        }
      }

      const seq = tasks.filter(t => t.leadId === taskData.leadId).length + 1;
      const taskId = `TASK-${taskData.leadId}-${String(seq).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newTask: Task = {
        ...taskData,
        id: taskId,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'tasks', taskId), newTask);
        return newTask;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
      }
    },
    [leads, tasks]
  );

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status,
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  }, []);

  // Anomalies
  const resolveAnomaly = useCallback(async (anomalyId: string) => {
    try {
      await updateDoc(doc(db, 'anomalies', anomalyId), {
        status: 'RESOLVED',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `anomalies/${anomalyId}`);
    }
  }, []);

  const runIntegrityAudit = useCallback(async () => {
    const audit = auditDatabaseAnomalies(leads, opportunities, tasks, activities, salesReps, stageHistories);
    for (const a of audit.anomalies) {
      await setDoc(doc(db, 'anomalies', a.id), a, { merge: true });
    }
  }, [leads, opportunities, tasks, activities, salesReps, stageHistories]);

  const recalculateLeadScoreAction = useCallback(
    async (leadId: string) => {
      const lead = leads.find(l => l.id === leadId);
      const company = companies.find(c => c.id === lead?.companyId);
      const contact = contacts.find(c => c.id === lead?.contactId);
      const leadActivities = activities.filter(a => a.leadId === leadId);

      if (lead && company && contact) {
        const scoring = calculateLeadScore({
          company,
          contact,
          activities: leadActivities,
          conversionTimestamp: lead.conversionTimestamp,
        });

        await updateDoc(doc(db, 'leads', leadId), {
          fitScore: scoring.fitScore,
          intentScore: scoring.intentScore,
          engagementScore: scoring.engagementScore,
          totalScore: scoring.totalScore,
          scoreCategory: scoring.category,
          scoreBreakdown: scoring.scoreBreakdown,
          lastScoredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [leads, companies, contacts, activities]
  );

  // Computed Evaluation Metrics & Validation Reports
  const validationReport = useMemo(() => {
    return runFullSystemValidation({
      companies,
      contacts,
      leads,
      campaigns,
      activities,
      consents,
      scoreRules,
      salesReps,
      tasks,
      opportunities,
      stageHistories,
      groundTruth,
    });
  }, [companies, contacts, leads, campaigns, activities, consents, scoreRules, salesReps, tasks, opportunities, stageHistories, groundTruth]);

  const evaluationMetrics = useMemo(() => {
    return runModelEvaluation(leads, opportunities);
  }, [leads, opportunities]);

  const refreshValidation = useCallback(() => {
    // Triggers re-computation
  }, []);

  return (
    <CRMContext.Provider
      value={{
        companies,
        contacts,
        leads,
        campaigns,
        activities,
        consents,
        scoreRules,
        salesReps,
        tasks,
        opportunities,
        stageHistories,
        anomalies,
        groundTruth,
        isLoading,
        isSeeding,
        seedingProgress,
        isPaused,
        pauseSeeding,
        resumeSeeding,
        cancelSeeding,
        dbConnected,
        connectionStatus,
        liveServerCounts,
        isVerifyingServer,
        lastVerifiedAt,
        verifyLiveCounts,
        currentRole,
        setCurrentRole,
        user,
        signInWithGoogle,
        signOutUser,
        seedDatabase,
        createLead,
        updateLead,
        deleteLead,
        createCompany,
        updateCompany,
        createContact,
        updateContact,
        createActivity,
        updateLeadConsent,
        assignRepToLead,
        advanceOpportunity,
        createOpportunityFromLead,
        createManualTask,
        updateTaskStatus,
        resolveAnomaly,
        recalculateLeadScoreAction,
        runIntegrityAudit,
        validationReport,
        evaluationMetrics,
        refreshValidation,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
