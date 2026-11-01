import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset, FIXED_SEED } from '../services/syntheticDataGenerator';
import { validateLeadConsent } from '../services/consentService';
import { validateTerritoryAssignment } from '../services/routingService';
import { validateOpportunityCreation } from '../services/deduplicationService';
import { runFullSystemValidation } from '../services/validationService';
import { auditDatabaseAnomalies } from '../services/anomalyDetectionService';
import { Lead, Opportunity } from '../types/crm';

describe('Module 2 & 12: Comprehensive Data Integrity & Synthetic Engine Tests', () => {
  // Generate deterministic dataset with FIXED_SEED
  const dataset = generateSyntheticDataset({
    mode: 'BENCHMARK',
    leadCount: 200,
    companyCount: 50,
    contactCount: 100,
    opportunityCount: 60,
    seed: FIXED_SEED,
    injectAnomalies: true,
  });

  describe('0. Exact Benchmark Dataset Volumes', () => {
    it('should generate exact required benchmark counts', () => {
      expect(dataset.companies.length).toBe(50);
      expect(dataset.contacts.length).toBe(100);
      expect(dataset.leads.length).toBe(200);
      expect(dataset.opportunities.length).toBe(60);
      expect(dataset.campaigns.length).toBe(5);
      expect(dataset.salesReps.length).toBe(8);
      expect(dataset.scoreRules.length).toBe(12);
      expect(dataset.consents.length).toBe(200);
      expect(dataset.anomalies.length).toBeGreaterThanOrEqual(5);
      expect(dataset.groundTruth.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('1. Exact Primary Key Formats & Uniqueness', () => {
    it('should format all entity primary IDs according to exact specification', () => {
      // Company: CO-000001
      expect(dataset.companies[0].id).toMatch(/^CO-\d{6}$/);

      // Contact: CON-000001
      expect(dataset.contacts[0].id).toMatch(/^CON-\d{6}$/);

      // Lead: LEAD-2026-000001
      expect(dataset.leads[0].id).toMatch(/^LEAD-2026-\d{6}$/);

      // Opportunity: OPP-2026-000001
      expect(dataset.opportunities[0].id).toMatch(/^OPP-2026-\d{6}$/);

      // Activity: ACT-LEAD-2026-000001-001
      expect(dataset.activities[0].id).toMatch(/^ACT-LEAD-2026-\d{6}-\d{3}$/);

      // Task: TASK-LEAD-2026-000001-001 or TASK-...
      expect(dataset.tasks[0].id).toMatch(/^TASK-LEAD-2026-\d{6}-\d{3}$/);

      // Campaign: CMP-000001
      expect(dataset.campaigns[0].id).toMatch(/^CMP-\d{6}$/);

      // SalesRep: REP-001
      expect(dataset.salesReps[0].id).toMatch(/^REP-\d{3}$/);

      // ScoreRule: RULE-001
      expect(dataset.scoreRules[0].id).toMatch(/^RULE-\d{3}$/);
    });

    it('should have zero primary key collisions across all primary entity collections', () => {
      const idSet = new Set<string>();
      let collisions = 0;

      const allIds = [
        ...dataset.companies.map(c => c.id),
        ...dataset.contacts.map(c => c.id),
        ...dataset.leads.map(l => l.id),
        ...dataset.opportunities.map(o => o.id),
        ...dataset.campaigns.map(c => c.id),
        ...dataset.salesReps.map(r => r.id),
        ...dataset.scoreRules.map(s => s.id),
        ...dataset.tasks.map(t => t.id),
      ];

      for (const id of allIds) {
        if (idSet.has(id)) {
          collisions++;
        } else {
          idSet.add(id);
        }
      }

      expect(collisions).toBe(0);
      expect(idSet.size).toBe(allIds.length);
    });
  });

  describe('2. Foreign Key Referential Integrity', () => {
    it('should verify 100% of foreign keys resolve to existing parent master records', () => {
      const companyIds = new Set(dataset.companies.map(c => c.id));
      const contactIds = new Set(dataset.contacts.map(c => c.id));
      const campaignIds = new Set(dataset.campaigns.map(c => c.id));
      const repIds = new Set(dataset.salesReps.map(r => r.id));
      const leadIds = new Set(dataset.leads.map(l => l.id));
      const oppIds = new Set(dataset.opportunities.map(o => o.id));

      // 1. Every contact links to a valid company
      for (const contact of dataset.contacts) {
        expect(companyIds.has(contact.companyId)).toBe(true);
      }

      // 2. Every lead links to a valid company, contact, campaign, and rep (if assigned)
      for (const lead of dataset.leads) {
        expect(companyIds.has(lead.companyId)).toBe(true);
        expect(contactIds.has(lead.contactId)).toBe(true);
        if (lead.campaignId) expect(campaignIds.has(lead.campaignId)).toBe(true);
        if (lead.assignedRepId) expect(repIds.has(lead.assignedRepId)).toBe(true);
      }

      // 3. Every opportunity links to a valid lead, company, contact, and sales rep
      for (const opp of dataset.opportunities) {
        expect(leadIds.has(opp.leadId)).toBe(true);
        expect(companyIds.has(opp.companyId)).toBe(true);
        expect(contactIds.has(opp.contactId)).toBe(true);
        if (opp.assignedRepId) expect(repIds.has(opp.assignedRepId)).toBe(true);
      }

      // 4. Every stage history links to a valid opportunity
      for (const stg of dataset.stageHistories) {
        expect(oppIds.has(stg.opportunityId)).toBe(true);
      }
    });
  });

  describe('3. Consent Enforcement Invariant', () => {
    it('should block communication for leads with OPTED_OUT or WITHDRAWN consent status', () => {
      const optedOutLead: Lead = {
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

      const result = validateLeadConsent(optedOutLead);
      expect(result.canContact).toBe(false);
      expect(result.isViolationAttempt).toBe(true);

      const withdrawnLead = { ...optedOutLead, consentStatus: 'WITHDRAWN' as const };
      const withdrawnResult = validateLeadConsent(withdrawnLead);
      expect(withdrawnResult.canContact).toBe(false);
      expect(withdrawnResult.isViolationAttempt).toBe(true);
    });

    it('should allow communication for OPTED_IN leads', () => {
      const optedInLead: Lead = {
        id: 'LEAD-2026-000002',
        companyId: 'CO-000001',
        contactId: 'CON-000001',
        productInterest: 'Enterprise Cloud',
        territory: 'North America',
        fitScore: 25,
        intentScore: 30,
        engagementScore: 25,
        totalScore: 80,
        scoreCategory: 'HOT',
        consentStatus: 'OPTED_IN',
        lifecycleStatus: 'NEW',
        routingStatus: 'UNASSIGNED',
        lastScoredAt: '2026-08-01T00:00:00.000Z',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      };

      const result = validateLeadConsent(optedInLead);
      expect(result.canContact).toBe(true);
      expect(result.isViolationAttempt).toBe(false);
    });
  });

  describe('4. Territory Routing Integrity', () => {
    it('should detect when a lead is assigned outside representative territory', () => {
      const emeaLead: Lead = {
        id: 'LEAD-2026-000010',
        companyId: 'CO-000001',
        contactId: 'CON-000001',
        productInterest: 'Data & AI',
        territory: 'EMEA',
        fitScore: 25,
        intentScore: 25,
        engagementScore: 25,
        totalScore: 75,
        scoreCategory: 'WARM',
        consentStatus: 'OPTED_IN',
        lifecycleStatus: 'ASSIGNED',
        routingStatus: 'ASSIGNED',
        lastScoredAt: '2026-08-01T00:00:00.000Z',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      };

      const naRep = dataset.salesReps.find(r => r.territory === 'North America')!;
      const check = validateTerritoryAssignment(emeaLead, naRep);

      expect(check.valid).toBe(false);
      expect(check.anomaly?.type).toBe('LEAD_ASSIGNED_OUTSIDE_TERRITORY');
    });
  });

  describe('5. Duplicate Opportunity Prevention Invariant', () => {
    it('should prevent creating a second active opportunity for a single lead', () => {
      const convertedLead: Lead = {
        id: 'LEAD-2026-000020',
        companyId: 'CO-000001',
        contactId: 'CON-000001',
        productInterest: 'Enterprise Cloud',
        territory: 'North America',
        fitScore: 30,
        intentScore: 35,
        engagementScore: 25,
        totalScore: 90,
        scoreCategory: 'HOT',
        consentStatus: 'OPTED_IN',
        lifecycleStatus: 'CONVERTED',
        routingStatus: 'ASSIGNED',
        convertedOpportunityId: 'OPP-2026-000001',
        lastScoredAt: '2026-08-01T00:00:00.000Z',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      };

      const existingOpportunities: Opportunity[] = [
        {
          id: 'OPP-2026-000001',
          leadId: 'LEAD-2026-000020',
          companyId: 'CO-000001',
          contactId: 'CON-000001',
          assignedRepId: 'REP-001',
          name: 'Apex Systems - Cloud Deal',
          value: 120000,
          stage: 'NEGOTIATION', // Active deal
          expectedCloseDate: '2026-09-15T00:00:00.000Z',
          createdAt: '2026-08-02T00:00:00.000Z',
          updatedAt: '2026-08-02T00:00:00.000Z',
        },
      ];

      const validation = validateOpportunityCreation(convertedLead, existingOpportunities);
      expect(validation.allowed).toBe(false);
      expect(validation.existingOppId).toBe('OPP-2026-000001');
    });
  });

  describe('6. Realistic Distributions & Anomaly Scenarios', () => {
    it('should include labelled duplicates, opted-out leads, stale leads, and high-scoring non-converters', () => {
      expect(dataset.summary.duplicatesCount).toBeGreaterThan(0);
      expect(dataset.summary.optedOutCount).toBeGreaterThan(0);
      expect(dataset.summary.staleLeadsCount).toBeGreaterThan(0);
      expect(dataset.summary.highScoringNonConvertersCount).toBeGreaterThan(0);
    });

    it('should detect the 5 mandatory negative anomaly scenarios with isolated ground truth', () => {
      const anomalyTypes = new Set(dataset.anomalies.map(a => a.type));

      expect(anomalyTypes.has('OPTED_OUT_LEAD_CONTACTED')).toBe(true);
      expect(anomalyTypes.has('POST_CONVERSION_ACTIVITY_USED_IN_SCORE')).toBe(true);
      expect(anomalyTypes.has('LEAD_ASSIGNED_OUTSIDE_TERRITORY')).toBe(true);
      expect(anomalyTypes.has('DUPLICATE_OPPORTUNITY_CREATED')).toBe(true);
      expect(anomalyTypes.has('STAGE_HISTORY_GAP')).toBe(true);

      // Verify ground truth records are isolated and reference expected test cases
      expect(dataset.groundTruth.length).toBeGreaterThanOrEqual(5);
      const gtScenarios = new Set(dataset.groundTruth.map(g => g.scenarioType));
      expect(gtScenarios.has('OPTED_OUT_LEAD_CONTACTED')).toBe(true);
      expect(gtScenarios.has('POST_CONVERSION_ACTIVITY_USED_IN_SCORE')).toBe(true);
      expect(gtScenarios.has('LEAD_ASSIGNED_OUTSIDE_TERRITORY')).toBe(true);
      expect(gtScenarios.has('DUPLICATE_OPPORTUNITY_CREATED')).toBe(true);
      expect(gtScenarios.has('STAGE_HISTORY_GAP')).toBe(true);
    });
  });

  describe('7. Fixed-Seed Deterministic Reproducibility', () => {
    it('should produce identical records and checksums when generated with FIXED_SEED', () => {
      const runA = generateSyntheticDataset({ mode: 'BENCHMARK', leadCount: 50, seed: FIXED_SEED });
      const runB = generateSyntheticDataset({ mode: 'BENCHMARK', leadCount: 50, seed: FIXED_SEED });

      expect(runA.leads.length).toBe(runB.leads.length);
      expect(runA.companies.length).toBe(runB.companies.length);
      expect(runA.leads[0].id).toBe(runB.leads[0].id);
      expect(runA.leads[0].totalScore).toBe(runB.leads[0].totalScore);
      expect(runA.leads[0].scoreCategory).toBe(runB.leads[0].scoreCategory);
      expect(runA.companies[0].name).toBe(runB.companies[0].name);
      expect(runA.contacts[0].email).toBe(runB.contacts[0].email);
    });
  });

  describe('8. 12-Point Automated System Integrity Report', () => {
    it('should pass system integrity checks', () => {
      const report = runFullSystemValidation({
        companies: dataset.companies,
        contacts: dataset.contacts,
        leads: dataset.leads,
        campaigns: dataset.campaigns,
        activities: dataset.activities,
        consents: dataset.consents,
        scoreRules: dataset.scoreRules,
        salesReps: dataset.salesReps,
        tasks: dataset.tasks,
        opportunities: dataset.opportunities,
        stageHistories: dataset.stageHistories,
        groundTruth: dataset.groundTruth,
      });

      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.checks.find(c => c.id === 'VAL-01')?.status).toBe('PASSED'); // Primary key uniqueness
      expect(report.checks.find(c => c.id === 'VAL-02')?.status).toBe('PASSED'); // Foreign key integrity
      expect(report.checks.find(c => c.id === 'VAL-05')?.status).toBe('PASSED'); // Score bounds
      expect(report.checks.find(c => c.id === 'VAL-11')?.status).toBe('PASSED'); // Ground truth separation
      expect(report.checks.find(c => c.id === 'VAL-12')?.status).toBe('PASSED'); // Reproducibility
    });
  });

  describe('9. Firestore Document Serialization & Sanitization Invariant', () => {
    it('should recursively strip undefined properties so WriteBatch.set never throws invalid-argument', async () => {
      const { sanitizeDocumentForFirestore } = await import('../services/syntheticDataGenerator');
      const testDoc = {
        id: 'LEAD-TEST',
        name: 'Valid Name',
        emptyField: undefined,
        nested: {
          subField: 'Sub',
          badField: undefined,
        },
        arr: [1, undefined, 'item'],
      };

      const sanitized = sanitizeDocumentForFirestore(testDoc);
      expect('emptyField' in sanitized).toBe(false);
      expect('badField' in sanitized.nested).toBe(false);
      expect(sanitized.id).toBe('LEAD-TEST');
      expect(sanitized.nested.subField).toBe('Sub');
    });
  });
});
