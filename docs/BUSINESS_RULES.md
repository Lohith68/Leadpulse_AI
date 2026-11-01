# LEADPULSE AI – Enterprise Business Rules & Policy Specifications

## 1. Overview
This document specifies the regulatory, sales operational, and workflow business logic enforced across **LEADPULSE AI**. All business rules are implemented through deterministic code paths that operate independently of optional AI assistance.

---

## 2. Regulatory Communication & Consent Rules (GDPR / TCPA)

### Rule Set BR-CON-01: Communication Eligibility
1. **Consent States:**
   - `OPTED_IN`: Authorized for automated emails, direct phone outreach, and marketing workflows.
   - `PENDING`: Outbound communication is throttled until explicit double opt-in confirmation is received.
   - `OPTED_OUT`: Hard enforcement block. All automated sales tasks, automated dialer sequences, and bulk campaigns are strictly prohibited.
   - `WITHDRAWN`: Equivalent to `OPTED_OUT`. Takes effect immediately upon receipt of revocation notice.
2. **Channel Specificity:**
   - Consent is managed on a per-channel basis (`EMAIL`, `PHONE`, `SMS`, `MARKETING`).
   - Revoking consent on `EMAIL` does not block `PHONE` if explicit phone consent remains `OPTED_IN`.
3. **Automated Enforcement:**
   - Task creation algorithms MUST verify `Consent.status` before assigning outreach tasks.
   - Any manual or automated task created for an `OPTED_OUT` or `WITHDRAWN` lead triggers a **CRITICAL** regulatory anomaly (`OPTED_OUT_LEAD_CONTACTED`).

---

## 3. Lead Deduplication & Clustering Rules

### Rule Set BR-DEDUP-01: Canonical Matching Criteria
1. **Normalized Email Collision:**
   - Two leads sharing the same canonical lowercase email (`normalizedEmail = email.toLowerCase().trim()`) are identified as duplicates.
2. **Domain + Persona Collision:**
   - Two leads sharing the exact same `company.domain` and `contact.lastName` submitted within a 30-day window are grouped.
3. **Clustering & Flags:**
   - The primary lead record retains `isDuplicate = false`.
   - Secondary and tertiary records are marked `isDuplicate = true` and assigned a common `duplicateGroupId` (e.g., `DUP-000042`).
   - Duplicate records are suppressed from automated round-robin sales routing to prevent competing reps from contacting the same buyer.

---

## 4. Territory Routing & Capacity Allocation Rules

### Rule Set BR-ROUT-01: Automated Assignment Protocol
1. **Territory Matching:**
   - Leads are routed exclusively to sales reps whose `territory` matches `Company.territory` (`North America`, `EMEA`, `APAC`, `LATAM`).
2. **Product Specialization Matching:**
   - If a sales rep has a specific `productSpecialization` (e.g., `Enterprise Cloud`), leads expressing interest in that product are prioritized.
   - Reps with specialization `'All Products'` act as generalized catchments.
3. **Capacity Constraints:**
   - A representative whose `currentLeadCount >= maxCapacity` is considered **saturated** and bypassed.
4. **Availability:**
   - Representatives with `isActive = false` (vacation, leave, offboarded) are strictly excluded.
5. **Round-Robin Tie-Breaking:**
   - When multiple eligible reps qualify, assignment falls to the rep with the lowest `currentLeadCount`.
6. **Exception Handling:**
   - If no active rep matches territory and capacity, `Lead.status` remains `NEW` with routing status `EXCEPTION`, alerting sales management.

---

## 5. SLA Task Automation Rules

### Rule Set BR-TASK-01: Score-Triggered Follow-up SLAs
1. **Urgency Classification:**
   - `HOT` Score (&ge;80): Creates `URGENT_1_DAY` task with `dueBusinessDays = 1`.
   - `WARM` Score (50–79): Creates `HIGH_3_DAY` task with `dueBusinessDays = 3`.
   - `COLD` Score (<50): Creates `NORMAL_NURTURE` task with `dueBusinessDays = 7`.
2. **Business Day Computation:**
   - Task due dates skip Saturdays and Sundays.
3. **Idempotency Invariant:**
   - Tasks generate a unique `idempotencyKey` formatted as:
     `IDEMP-{leadId}-{priority}-{date}`
   - The system guarantees zero duplicate active tasks for the same lead and priority.

---

## 6. Opportunity Lifecycle & Stage Transition Rules

### Rule Set BR-OPP-01: Pipeline Continuity
1. **Lead Conversion Cardinality:**
   - A lead can generate at most **one** active commercial opportunity (`1:0..1` relationship).
   - Once converted, `Lead.conversionStatus = 'CONVERTED'` and `Lead.status = 'CONVERTED'`.
2. **Stage Sequence:**
   $$\text{NEW} \longrightarrow \text{QUALIFIED} \longrightarrow \text{PROPOSAL} \longrightarrow \text{NEGOTIATION} \longrightarrow \text{WON} \mid \text{LOST}$$
3. **Mandatory Exit Criteria:**
   - Transition to `WON` requires a non-empty `wonReason` and sets `probability = 1.0`.
   - Transition to `LOST` requires a non-empty `lostReason` and sets `probability = 0.0`.
4. **Immutable Stage History:**
   - Every stage transition creates an append-only `StageHistory` record (`STG-OPP-2026-XXXXXX-XXX`) documenting `fromStage`, `toStage`, `durationDays`, `changedBy`, and `changedAt`.
   - Skipping intermediate stages without an audit event flags a `STAGE_HISTORY_GAP` anomaly.
