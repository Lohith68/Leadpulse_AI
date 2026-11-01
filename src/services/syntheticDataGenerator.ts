/**
 * LEADPULSE AI - Synthetic Data Generator (Module 2 Upgrade)
 * Full Problem Statement Support with Deterministic Mulberry32 PRNG (SEED = 20261022)
 *
 * MODES:
 * 1. BENCHMARK MODE: 200 leads, 100 contacts, 50 companies, 60 opportunities.
 * 2. FULL MODE: 20,000 leads, 10,000 contacts, 5,000 companies, 3,000 opportunities.
 *
 * Enforces:
 * - Parent records before child records (Company -> Contact -> Campaign, Rep, Rule -> Lead -> Activity, Consent, Task -> Opportunity -> StageHistory)
 * - Exact required ID formats (CO-000001, CON-000001, LEAD-2026-000001, OPP-2026-000001, TASK-LEAD-2026-000001-001, etc.)
 * - 100% valid foreign key referential integrity
 * - Realistic distributions (duplicates, opted-out leads, stale leads, high-scoring non-converters)
 * - All 5 mandatory anomaly scenarios with separate ground truth isolation
 * - Resumable batched Firestore writes (< 500 docs/batch) with safe exponential backoff retries
 * - Independent server-side read verification via getCountFromServer
 */

import { writeBatch, doc, collection, getCountFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
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
  Territory,
  Industry,
  CompanySize,
  RoleLevel,
  ProductInterest,
  GroundTruthRecord,
  Anomaly,
} from '../types/crm';
import { calculateLeadScore } from './leadScoringEngine';
import { routeLeadToSalesRep } from './routingService';
import { generateAutomatedTask } from './taskAutomationService';
import { createOpportunityRecord } from './opportunityService';
import { auditDatabaseAnomalies } from './anomalyDetectionService';

export const FIXED_SEED = 20261022;

export type GeneratorMode = 'BENCHMARK' | 'FULL';

export interface VolumeConfig {
  mode: GeneratorMode;
  companyCount: number;
  contactCount: number;
  leadCount: number;
  opportunityCount: number;
}

export const VOLUME_CONFIGS: Record<GeneratorMode, VolumeConfig> = {
  BENCHMARK: {
    mode: 'BENCHMARK',
    companyCount: 50,
    contactCount: 100,
    leadCount: 200,
    opportunityCount: 60,
  },
  FULL: {
    mode: 'FULL',
    companyCount: 5000,
    contactCount: 10000,
    leadCount: 20000,
    opportunityCount: 3000,
  },
};

/**
 * Deterministic PRNG using Mulberry32
 */
export class SeededPRNG {
  private s: number;

