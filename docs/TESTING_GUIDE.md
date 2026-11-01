# LEADPULSE AI – Automated Testing & Quality Assurance Guide

## 1. Overview
The **LEADPULSE AI** platform includes a comprehensive automated test suite powered by **Vitest**. All relational invariants, scoring formulations, regulatory consent gates, territory routing protocols, duplicate protections, and anomaly detection rules are continuously tested.

---

## 2. Test Suites Layout

The test suite is located in `/src/test/`:

### A. Data Integrity & Invariants Suite (`/src/test/dataIntegrity.test.ts`)
1. **Primary Key Uniqueness Test:** Asserts that across all 11 core entities, every generated ID is globally distinct and free of collisions.
2. **ID Regex Format Validation:** Validates exact formatting standards (`CO-000001`, `CON-000001`, `LEAD-2026-000001`, `CMP-000001`, `REP-001`, `RULE-001`, `ACT-LEAD-2026-XXXXXX-XXX`, `TASK-LEAD-2026-XXXXXX-XXX`, `OPP-2026-000001`, `STG-OPP-2026-XXXXXX-XXX`).
3. **100% Foreign Key Referential Integrity:** Evaluates that every child record references an existing parent record in memory:
   - `contacts.companyId` &rarr; `companies.id`
   - `leads.companyId` &rarr; `companies.id`
   - `leads.contactId` &rarr; `contacts.id`
   - `leads.campaignId` &rarr; `campaigns.id`
   - `activities.leadId` &rarr; `leads.id`
   - `consents.leadId` &rarr; `leads.id`
   - `tasks.leadId` &rarr; `leads.id`
   - `opportunities.leadId` &rarr; `leads.id`
   - `stage_history.opportunityId` &rarr; `opportunities.id`
4. **Consent Enforcement Invariant:** Verifies that no outreach tasks are scheduled for leads marked `OPTED_OUT` or `WITHDRAWN` (excluding the controlled test anomaly).
5. **Territory Routing Invariant:** Verifies sales reps are assigned exclusively to leads matching their territory.
6. **Duplicate Opportunity Guard:** Ensures that at most one active opportunity exists per lead.
7. **Score Distribution Invariant:** Confirms that `HOT`, `WARM`, and `COLD` leads are generated with expected realistic distributions and high-scoring non-converters exist.
8. **Negative Anomaly Detection:** Injects and asserts detection of all 5 mandatory anomaly scenarios.
9. **Mulberry32 PRNG Fixed-Seed Determinism:** Proves identical record generation given the master seed `20261022`.
10. **Validation Report Certification:** Asserts that `runFullSystemValidation()` returns `PASSED` status.

### B. Lead Scoring Engine Suite (`/src/test/scoringEngine.test.ts`)
1. **Bounded Score Limits:** Asserts that `totalScore` is always between `0` and `100`.
2. **Sub-Score Bounds:** Asserts `fitScore <= 30`, `intentScore <= 40`, and `engagementScore <= 30`.
3. **Category Thresholds:** Confirms `HOT` for scores &ge; 80, `WARM` for 50–79, `COLD` for < 50.
4. **Missing Value Resilience:** Verifies graceful score calculation with partial metadata.
5. **Temporal Leakage Protection:** Asserts that post-conversion activities are strictly excluded from score calculation.
6. **Point-in-Time Score Traceability:** Validates that scoring engine recalculation reproduces identical totals.

---

## 3. Running Automated Tests

### Run All Tests Once (Headless Mode):
```bash
npx vitest run
```

### Run in Interactive Watch Mode:
```bash
npx vitest
```

### Expected Output:
```
 ✓ src/test/scoringEngine.test.ts (6 tests)
 ✓ src/test/dataIntegrity.test.ts (11 tests)

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Duration  ~1.2s
```

---

## 4. Acceptance Criteria
- **Zero Failures Allowed:** All 17 core integration tests must pass prior to production deployment.
- **No Mock Bypasses:** Tests execute against real generated objects using the production business logic functions.
