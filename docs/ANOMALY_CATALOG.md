# LEADPULSE AI – Anomaly Catalog & Negative Scenarios Specification

## 1. Overview
To ensure production resilience, compliance vigilance, and reliable machine learning evaluation, **LEADPULSE AI** injects and continuously audits **5 mandatory negative anomaly scenarios**.

All anomalies are maintained with strict **ground truth isolation**—isolated ground truth labels exist in `ground_truth` and are never exposed as input features to scoring or routing algorithms.

---

## 2. Catalog of Mandatory Anomaly Scenarios

### Anomaly 1: Opted-Out Lead Contacted (`OPTED_OUT_LEAD_CONTACTED`)
- **Category:** Regulatory Compliance & Legal Risk (GDPR / TCPA)
- **Severity:** `CRITICAL`
- **Violation Description:** An active sales outreach task is created or assigned for a lead whose documented consent status is `OPTED_OUT` or `WITHDRAWN`.
- **Target Entity:** `tasks` & `leads`
- **Injection Mechanics:**
  - Lead `LEAD-2026-000003` (or designated benchmark lead) has `Consent.status = 'OPTED_OUT'`.
  - An outreach task `TASK-LEAD-2026-000003-001` is force-generated.
- **Detection Algorithm:**
  ```typescript
  if ((consent.status === 'OPTED_OUT' || consent.status === 'WITHDRAWN') && activeTasksForLead.length > 0) {
    flagAnomaly('OPTED_OUT_LEAD_CONTACTED', 'CRITICAL', lead.id);
  }
  ```
- **Remediation:** Immediately cancel all associated tasks, set task status to `CANCELLED`, and audit originating workflow.

---

### Anomaly 2: Post-Conversion Activity Used in Score (`POST_CONVERSION_ACTIVITY_USED_IN_SCORE`)
- **Category:** Data Integrity & Temporal Leakage
- **Severity:** `HIGH`
- **Violation Description:** Behavioral activities occurring after the lead's conversion timestamp (`Activity.createdAt > Lead.convertedAt`) are included in the lead's predictive score calculation, creating artificial performance inflation.
- **Target Entity:** `activities` & `leads`
- **Injection Mechanics:**
  - Lead has `convertedAt = '2026-03-01T12:00:00Z'`.
  - A `DEMO_REQUEST` activity (+15 pts) is logged at `'2026-03-05T10:00:00Z'` with `isPostConversion = true`.
  - The scoring engine incorrectly credits these 15 points to `Lead.intentScore`.
- **Detection Algorithm:**
  ```typescript
  const postActivities = activities.filter(a => lead.convertedAt && a.createdAt > lead.convertedAt);
  if (postActivities.some(a => a.points > 0 && lead.intentScore >= expectedPreConversionIntent + a.points)) {
    flagAnomaly('POST_CONVERSION_ACTIVITY_USED_IN_SCORE', 'HIGH', lead.id);
  }
  ```
- **Remediation:** Recalculate lead score filtering strictly on `Activity.createdAt <= Lead.convertedAt`.

---

### Anomaly 3: Lead Assigned Outside Territory (`LEAD_ASSIGNED_OUTSIDE_TERRITORY`)
- **Category:** Operational Governance & Territory Protection
- **Severity:** `MEDIUM`
- **Violation Description:** A lead situated in one territory (e.g., `EMEA`) is assigned to a sales representative chartered exclusively in a different territory (e.g., `North America`).
- **Target Entity:** `leads` & `sales_reps`
- **Injection Mechanics:**
  - Lead `LEAD-2026-000008` has `territory = 'EMEA'`.
  - Assigned representative `REP-001` has `territory = 'North America'`.
- **Detection Algorithm:**
  ```typescript
  if (lead.assignedSalesRepId && rep && rep.territory !== lead.territory) {
    flagAnomaly('LEAD_ASSIGNED_OUTSIDE_TERRITORY', 'MEDIUM', lead.id);
  }
  ```
- **Remediation:** Re-route lead to an active eligible representative within the matching territory.

---

### Anomaly 4: Duplicate Opportunity Created (`DUPLICATE_OPPORTUNITY_CREATED`)
- **Category:** Pipeline Hygiene & Revenue Governance
- **Severity:** `HIGH`
- **Violation Description:** Violation of the `1:0..1` lead-to-opportunity cardinality rule. Two or more distinct opportunities reference the exact same originating `leadId`.
- **Target Entity:** `opportunities`
- **Injection Mechanics:**
  - Opportunities `OPP-2026-000010` and `OPP-2026-000011` both reference `leadId = 'LEAD-2026-000010'`.
- **Detection Algorithm:**
  ```typescript
  const leadOppCounts = new Map<string, number>();
  for (const opp of opportunities) {
    leadOppCounts.set(opp.leadId, (leadOppCounts.get(opp.leadId) || 0) + 1);
  }
  leadOppCounts.forEach((count, leadId) => {
    if (count > 1) flagAnomaly('DUPLICATE_OPPORTUNITY_CREATED', 'HIGH', leadId);
  });
  ```
- **Remediation:** Consolidate deal history into primary opportunity and mark redundant opportunity as `CANCELLED_DUPLICATE`.

---

### Anomaly 5: Stage History Gap (`STAGE_HISTORY_GAP`)
- **Category:** Process Adherence & Stage Continuity
- **Severity:** `LOW`
- **Violation Description:** An opportunity skips required milestone stages without corresponding audit history entries (e.g., jumping from `NEW` directly to `NEGOTIATION` without a `QUALIFIED` or `PROPOSAL` stage history record).
- **Target Entity:** `stage_history` & `opportunities`
- **Injection Mechanics:**
  - Opportunity is currently in `NEGOTIATION`.
  - `stage_history` records contain only a transition from `NEW` to `NEGOTIATION`.
- **Detection Algorithm:**
  ```typescript
  const stageOrder = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  // Verify sequential adjacency in stage history records
  ```
- **Remediation:** Require mandatory manager override signoff and append missing audit reason.

---

## 3. Isolated Ground Truth Architecture
Ground truth records are stored in the dedicated collection `ground_truth` and exported as `ground_truth.csv`.

**Invariant Rule:** No application algorithm or predictive scoring formula may query `ground_truth` during operational runtime. It is reserved exclusively for:
1. Automated QA test assertions (`vitest`).
2. Anomaly sentinel accuracy evaluations (Confusion Matrix, Precision, Recall).
3. Independent validation audits.