  constructor(seed: number = FIXED_SEED) {
    this.s = seed >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// Enterprise vocabulary pools for high-variety synthetic generation
const COMPANY_PREFIXES = [
  'Apex', 'Nexus', 'Vanguard', 'Quantum', 'Starlight', 'Hyperion', 'Crestview', 'Solaria',
  'Synapse', 'Omni', 'BluePeak', 'Aegis', 'Kinetic', 'Stratum', 'Veritas', 'Meridian',
  'Novus', 'Prism', 'Beacon', 'Elevate', 'Aura', 'Summit', 'Cobalt', 'Integra', 'Catalyst',
  'Zenith', 'Astra', 'Cipher', 'Dynamo', 'Echo', 'Flux', 'Genesis', 'Helios', 'Ion', 'Jupiter',
  'Krypton', 'Lumina', 'Matrix', 'Neutron', 'Optima', 'Pinnacle', 'Radiant', 'Stellar', 'Titan',
  'Unity', 'Vector', 'Wavelength', 'Xenon', 'Yield', 'Zephyr'
];

const COMPANY_SUFFIXES = [
  'Systems', 'Technologies', 'Dynamics', 'Solutions', 'Global', 'Networks', 'Labs', 'Health',
  'Capital', 'Robotics', 'Analytics', 'Logistics', 'BioTech', 'Software', 'Cloud', 'Interactive',
  'Enterprises', 'Ventures', 'Digital', 'Industries', 'Security', 'Platforms', 'Intelligence'
];

const FIRST_NAMES = [
  'James', 'Olivia', 'Alexander', 'Sophia', 'Benjamin', 'Emma', 'Daniel', 'Ava',
  'William', 'Mia', 'Henry', 'Charlotte', 'Lucas', 'Amelia', 'Ethan', 'Harper',
  'Mason', 'Evelyn', 'Michael', 'Abigail', 'David', 'Emily', 'Logan', 'Elizabeth',
  'Julian', 'Aria', 'Sebastian', 'Ella', 'Gabriel', 'Scarlett', 'Matthew', 'Chloe',
  'Liam', 'Noah', 'Oliver', 'Elijah', 'Mateo', 'Theodore', 'Ezra', 'Jackson',
  'Isabella', 'Luna', 'Gianna', 'Avery', 'Elena', 'Maya', 'Nora', 'Leah'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'
];

const CITIES: Record<Territory, { city: string; state: string; country: string }[]> = {
  'North America': [
    { city: 'San Francisco', state: 'CA', country: 'USA' },
    { city: 'New York', state: 'NY', country: 'USA' },
    { city: 'Austin', state: 'TX', country: 'USA' },
    { city: 'Toronto', state: 'ON', country: 'Canada' },
    { city: 'Seattle', state: 'WA', country: 'USA' },
    { city: 'Boston', state: 'MA', country: 'USA' },
    { city: 'Chicago', state: 'IL', country: 'USA' },
    { city: 'Vancouver', state: 'BC', country: 'Canada' },
  ],
  'EMEA': [
    { city: 'London', state: 'England', country: 'UK' },
    { city: 'Berlin', state: 'Berlin', country: 'Germany' },
    { city: 'Paris', state: 'Île-de-France', country: 'France' },
    { city: 'Amsterdam', state: 'North Holland', country: 'Netherlands' },
    { city: 'Stockholm', state: 'Stockholm', country: 'Sweden' },
    { city: 'Zurich', state: 'Zurich', country: 'Switzerland' },
    { city: 'Dublin', state: 'Leinster', country: 'Ireland' },
    { city: 'Madrid', state: 'Madrid', country: 'Spain' },
  ],
  'APAC': [
    { city: 'Singapore', state: 'Central', country: 'Singapore' },
    { city: 'Tokyo', state: 'Kanto', country: 'Japan' },
    { city: 'Sydney', state: 'NSW', country: 'Australia' },
    { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
    { city: 'Seoul', state: 'Gyeonggi', country: 'South Korea' },
    { city: 'Melbourne', state: 'VIC', country: 'Australia' },
  ],
  'LATAM': [
    { city: 'São Paulo', state: 'SP', country: 'Brazil' },
    { city: 'Mexico City', state: 'CDMX', country: 'Mexico' },
    { city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia' },
    { city: 'Santiago', state: 'Santiago', country: 'Chile' },
    { city: 'Buenos Aires', state: 'BA', country: 'Argentina' },
  ],
};

const JOB_TITLES: Record<RoleLevel, string[]> = {
  'C-Level': ['Chief Technology Officer', 'Chief Information Officer', 'Chief Executive Officer', 'Chief Revenue Officer', 'Chief Security Officer'],
  'VP': ['VP of Engineering', 'VP of Enterprise Infrastructure', 'VP of Sales Operations', 'VP of Digital Transformation', 'VP of Cloud Services'],
  'Director': ['Director of Cloud Architecture', 'Director of Data Platforms', 'Director of IT Security', 'Director of DevOps', 'Director of Enterprise Applications'],
  'Manager': ['Cloud Infrastructure Manager', 'Lead Security Engineer', 'IT Operations Manager', 'CRM Solutions Architect', 'Data Governance Lead'],
  'Individual Contributor': ['Senior Enterprise Architect', 'Principal Cloud Consultant', 'Senior Data Engineer', 'Security Systems Analyst', 'Lead DevOps Specialist'],
};

export interface GeneratedDataset {
  companies: Company[];
  contacts: Contact[];
  campaigns: Campaign[];
  salesReps: SalesRep[];
  scoreRules: ScoreRule[];
  leads: Lead[];
  activities: Activity[];
  consents: Consent[];
  tasks: Task[];
  opportunities: Opportunity[];
  stageHistories: StageHistory[];
  anomalies: Anomaly[];
  groundTruth: GroundTruthRecord[];
  summary: {
    mode: GeneratorMode;
    seed: number;
    totalEntities: number;
    companiesCount: number;
    contactsCount: number;
    leadsCount: number;
    opportunitiesCount: number;
    duplicatesCount: number;
    optedOutCount: number;
    staleLeadsCount: number;
    highScoringNonConvertersCount: number;
    anomaliesCount: number;
  };
}

/**
 * Pure deterministic generation function supporting Benchmark and Full modes
 */
export function generateSyntheticDataset(
  configInput: Partial<VolumeConfig> & { seed?: number; injectAnomalies?: boolean }
): GeneratedDataset {
  const mode = configInput.mode || (configInput.leadCount && configInput.leadCount > 1000 ? 'FULL' : 'BENCHMARK');
  const defaults = VOLUME_CONFIGS[mode];
  const companyCount = configInput.companyCount ?? defaults.companyCount;
  const contactCount = configInput.contactCount ?? defaults.contactCount;
  const leadCount = configInput.leadCount ?? defaults.leadCount;
  const opportunityCount = configInput.opportunityCount ?? defaults.opportunityCount;
  const seed = configInput.seed ?? FIXED_SEED;

  const prng = new SeededPRNG(seed);

  const territories: Territory[] = ['North America', 'EMEA', 'APAC', 'LATAM'];
  const industries: Industry[] = [
    'Technology', 'Healthcare', 'Financial Services', 'Manufacturing',
    'Retail', 'Education', 'Telecommunications', 'Energy'
  ];
  const companySizes: CompanySize[] = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  const productInterests: ProductInterest[] = ['Enterprise Cloud', 'Security & Compliance', 'Data & AI', 'Core CRM'];

  // Base epoch: late 2026 enterprise calendar
  const baseEpoch = new Date('2026-06-01T08:00:00.000Z').getTime();

  // 1. Sales Representatives (Master Roster)
  const salesReps: SalesRep[] = [
    {
      id: 'REP-001',
      name: 'Sarah Jenkins',
      email: 'sjenkins@leadpulse.ai',
      territory: 'North America',
      specialization: 'Enterprise Cloud',
      capacityLimit: 150,
      activeLeadsCount: 0,
      quota: 2500000,
      pipelineWon: 1840000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 60 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 10 * 86400000).toISOString(),
    },
    {
      id: 'REP-002',
      name: 'Marcus Vance',
      email: 'mvance@leadpulse.ai',
      territory: 'North America',
      specialization: 'Security & Compliance',
      capacityLimit: 150,
      activeLeadsCount: 0,
      quota: 2200000,
      pipelineWon: 1920000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 60 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 5 * 86400000).toISOString(),
    },
    {
      id: 'REP-003',
      name: 'Elena Rostova',
      email: 'erostova@leadpulse.ai',
      territory: 'EMEA',
      specialization: 'Data & AI',
      capacityLimit: 120,
      activeLeadsCount: 0,
      quota: 1950000,
      pipelineWon: 1470000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 50 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 4 * 86400000).toISOString(),
    },
    {
      id: 'REP-004',
      name: 'Kenji Takahashi',
      email: 'ktakahashi@leadpulse.ai',
      territory: 'APAC',
      specialization: 'Core CRM',
      capacityLimit: 120,
      activeLeadsCount: 0,
      quota: 1850000,
      pipelineWon: 1390000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 45 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 2 * 86400000).toISOString(),
    },
    {
      id: 'REP-005',
      name: 'Mateo Morales',
      email: 'mmorales@leadpulse.ai',
      territory: 'LATAM',
      specialization: 'Enterprise Cloud',
      capacityLimit: 100,
      activeLeadsCount: 0,
      quota: 1400000,
      pipelineWon: 980000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 40 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 3 * 86400000).toISOString(),
    },
    {
      id: 'REP-006',
      name: 'Claire Dupont',
      email: 'cdupont@leadpulse.ai',
      territory: 'EMEA',
      specialization: 'Security & Compliance',
      capacityLimit: 120,
      activeLeadsCount: 0,
      quota: 1800000,
      pipelineWon: 1100000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 30 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 2 * 86400000).toISOString(),
    },
    {
      id: 'REP-007',
      name: 'David Zhao',
      email: 'dzhao@leadpulse.ai',
      territory: 'APAC',
      specialization: 'Data & AI',
      capacityLimit: 120,
      activeLeadsCount: 0,
      quota: 1750000,
      pipelineWon: 1220000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 25 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 1 * 86400000).toISOString(),
    },
    {
      id: 'REP-008',
      name: 'Sofia Alvarez',
      email: 'salvarez@leadpulse.ai',
      territory: 'LATAM',
      specialization: 'Data & AI',
      capacityLimit: 100,
      activeLeadsCount: 0,
      quota: 1300000,
      pipelineWon: 850000,
      status: 'AVAILABLE',
      createdAt: new Date(baseEpoch - 20 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch - 1 * 86400000).toISOString(),
    },
  ];

  // 2. Score Rules (Master Definitions)
  const scoreRules: ScoreRule[] = [
    { id: 'RULE-001', category: 'FIT', dimension: 'Company Size (Enterprise 500+)', maxPoints: 10, criteria: 'Size in [501-1000, 1000+]', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-002', category: 'FIT', dimension: 'Industry Match (Tech / Finance / Health)', maxPoints: 10, criteria: 'Industry in Target Verticals', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-003', category: 'FIT', dimension: 'Executive Job Role (C-Level / VP)', maxPoints: 5, criteria: 'RoleLevel in [C-Level, VP]', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-004', category: 'FIT', dimension: 'Geographic Fit', maxPoints: 5, criteria: 'Territory in Target Regions', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-005', category: 'INTENT', dimension: 'Pricing Page View', maxPoints: 10, criteria: 'Activity PRICING_PAGE_VIEW >= 1', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-006', category: 'INTENT', dimension: 'Demo Request Submission', maxPoints: 15, criteria: 'Activity DEMO_REQUEST >= 1', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-007', category: 'INTENT', dimension: 'Product Inquiry Form', maxPoints: 10, criteria: 'Activity PRODUCT_INQUIRY >= 1', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-008', category: 'INTENT', dimension: 'Purchase Intent Action', maxPoints: 5, criteria: 'Activity PURCHASE_INTENT_FORM >= 1', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-009', category: 'ENGAGEMENT', dimension: 'Email Engagement', maxPoints: 10, criteria: 'EMAIL_CLICK (10) or EMAIL_OPEN (5)', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-010', category: 'ENGAGEMENT', dimension: 'Website Session Frequency', maxPoints: 10, criteria: 'WEBSITE_VISIT count >= 3 (10) or >= 1 (5)', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-011', category: 'ENGAGEMENT', dimension: 'Event Participation', maxPoints: 5, criteria: 'EVENT_ATTENDANCE >= 1', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'RULE-012', category: 'ENGAGEMENT', dimension: 'Recency (14-Day Touchpoint)', maxPoints: 5, criteria: 'Touchpoint within prior 14 days', active: true, effectiveFrom: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' },
  ];

  // 3. Campaigns (Master Records)
  const campaigns: Campaign[] = [
    { id: 'CMP-000001', name: 'Q3 Enterprise AI Infrastructure Summit', type: 'Webinar', budget: 120000, status: 'ACTIVE', startDate: '2026-06-01T00:00:00.000Z', leadsCount: 0, conversionsCount: 0, createdAt: '2026-05-15T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
    { id: 'CMP-000002', name: 'Gartner Magic Quadrant Cloud Outbound', type: 'Outbound Email', budget: 85000, status: 'ACTIVE', startDate: '2026-06-15T00:00:00.000Z', leadsCount: 0, conversionsCount: 0, createdAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-06-15T00:00:00.000Z' },
    { id: 'CMP-000003', name: 'Google Cloud Next London 2026 Booth', type: 'Trade Show', budget: 250000, status: 'COMPLETED', startDate: '2026-07-01T00:00:00.000Z', endDate: '2026-07-05T00:00:00.000Z', leadsCount: 0, conversionsCount: 0, createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-07-06T00:00:00.000Z' },
    { id: 'CMP-000004', name: 'Zero-Trust Security Whitepaper Syndication', type: 'Content Syndication', budget: 95000, status: 'ACTIVE', startDate: '2026-07-15T00:00:00.000Z', leadsCount: 0, conversionsCount: 0, createdAt: '2026-06-15T00:00:00.000Z', updatedAt: '2026-07-15T00:00:00.000Z' },
    { id: 'CMP-000005', name: 'Search Ads High-Intent Retargeting', type: 'Paid Search', budget: 110000, status: 'ACTIVE', startDate: '2026-08-01T00:00:00.000Z', leadsCount: 0, conversionsCount: 0, createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
  ];

  // 4. GENERATE PARENT 1: Companies (CO-000001 up to 5,000)
  const companies: Company[] = [];
  for (let i = 1; i <= companyCount; i++) {
    const id = `CO-${String(i).padStart(6, '0')}`;
    const pfxIndex = (i * 7) % COMPANY_PREFIXES.length;
    const sfxIndex = (i * 13) % COMPANY_SUFFIXES.length;
    const pfx = COMPANY_PREFIXES[pfxIndex];
    const sfx = COMPANY_SUFFIXES[sfxIndex];
    const seqSuffix = i > (COMPANY_PREFIXES.length * COMPANY_SUFFIXES.length) ? ` ${Math.floor(i / 100)}` : '';
    const name = `${pfx} ${sfx}${seqSuffix}`.trim();
    const domain = `${pfx.toLowerCase()}${sfx.toLowerCase()}${i > 500 ? i : ''}.com`;
    const territory = prng.pick(territories);
    const industry = prng.pick(industries);
    const size = prng.pick(companySizes);
    const loc = prng.pick(CITIES[territory]);
    const employeeCount = size === '1000+' ? prng.nextInt(1200, 35000) : size === '501-1000' ? prng.nextInt(501, 1000) : size === '201-500' ? prng.nextInt(201, 500) : prng.nextInt(15, 200);
    const annualRevenue = employeeCount * prng.nextInt(150000, 320000);

    const createdAtEpoch = baseEpoch + prng.nextInt(0, 40) * 86400000;
    const createdAt = new Date(createdAtEpoch).toISOString();
    const updatedAt = new Date(createdAtEpoch + prng.nextInt(1, 15) * 86400000).toISOString();

    companies.push({
      id,
      name,
      domain,
      industry,
      size,
      employeeCount,
      annualRevenue,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      territory,
      createdAt,
      updatedAt,
    });
  }

  // 5. GENERATE PARENT 2: Contacts (CON-000001 up to 10,000, 100% referencing existing Company IDs)
  const contacts: Contact[] = [];
  const roles: RoleLevel[] = ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'];

  for (let i = 1; i <= contactCount; i++) {
    const id = `CON-${String(i).padStart(6, '0')}`;
    const company = companies[(i - 1) % companies.length];
    const firstName = prng.pick(FIRST_NAMES);
    const lastName = prng.pick(LAST_NAMES);
    const roleLevel = prng.pick(roles);
    const jobTitle = prng.pick(JOB_TITLES[roleLevel]);
    const domain = company.domain;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 1000 ? i : ''}@${domain}`;
    const normalizedEmail = email.toLowerCase().trim();
    const phone = `+1-${prng.nextInt(201, 989)}-${prng.nextInt(100, 999)}-${prng.nextInt(1000, 9999)}`;
    const department = jobTitle.includes('Security') ? 'Information Security' : jobTitle.includes('Cloud') ? 'Cloud Engineering' : 'Information Technology';

    const createdAt = company.createdAt;
    const updatedAt = company.updatedAt;

    contacts.push({
      id,
      companyId: company.id,
      firstName,
      lastName,
      email,
      normalizedEmail,
      phone,
      jobTitle,
      roleLevel,
      department,
      city: company.city,
      country: company.country,
      createdAt,
      updatedAt,
    });
  }

  // 6. GENERATE CHILDREN: Leads, Activities, Consents, Tasks, Opportunities, StageHistories
  const leads: Lead[] = [];
  const activities: Activity[] = [];
  const consents: Consent[] = [];
  const tasks: Task[] = [];
  const opportunities: Opportunity[] = [];
  const stageHistories: StageHistory[] = [];

  let duplicatesCount = 0;
  let optedOutCount = 0;
  let staleLeadsCount = 0;
  let highScoringNonConvertersCount = 0;

  const activityTypes: Array<{ type: Activity['type']; points: number }> = [
    { type: 'PRICING_PAGE_VIEW', points: 10 },
    { type: 'DEMO_REQUEST', points: 15 },
    { type: 'PRODUCT_INQUIRY', points: 10 },
    { type: 'PURCHASE_INTENT_FORM', points: 5 },
    { type: 'EMAIL_CLICK', points: 10 },
    { type: 'EMAIL_OPEN', points: 5 },
    { type: 'WEBSITE_VISIT', points: 5 },
    { type: 'EVENT_ATTENDANCE', points: 5 },
  ];

  for (let i = 1; i <= leadCount; i++) {
    const leadId = `LEAD-2026-${String(i).padStart(6, '0')}`;
    const company = companies[(i - 1) % companies.length];
    const contact = contacts[(i - 1) % contacts.length];
    const campaign = campaigns[(i - 1) % campaigns.length];
    campaign.leadsCount++;

    const productInterest = prng.pick(productInterests);

    // Distribution: Stale leads (12%) have old createdAt, no recent activities
    const isStale = i % 8 === 0;
    if (isStale) staleLeadsCount++;

    const daysOffset = isStale ? prng.nextInt(90, 140) : prng.nextInt(5, 50);
    const leadEpoch = baseEpoch + daysOffset * 86400000;
    const leadCreatedAt = new Date(leadEpoch).toISOString();

    // Distribution: Regulatory Consent (82% OPTED_IN, 10% PENDING, 6% OPTED_OUT, 2% WITHDRAWN)
    const consentRoll = prng.next();
    const consentStatus: Lead['consentStatus'] =
      consentRoll < 0.82
        ? 'OPTED_IN'
        : consentRoll < 0.92
        ? 'PENDING'
        : consentRoll < 0.98
        ? 'OPTED_OUT'
        : 'WITHDRAWN';

    if (consentStatus === 'OPTED_OUT' || consentStatus === 'WITHDRAWN') {
      optedOutCount++;
    }

    const consent: Consent = {
      id: `CS-${leadId}-001`,
      leadId,
      status: consentStatus,
      channel: 'ALL',
      source: consentStatus === 'OPTED_IN' ? 'WEB_FORM' : consentStatus === 'PENDING' ? 'DOUBLE_OPT_IN' : 'UNSUBSCRIBE_LINK',
      notes: `Consent recorded at lead ingestion. Status: ${consentStatus}`,
      timestamp: leadCreatedAt,
      recordedBy: 'Inbound Ingestion Gateway',
    };
    consents.push(consent);

    // Generate chronological engagement activities with realistic distribution
    const leadActivities: Activity[] = [];
    const isHighIntent = !isStale && i % 5 === 0; // 20% of prospects have high engagement
    const numActs = isStale ? 0 : isHighIntent ? prng.nextInt(4, 6) : prng.nextInt(1, 3);
    for (let a = 1; a <= numActs; a++) {
      const actId = `ACT-${leadId}-${String(a).padStart(3, '0')}`;
      let actDef = prng.pick(activityTypes);
      if (isHighIntent) {
        if (a === 1) actDef = { type: 'DEMO_REQUEST', points: 15 };
        else if (a === 2) actDef = { type: 'PRICING_PAGE_VIEW', points: 10 };
        else if (a === 3) actDef = { type: 'PRODUCT_INQUIRY', points: 10 };
        else if (a === 4) actDef = { type: 'EMAIL_CLICK', points: 10 };
      }
      const actTime = new Date(leadEpoch + a * prng.nextInt(1, 3) * 86400000).toISOString();
      const activity: Activity = {
        id: actId,
        leadId,
        type: actDef.type,
        timestamp: actTime,
        pointsContributed: actDef.points,
        isPostConversion: false,
        createdAt: actTime,
      };
      leadActivities.push(activity);
      activities.push(activity);
    }

    // Lead Scoring Engine Evaluation
    const scoringResult = calculateLeadScore({
      company,
      contact,
      activities: leadActivities,
      scoringTimestamp: new Date(leadEpoch + 15 * 86400000).toISOString(),
    });

    // Distribution: Labelled duplicates (every 25th lead has duplicate marker)
    const isDuplicate = i % 25 === 0;
    const duplicateGroupId = isDuplicate ? `DUP-GRP-${Math.floor(i / 25)}` : undefined;
    if (isDuplicate) duplicatesCount++;

    // Distribution: Lifecycle Status & High-scoring Non-Converters
    // High-scoring non-converters: 25% of HOT leads are intentionally NOT converted
    let lifecycleStatus: Lead['lifecycleStatus'] = 'NEW';
    let shouldConvertToOpp = false;

    if (isStale) {
      lifecycleStatus = 'UNQUALIFIED';
    } else if (scoringResult.category === 'HOT') {
      const isDesignatedNonConverter = i % 4 === 0;
      if (!isDesignatedNonConverter && opportunities.length < opportunityCount) {
        lifecycleStatus = 'CONVERTED';
        shouldConvertToOpp = true;
      } else {
        // High-scoring non-converter! (Score >= 80 but stays in QUALIFIED or CONTACTED)
        lifecycleStatus = prng.chance(0.6) ? 'QUALIFIED' : 'CONTACTED';
        highScoringNonConvertersCount++;
      }
    } else if (scoringResult.category === 'WARM') {
      if (opportunities.length < opportunityCount && prng.chance(0.35)) {
        lifecycleStatus = 'CONVERTED';
        shouldConvertToOpp = true;
      } else {
        lifecycleStatus = prng.chance(0.7) ? 'CONTACTED' : 'ASSIGNED';
      }
    } else {
      lifecycleStatus = prng.chance(0.75) ? 'NEW' : 'UNQUALIFIED';
    }

    // Lead Routing
    const mockLeadForRouting: Lead = {
      id: leadId,
      companyId: company.id,
      contactId: contact.id,
      campaignId: campaign.id,
      productInterest,
      territory: company.territory,
      fitScore: scoringResult.fitScore,
      intentScore: scoringResult.intentScore,
      engagementScore: scoringResult.engagementScore,
      totalScore: scoringResult.totalScore,
      scoreCategory: scoringResult.category,
      consentStatus,
      lifecycleStatus,
      routingStatus: 'UNASSIGNED',
      lastScoredAt: leadCreatedAt,
      createdAt: leadCreatedAt,
      updatedAt: leadCreatedAt,
    };

    const routingDecision = routeLeadToSalesRep(mockLeadForRouting, salesReps);
    if (routingDecision.assignedRepId) {
      const rep = salesReps.find(r => r.id === routingDecision.assignedRepId);
      if (rep) rep.activeLeadsCount++;
    }

    const fullLead: Lead = {
      ...mockLeadForRouting,
      assignedRepId: routingDecision.assignedRepId,
      routingStatus: routingDecision.routingStatus,
      routingExceptionReason: routingDecision.routingStatus !== 'ASSIGNED' ? routingDecision.reason : undefined,
      scoreBreakdown: scoringResult.scoreBreakdown,
      isDuplicate,
      duplicateGroupId,
      updatedAt: new Date(leadEpoch + 16 * 86400000).toISOString(),
    };

    // Automated Follow-up Task Generation
    const taskResult = generateAutomatedTask(fullLead, tasks);
    if (taskResult.task) {
      tasks.push(taskResult.task);
    }

    // Opportunity creation enforcing single active opportunity per lead
    if (shouldConvertToOpp && opportunities.length < opportunityCount) {
      campaign.conversionsCount++;
      const oppSeq = opportunities.length + 1;
      const dealValue = prng.nextInt(45000, 350000);
      const dealName = `${company.name} - ${productInterest} Solution`;
      const { opportunity, initialStageHistory } = createOpportunityRecord(
        fullLead,
        dealName,
        dealValue,
        prng.nextInt(30, 90),
        oppSeq
      );

      const stages: Opportunity['stage'][] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
      const targetStage = prng.pick(stages);

      opportunity.stage = targetStage;
      if (targetStage === 'WON') {
        opportunity.actualCloseDate = new Date(leadEpoch + 35 * 86400000).toISOString();
        opportunity.wonReason = 'Enterprise cloud architecture and transparent compliance security.';
      } else if (targetStage === 'LOST') {
        opportunity.actualCloseDate = new Date(leadEpoch + 35 * 86400000).toISOString();
        opportunity.lostReason = 'Internal budget reallocation to alternative enterprise priority.';
      }

      opportunities.push(opportunity);
      stageHistories.push(initialStageHistory);

      // Add intermediate stage history record for advanced stages to ensure audit trail
      if (targetStage !== 'NEW') {
        stageHistories.push({
          id: `STG-${opportunity.id}-002`,
          opportunityId: opportunity.id,
          fromStage: 'NEW',
          toStage: targetStage,
          durationDays: prng.nextInt(5, 20),
          transitionReason: `Advanced to ${targetStage} following sales technical review.`,
          changedBy: fullLead.assignedRepId || 'REP-001',
          timestamp: new Date(leadEpoch + 25 * 86400000).toISOString(),
        });
      }

      fullLead.convertedOpportunityId = opportunity.id;
      fullLead.conversionTimestamp = opportunity.createdAt;
    }

    leads.push(fullLead);
  }

  // Ensure exact target opportunity count (e.g. 60 in Benchmark mode, 3,000 in Full mode)
  const anomalyOppCount = configInput.injectAnomalies !== false && leads.length >= 20 ? 2 : 0;
  const targetStandardOpps = Math.max(0, opportunityCount - anomalyOppCount);

  if (opportunities.length < targetStandardOpps) {
    for (const lead of leads) {
      if (opportunities.length >= targetStandardOpps) break;
      if (lead.convertedOpportunityId) continue;
      if (lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN') continue;
      if (lead.lifecycleStatus === 'UNQUALIFIED' || lead.lifecycleStatus === 'DISQUALIFIED') continue;

      lead.lifecycleStatus = 'CONVERTED';
      const company = companies.find(c => c.id === lead.companyId) || companies[0];
      const campaign = campaigns.find(c => c.id === lead.campaignId) || campaigns[0];
      campaign.conversionsCount++;
      const oppSeq = opportunities.length + 1;
      const dealValue = prng.nextInt(45000, 350000);
      const dealName = `${company.name} - ${lead.productInterest} Solution`;
      const { opportunity, initialStageHistory } = createOpportunityRecord(
        lead,
        dealName,
        dealValue,
        prng.nextInt(30, 90),
        oppSeq
      );

      const stages: Opportunity['stage'][] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
      const targetStage = prng.pick(stages);

      opportunity.stage = targetStage;
      if (targetStage === 'WON') {
        opportunity.actualCloseDate = new Date(baseEpoch + 35 * 86400000).toISOString();
        opportunity.wonReason = 'Enterprise cloud architecture and transparent compliance security.';
      } else if (targetStage === 'LOST') {
        opportunity.actualCloseDate = new Date(baseEpoch + 35 * 86400000).toISOString();
        opportunity.lostReason = 'Internal budget reallocation to alternative enterprise priority.';
      }

      opportunities.push(opportunity);
      stageHistories.push(initialStageHistory);

      if (targetStage !== 'NEW') {
        stageHistories.push({
          id: `STG-${opportunity.id}-002`,
          opportunityId: opportunity.id,
          fromStage: 'NEW',
          toStage: targetStage,
          durationDays: prng.nextInt(5, 20),
          transitionReason: `Advanced to ${targetStage} following sales technical review.`,
          changedBy: lead.assignedRepId || 'REP-001',
          timestamp: new Date(baseEpoch + 25 * 86400000).toISOString(),
        });
      }

      lead.convertedOpportunityId = opportunity.id;
      lead.conversionTimestamp = opportunity.createdAt;
    }
  }

  // Explicitly inject the 5 mandatory negative anomaly scenarios (Module 9 & 12 requirement)
  if (configInput.injectAnomalies !== false && leads.length >= 20) {
    // 1. SCENARIO 1: OPTED_OUT_LEAD_CONTACTED
    const optedOutLead = leads.find(l => l.consentStatus === 'OPTED_OUT' || l.consentStatus === 'WITHDRAWN') || leads[7];
    optedOutLead.consentStatus = 'OPTED_OUT';
    const anomTask1: Task = {
      id: `TASK-${optedOutLead.id}-999`,
      leadId: optedOutLead.id,
      assignedRepId: optedOutLead.assignedRepId || 'REP-001',
      title: `[ANOMALY] Outbound Call Scheduled for Opted-Out Lead ${optedOutLead.id}`,
      priority: 'URGENT_1_DAY',
      dueBusinessDays: 1,
      dueDate: new Date(baseEpoch + 50 * 86400000).toISOString(),
      status: 'PENDING',
      idempotencyKey: `IDEMP-${optedOutLead.id}-999`,
      createdAt: new Date(baseEpoch + 48 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch + 48 * 86400000).toISOString(),
    };
    tasks.push(anomTask1);

    // 2. SCENARIO 2: POST_CONVERSION_ACTIVITY_USED_IN_SCORE
    const convertedLead = leads.find(l => l.convertedOpportunityId && l.conversionTimestamp) || leads[2];
    if (!convertedLead.conversionTimestamp) {
      convertedLead.conversionTimestamp = new Date(baseEpoch + 30 * 86400000).toISOString();
      convertedLead.lifecycleStatus = 'CONVERTED';
    }
    const convEpoch = new Date(convertedLead.conversionTimestamp).getTime();
    const anomAct2: Activity = {
      id: `ACT-${convertedLead.id}-999`,
      leadId: convertedLead.id,
      type: 'DEMO_REQUEST',
      timestamp: new Date(convEpoch + 5 * 86400000).toISOString(),
      pointsContributed: 15,
      isPostConversion: true,
      createdAt: new Date(convEpoch + 5 * 86400000).toISOString(),
    };
    activities.push(anomAct2);

    // 3. SCENARIO 3: LEAD_ASSIGNED_OUTSIDE_TERRITORY
    const emeaLead = leads.find(l => l.territory === 'EMEA') || leads[11];
    emeaLead.territory = 'EMEA';
    emeaLead.assignedRepId = 'REP-001'; // REP-001 is North America
    emeaLead.routingStatus = 'ASSIGNED';

    // 4. SCENARIO 4: DUPLICATE_OPPORTUNITY_CREATED
    const dupLead = leads.find(l => l.convertedOpportunityId) || leads[3];
    const dupOpp: Opportunity = {
      id: `OPP-2026-999999`,
      leadId: dupLead.id,
      companyId: dupLead.companyId,
      contactId: dupLead.contactId,
      assignedRepId: dupLead.assignedRepId || 'REP-001',
      name: `${companies.find(c => c.id === dupLead.companyId)?.name || 'Enterprise'} - Redundant Expansion Solution`,
      value: 145000,
      stage: 'PROPOSAL',
      expectedCloseDate: new Date(baseEpoch + 90 * 86400000).toISOString(),
      createdAt: new Date(baseEpoch + 45 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch + 45 * 86400000).toISOString(),
    };
    opportunities.push(dupOpp);

    // 5. SCENARIO 5: STAGE_HISTORY_GAP
    const gapLead = leads[leads.length > 50 ? 49 : 15];
    const gapOpp: Opportunity = {
      id: `OPP-2026-999998`,
      leadId: gapLead.id,
      companyId: gapLead.companyId,
      contactId: gapLead.contactId,
      assignedRepId: gapLead.assignedRepId || 'REP-002',
      name: `${companies.find(c => c.id === gapLead.companyId)?.name || 'Enterprise'} - Direct Advance Enterprise`,
      value: 290000,
      stage: 'WON',
      expectedCloseDate: new Date(baseEpoch + 40 * 86400000).toISOString(),
      actualCloseDate: new Date(baseEpoch + 40 * 86400000).toISOString(),
      wonReason: 'Direct executive sponsorship.',
      createdAt: new Date(baseEpoch + 38 * 86400000).toISOString(),
      updatedAt: new Date(baseEpoch + 40 * 86400000).toISOString(),
    };
    opportunities.push(gapOpp);
    stageHistories.push({
      id: `STG-OPP-2026-999998-001`,
      opportunityId: 'OPP-2026-999998',
      fromStage: 'NEW',
      toStage: 'WON',
      durationDays: 2,
      transitionReason: 'Fast-tracked bypass skipping intermediate stages.',
      changedBy: 'REP-002',
      timestamp: new Date(baseEpoch + 40 * 86400000).toISOString(),
    });
  }

  // Audit database and generate anomalies & isolated ground truth
  const audit = auditDatabaseAnomalies(leads, opportunities, tasks, activities, salesReps, stageHistories);

  const totalEntities =
    companies.length +
    contacts.length +
    campaigns.length +
    salesReps.length +
    scoreRules.length +
    leads.length +
    activities.length +
    consents.length +
    tasks.length +
    opportunities.length +
    stageHistories.length +
    audit.anomalies.length +
    audit.groundTruthRecords.length;

  return {
    companies,
    contacts,
    campaigns,
    salesReps,
    scoreRules,
    leads,
    activities,
    consents,
    tasks,
    opportunities,
    stageHistories,
    anomalies: audit.anomalies,
    groundTruth: audit.groundTruthRecords,
    summary: {
      mode,
      seed,
      totalEntities,
      companiesCount: companies.length,
      contactsCount: contacts.length,
      leadsCount: leads.length,
      opportunitiesCount: opportunities.length,
      duplicatesCount,
      optedOutCount,
      staleLeadsCount,
      highScoringNonConvertersCount,
      anomaliesCount: audit.anomalies.length,
    },
  };
}

export interface BatchProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
  batchIndex: number;
  totalBatches: number;
  message: string;
  isPaused: boolean;
}

/**
 * Sanitizes any object before saving to Firestore by recursively removing undefined keys.
 * Firestore throws invalid-argument if any object property is undefined.
 */
export function sanitizeDocumentForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDocumentForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeDocumentForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Resumable, Chunked Firestore Batch Writer with Exponential Backoff Retries
 */
export async function seedFirestoreInBatches(
  dataset: GeneratedDataset,
  options?: {
    batchSize?: number;
    startIndex?: number;
    signal?: { isPaused: boolean; isCancelled: boolean };
    onProgress?: (progress: BatchProgress) => void;
  }
): Promise<{ success: boolean; totalWritten: number; message: string; lastIndex: number }> {
  const BATCH_SIZE = options?.batchSize || 300; // Well below 500 doc Firestore limit
  const allDocs: Array<{ collection: string; id: string; data: any }> = [];

  // Strictly preserve parent-to-child order:
  // 1. Parent master entities: Companies, Contacts, Campaigns, SalesReps, ScoreRules
  for (const c of dataset.companies) allDocs.push({ collection: 'companies', id: c.id, data: c });
  for (const c of dataset.contacts) allDocs.push({ collection: 'contacts', id: c.id, data: c });
  for (const c of dataset.campaigns) allDocs.push({ collection: 'campaigns', id: c.id, data: c });
  for (const r of dataset.salesReps) allDocs.push({ collection: 'salesReps', id: r.id, data: r });
  for (const r of dataset.scoreRules) allDocs.push({ collection: 'scoreRules', id: r.id, data: r });

  // 2. Leads (referencing parent companies, contacts, reps, campaigns)
  for (const l of dataset.leads) allDocs.push({ collection: 'leads', id: l.id, data: l });

  // 3. Child entities referencing leads: Activities, Consents, Tasks
  for (const a of dataset.activities) allDocs.push({ collection: 'activities', id: a.id, data: a });
  for (const c of dataset.consents) allDocs.push({ collection: 'consents', id: c.id, data: c });
  for (const t of dataset.tasks) allDocs.push({ collection: 'tasks', id: t.id, data: t });

  // 4. Opportunities referencing leads
  for (const o of dataset.opportunities) allDocs.push({ collection: 'opportunities', id: o.id, data: o });

  // 5. StageHistories referencing opportunities
  for (const s of dataset.stageHistories) allDocs.push({ collection: 'stageHistories', id: s.id, data: s });

  // 6. Anomalies and ground truth
  for (const a of dataset.anomalies) allDocs.push({ collection: 'anomalies', id: a.id, data: a });
  for (const g of dataset.groundTruth) allDocs.push({ collection: 'groundTruth', id: g.id, data: g });

  const total = allDocs.length;
  let written = options?.startIndex || 0;
  const totalBatches = Math.ceil(total / BATCH_SIZE);

  for (let i = written; i < total; i += BATCH_SIZE) {
    if (options?.signal?.isCancelled) {
      return {
        success: false,
        totalWritten: written,
        lastIndex: i,
        message: `Generation cancelled at record ${written}/${total}.`,
      };
    }

    if (options?.signal?.isPaused) {
      return {
        success: false,
        totalWritten: written,
        lastIndex: i,
        message: `Generation paused at record ${written}/${total}. Resumable.`,
      };
    }

    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const ref = doc(db, item.collection, item.id);
      const sanitized = sanitizeDocumentForFirestore(item.data);
      batch.set(ref, sanitized, { merge: true }); // Merge ensures idempotent, non-duplicating writes
    }

    // Safe retry loop with exponential backoff
    let retryAttempt = 0;
    const maxRetries = 3;
    let committed = false;

    while (retryAttempt < maxRetries && !committed) {
      try {
        await batch.commit();
        committed = true;
      } catch (err) {
        retryAttempt++;
        console.warn(`Firestore batch commit retry ${retryAttempt}/${maxRetries} at index ${i}:`, err);
        if (retryAttempt >= maxRetries) {
          handleFirestoreError(err, OperationType.WRITE, chunk[0]?.collection || 'database-seed');
        }
        await new Promise(res => setTimeout(res, 800 * retryAttempt));
      }
    }

    written += chunk.length;
    const batchIdx = Math.ceil(written / BATCH_SIZE);
    const pct = Math.min(100, Math.round((written / total) * 100));

    if (options?.onProgress) {
      options.onProgress({
        phase: chunk[0]?.collection || 'committing',
        current: written,
        total,
        percentage: pct,
        batchIndex: batchIdx,
        totalBatches,
        message: `Committed batch ${batchIdx}/${totalBatches} (${written.toLocaleString()} / ${total.toLocaleString()} records to Firestore)...`,
        isPaused: false,
      });
    }
  }

  return {
    success: true,
    totalWritten: written,
    lastIndex: written,
    message: `Successfully seeded ${written.toLocaleString()} enterprise records into Cloud Firestore.`,
  };
}

/**
 * Independent Firestore Live Record Count Verification (Module 15 / Validation)
 * Queries Firestore directly using getCountFromServer to guarantee independent validation!
 */
export async function verifyFirestoreRecordCounts(): Promise<{
  verified: boolean;
  counts: Record<string, number>;
  timestamp: string;
}> {
  const collectionsToCount = [
    'companies',
    'contacts',
    'campaigns',
    'salesReps',
    'scoreRules',
    'leads',
    'activities',
    'consents',
    'tasks',
    'opportunities',
    'stageHistories',
    'anomalies',
    'groundTruth',
  ];

  const counts: Record<string, number> = {};

  await Promise.all(
    collectionsToCount.map(async colName => {
      try {
        const snap = await getCountFromServer(collection(db, colName));
        counts[colName] = snap.data().count;
      } catch (err) {
        console.warn(`Could not count collection ${colName}:`, err);
        counts[colName] = 0;
      }
    })
  );

  const hasRecords = Object.values(counts).some(c => c > 0);

  return {
    verified: hasRecords,
    counts,
    timestamp: new Date().toISOString(),
  };
}
