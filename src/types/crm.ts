/**
 * LEADPULSE AI - Core Data Model & Types
 * Complete specification for all 11 core entities + supporting audit & anomaly models.
 */

export type Territory = 'North America' | 'EMEA' | 'APAC' | 'LATAM';

export type Industry =
  | 'Technology'
  | 'Healthcare'
  | 'Financial Services'
  | 'Manufacturing'
  | 'Retail'
  | 'Education'
  | 'Telecommunications'
  | 'Energy';

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

export type RoleLevel = 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor';

export type ProductSpecialization =
  | 'Enterprise Cloud'
  | 'Security & Compliance'
  | 'Data & AI'
  | 'Core CRM'
  | 'All Products';

export type ProductInterest = 'Enterprise Cloud' | 'Security & Compliance' | 'Data & AI' | 'Core CRM';

export type ScoreCategory = 'HOT' | 'WARM' | 'COLD';

export type ConsentStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING' | 'WITHDRAWN';

export type LifecycleStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'UNQUALIFIED'
  | 'DISQUALIFIED';

export type RoutingStatus = 'ASSIGNED' | 'UNASSIGNED' | 'EXCEPTION';

export type ActivityType =
  | 'PRICING_PAGE_VIEW'
  | 'DEMO_REQUEST'
  | 'PRODUCT_INQUIRY'
  | 'PURCHASE_INTENT_FORM'
  | 'EMAIL_OPEN'
  | 'EMAIL_CLICK'
  | 'WEBSITE_VISIT'
  | 'EVENT_ATTENDANCE'
  | 'RECENT_INTERACTION'
  | 'PHONE_CALL'
  | 'SALES_NOTE';

export type TaskPriority = 'URGENT_1_DAY' | 'HIGH_3_DAY' | 'NORMAL_NURTURE';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export type OpportunityStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export type CampaignStatus = 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type AnomalyType =
  | 'OPTED_OUT_LEAD_CONTACTED'
  | 'POST_CONVERSION_ACTIVITY_USED_IN_SCORE'
  | 'LEAD_ASSIGNED_OUTSIDE_TERRITORY'
  | 'DUPLICATE_OPPORTUNITY_CREATED'
  | 'STAGE_HISTORY_GAP';

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type UserRole = 'Admin' | 'Sales Manager' | 'Sales Representative' | 'Marketing' | 'Analyst';

// 1. Company: CO-000001
export interface Company {
  id: string; // CO-000001
  name: string;
  domain: string;
  industry: Industry;
  size: CompanySize;
  employeeCount: number;
  annualRevenue: number;
  city: string;
  state: string;
  country: string;
  territory: Territory;
  createdAt: string;
  updatedAt: string;
}

