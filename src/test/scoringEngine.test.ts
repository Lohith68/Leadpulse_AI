import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../services/leadScoringEngine';
import { validateLeadConsent } from '../services/consentService';
import { validateTerritoryAssignment } from '../services/routingService';
import { validateOpportunityCreation } from '../services/deduplicationService';
import { Company, Contact, Activity, Lead, SalesRep, Opportunity } from '../types/crm';

const mockCompany: Company = {
  id: 'CO-000001',
  name: 'Apex Systems',
  domain: 'apexsystems.com',
  industry: 'Technology',
  size: '1000+',
  employeeCount: 5000,
  annualRevenue: 900000000,
  city: 'San Francisco',
  state: 'CA',
  country: 'USA',
  territory: 'North America',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const mockContact: Contact = {
  id: 'CON-000001',
  companyId: 'CO-000001',
  firstName: 'Olivia',
  lastName: 'Vance',
  email: 'olivia.vance@apexsystems.com',
  normalizedEmail: 'olivia.vance@apexsystems.com',
  phone: '+1-555-0123',
  jobTitle: 'Chief Information Officer',
  roleLevel: 'C-Level',
  department: 'IT',
  city: 'San Francisco',
  country: 'USA',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('Module 3: Lead Scoring Engine Unit Tests', () => {
  it('should award 30 max points for optimal enterprise company fit', () => {
    const res = calculateLeadScore({
      company: mockCompany,
      contact: mockContact,
      activities: [],
    });

    expect(res.fitScore).toBe(30);
    expect(res.category).toBe('COLD'); // 30 points is COLD (<50)
  });

  it('should calculate HOT category (&ge;80 pts) when high-intent activities exist', () => {
    const activities: Activity[] = [
      { id: 'ACT-1', leadId: 'LEAD-1', type: 'DEMO_REQUEST', timestamp: '2026-08-02T10:00:00.000Z', pointsContributed: 15, isPostConversion: false, createdAt: '2026-08-02T10:00:00.000Z' },
      { id: 'ACT-2', leadId: 'LEAD-1', type: 'PRICING_PAGE_VIEW', timestamp: '2026-08-02T11:00:00.000Z', pointsContributed: 10, isPostConversion: false, createdAt: '2026-08-02T11:00:00.000Z' },
      { id: 'ACT-3', leadId: 'LEAD-1', type: 'PRODUCT_INQUIRY', timestamp: '2026-08-02T12:00:00.000Z', pointsContributed: 10, isPostConversion: false, createdAt: '2026-08-02T12:00:00.000Z' },
      { id: 'ACT-4', leadId: 'LEAD-1', type: 'EMAIL_CLICK', timestamp: '2026-08-02T13:00:00.000Z', pointsContributed: 10, isPostConversion: false, createdAt: '2026-08-02T13:00:00.000Z' },
      { id: 'ACT-5', leadId: 'LEAD-1', type: 'WEBSITE_VISIT', timestamp: '2026-08-02T14:00:00.000Z', pointsContributed: 5, isPostConversion: false, createdAt: '2026-08-02T14:00:00.000Z' },
      { id: 'ACT-6', leadId: 'LEAD-1', type: 'WEBSITE_VISIT', timestamp: '2026-08-02T15:00:00.000Z', pointsContributed: 5, isPostConversion: false, createdAt: '2026-08-02T15:00:00.000Z' },
      { id: 'ACT-7', leadId: 'LEAD-1', type: 'WEBSITE_VISIT', timestamp: '2026-08-02T16:00:00.000Z', pointsContributed: 5, isPostConversion: false, createdAt: '2026-08-02T16:00:00.000Z' },
      { id: 'ACT-8', leadId: 'LEAD-1', type: 'EVENT_ATTENDANCE', timestamp: '2026-08-02T17:00:00.000Z', pointsContributed: 5, isPostConversion: false, createdAt: '2026-08-02T17:00:00.000Z' },
    ];

    const res = calculateLeadScore({
      company: mockCompany,
      contact: mockContact,
      activities,
      scoringTimestamp: '2026-08-03T00:00:00.000Z',
    });

    expect(res.totalScore).toBeGreaterThanOrEqual(80);
    expect(res.category).toBe('HOT');
  });

  it('should strictly exclude post-conversion activity to prevent temporal data leakage', () => {
    const conversionDate = '2026-08-05T00:00:00.000Z';
    const activities: Activity[] = [
      { id: 'ACT-PRE', leadId: 'LEAD-1', type: 'PRICING_PAGE_VIEW', timestamp: '2026-08-03T00:00:00.000Z', pointsContributed: 10, isPostConversion: false, createdAt: '2026-08-03T00:00:00.000Z' },
      { id: 'ACT-POST', leadId: 'LEAD-1', type: 'DEMO_REQUEST', timestamp: '2026-08-10T00:00:00.000Z', pointsContributed: 15, isPostConversion: true, createdAt: '2026-08-10T00:00:00.000Z' },
    ];

    const res = calculateLeadScore({
      company: mockCompany,
      contact: mockContact,
      activities,
      conversionTimestamp: conversionDate,
      scoringTimestamp: '2026-08-12T00:00:00.000Z',
    });

    expect(res.temporalLeakageDetected).toBe(true);
    expect(res.excludedActivitiesCount).toBe(1);
    expect(res.intentScore).toBe(10); // Only ACT-PRE counted, ACT-POST excluded
  });
});

describe('Module 4: Regulatory Consent Invariants', () => {
  it('should block outreach when consent status is OPTED_OUT', () => {
    const lead: Lead = {
      id: 'LEAD-2026-000001',
      companyId: 'CO-000001',
      contactId: 'CON-000001',
      productInterest: 'Enterprise Cloud',
      territory: 'North America',
      fitScore: 25,
      intentScore: 30,
      engagementScore: 25,
      totalScore: 80,
      scoreCategory: 'HOT',
      consentStatus: 'OPTED_OUT',
      lifecycleStatus: 'NEW',
      routingStatus: 'UNASSIGNED',
      lastScoredAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const res = validateLeadConsent(lead);
    expect(res.canContact).toBe(false);
    expect(res.isViolationAttempt).toBe(true);
  });
});

describe('Module 6: Territory Boundary Enforcement', () => {
  it('should flag an anomaly if lead is assigned outside rep territory', () => {
    const lead: Lead = {
      id: 'LEAD-2026-000002',
      companyId: 'CO-000001',
      contactId: 'CON-000001',
      productInterest: 'Enterprise Cloud',
      territory: 'North America',
      fitScore: 20,
      intentScore: 20,
      engagementScore: 20,
      totalScore: 60,
      scoreCategory: 'WARM',
      consentStatus: 'OPTED_IN',
      lifecycleStatus: 'ASSIGNED',
      routingStatus: 'ASSIGNED',
      lastScoredAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const repInEmea: SalesRep = {
      id: 'REP-003',
      name: 'Elena Rostova',
      email: 'erostova@leadpulse.ai',
      territory: 'EMEA',
      specialization: 'Enterprise Cloud',
      capacityLimit: 30,
      activeLeadsCount: 5,
      quota: 1000000,
      pipelineWon: 500000,
      status: 'AVAILABLE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const check = validateTerritoryAssignment(lead, repInEmea);
    expect(check.valid).toBe(false);
    expect(check.anomaly?.type).toBe('LEAD_ASSIGNED_OUTSIDE_TERRITORY');
  });
});

describe('Module 8: Duplicate Opportunity Prevention', () => {
  it('should reject creating a second active opportunity for the same lead', () => {
    const lead: Lead = {
      id: 'LEAD-2026-000003',
      companyId: 'CO-000001',
      contactId: 'CON-000001',
      productInterest: 'Data & AI',
      territory: 'North America',
      fitScore: 25,
      intentScore: 30,
      engagementScore: 30,
      totalScore: 85,
      scoreCategory: 'HOT',
      consentStatus: 'OPTED_IN',
      lifecycleStatus: 'CONVERTED',
      routingStatus: 'ASSIGNED',
      convertedOpportunityId: 'OPP-2026-000001',
      lastScoredAt: '2026-08-01T00:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const existingOpps: Opportunity[] = [
      {
        id: 'OPP-2026-000001',
        leadId: 'LEAD-2026-000003',
        companyId: 'CO-000001',
        contactId: 'CON-000001',
        assignedRepId: 'REP-001',
        name: 'Apex Systems - Cloud Deal',
        value: 120000,
        stage: 'PROPOSAL',
        expectedCloseDate: '2026-09-15T00:00:00.000Z',
        createdAt: '2026-08-02T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
      },
    ];

    const check = validateOpportunityCreation(lead, existingOpps);
    expect(check.allowed).toBe(false);
    expect(check.existingOppId).toBe('OPP-2026-000001');
  });
});