// 2. Contact: CON-000001
export interface Contact {
  id: string; // CON-000001
  companyId: string; // Foreign Key to Company
  firstName: string;
  lastName: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  jobTitle: string;
  roleLevel: RoleLevel;
  department: string;
  city: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Campaign: CMP-000001
export interface Campaign {
  id: string; // CMP-000001
  name: string;
  type: string;
  budget: number;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  leadsCount: number;
  conversionsCount: number;
  createdAt: string;
  updatedAt: string;
}

// 4. Sales Representative: REP-001
export interface SalesRep {
  id: string; // REP-001
  name: string;
  email: string;
  territory: Territory;
  specialization: ProductSpecialization;
  capacityLimit: number;
  activeLeadsCount: number;
  quota: number;
  pipelineWon: number;
  status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  createdAt: string;
  updatedAt: string;
}

// Score Breakdown details
export interface ScoreBreakdown {
  fitScore: number;
  fitDetails: {
    companySizePoints: number;
    industryMatchPoints: number;
    jobRolePoints: number;
    geographicFitPoints: number;
    reasoning: string[];
  };
  intentScore: number;
  intentDetails: {
    pricingPagePoints: number;
    demoRequestPoints: number;
    productInquiryPoints: number;
    purchaseActivityPoints: number;
    reasoning: string[];
  };
  engagementScore: number;
  engagementDetails: {
    emailPoints: number;
    websitePoints: number;
    eventPoints: number;
    recentInteractionPoints: number;
    reasoning: string[];
  };
  totalScore: number;
  category: ScoreCategory;
  scoringTimestamp: string;
}

// 5. Lead: LEAD-2026-000001
export interface Lead {
  id: string; // LEAD-2026-000001
  companyId: string; // FK to Company
  contactId: string; // FK to Contact
  campaignId?: string; // FK to Campaign
  assignedRepId?: string; // FK to SalesRep
  productInterest: ProductInterest;
  territory: Territory;
  fitScore: number; // Max 30
  intentScore: number; // Max 40
  engagementScore: number; // Max 30
  totalScore: number; // Max 100
  scoreCategory: ScoreCategory; // HOT, WARM, COLD
  scoreBreakdown?: ScoreBreakdown;
  consentStatus: ConsentStatus;
  lifecycleStatus: LifecycleStatus;
  duplicateGroupId?: string;
  isDuplicate?: boolean;
  convertedOpportunityId?: string;
  conversionTimestamp?: string;
  routingStatus: RoutingStatus;
  routingExceptionReason?: string;
  lastScoredAt: string;
  createdAt: string;
  updatedAt: string;
}

// 6. Activity: ACT-LEAD-2026-000001-001
export interface Activity {
  id: string; // ACT-LEAD-2026-000001-001
  leadId: string; // FK to Lead
  type: ActivityType;
  timestamp: string;
  metadata?: string;
  pointsContributed: number;
  isPostConversion: boolean;
  createdAt: string;
}

// 7. Consent: CS-LEAD-2026-000001-001
export interface Consent {
  id: string; // CS-LEAD-2026-000001-001
  leadId: string; // FK to Lead
  status: ConsentStatus;
  channel: 'EMAIL' | 'PHONE' | 'SMS' | 'ALL';
  source: 'WEB_FORM' | 'DOUBLE_OPT_IN' | 'PREFERENCE_CENTER' | 'MANUAL_REQUEST' | 'UNSUBSCRIBE_LINK';
  notes?: string;
  timestamp: string;
  recordedBy: string;
}

// 8. ScoreRule: RULE-001
export interface ScoreRule {
  id: string; // RULE-001
  category: 'FIT' | 'INTENT' | 'ENGAGEMENT';
  dimension: string;
  maxPoints: number;
  criteria: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  createdAt: string;
}

// 9. Task: TASK-LEAD-2026-000001-001
export interface Task {
  id: string; // TASK-LEAD-2026-000001-001
  leadId: string; // FK to Lead
  assignedRepId?: string; // FK to SalesRep
  title: string;
  dueBusinessDays: number;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

// 10. Opportunity: OPP-2026-000001
export interface Opportunity {
  id: string; // OPP-2026-000001
  leadId: string; // FK to Lead (one active opp per lead)
  companyId: string; // FK to Company
  contactId: string; // FK to Contact
  assignedRepId: string; // FK to SalesRep
  name: string;
  value: number;
  stage: OpportunityStage;
  expectedCloseDate: string;
  actualCloseDate?: string;
  wonReason?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

// 11. StageHistory: STG-OPP-2026-000001-001
export interface StageHistory {
  id: string; // STG-OPP-2026-000001-001
  opportunityId: string; // FK to Opportunity
  fromStage: string;
  toStage: OpportunityStage;
  durationDays: number;
  transitionReason?: string;
  changedBy: string;
  timestamp: string;
}

// Anomaly Record
export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  affectedEntity: string;
  affectedRecordId: string;
  expectedDecision: string;
  actualDecision: string;
  isGroundTruth: boolean;
  status: 'DETECTED' | 'BLOCKED' | 'RESOLVED' | 'IGNORED';
  details?: string;
  timestamp: string;
}

// Ground Truth for Synthetic Evaluation
export interface GroundTruthRecord {
  id: string;
  scenarioType: AnomalyType;
  targetRecordId: string;
  injectedAt: string;
  expectedDetection: boolean;
  description: string;
}

// Deduplication Group
export interface DuplicateGroup {
  groupId: string;
  matchType: 'EMAIL' | 'COMPANY_NAME' | 'PHONE' | 'DOMAIN';
  matchValue: string;
  leadIds: string[];
  status: 'OPEN' | 'MERGED' | 'RESOLVED_DISTINCT';
  createdAt: string;
}

// Validation Report Entry
export interface ValidationCheck {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  passedCount: number;
  failedCount: number;
  message: string;
  details?: string[];
}

export interface ValidationReport {
  timestamp: string;
  overallStatus: 'PASSED' | 'FAILED' | 'WARNING';
  score: number; // 0-100%
  checks: ValidationCheck[];
}

// Evaluation Metrics
export interface EvaluationMetrics {
  totalEvaluated: number;
  hotLeadsCount: number;
  warmLeadsCount: number;
  coldLeadsCount: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  overallConversionRate: number;
  hotConversionRate: number;
  warmConversionRate: number;
  coldConversionRate: number;
  reproducibilityPercentage: number;
  dataQualityPercentage: number;
  foreignKeyIntegrityPercentage: number;
  evaluationTimestamp: string;
  splitMethod: 'Chronological (Held-out)' | 'Deterministic Seed (80/20)';
}

// User & Role-Based Access Control
export type UserStatus = 'active' | 'inactive';

export interface CRMUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  assignedTerritory?: Territory;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isInitialAdmin?: boolean;
}

// System Audit Log Entry
export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  action: string;
  targetRecord?: string;
  details?: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  ipAddress?: string;
}

// RBAC Permissions & Resources
export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'assign'
  | 'export'
  | 'wipe'
  | 'manage_rules'
  | 'manage_users'
  | 'manage_settings'
  | 'advance_stage'
  | 'log_activity'
  | 'record_consent';

export type Resource =
  | 'dashboard'
  | 'leads'
  | 'companies'
  | 'contacts'
  | 'campaigns'
  | 'activities'
  | 'scoring_rules'
  | 'sales_reps'
  | 'tasks'
  | 'opportunities'
  | 'stage_history'
  | 'anomalies'
  | 'consent'
  | 'analytics'
  | 'data_management'
  | 'validation_center'
  | 'audit_logs'
  | 'user_management'
  | 'settings';

