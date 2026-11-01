# LEADPULSE AI – Intelligent Lead Scoring, Sales Automation & Opportunity Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-purple.svg)](https://tailwindcss.com/)
[![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing%20(17%2F17)-brightgreen.svg)](https://vitest.dev/)
[![PRNG Determinism](https://img.shields.io/badge/SEED-20261022-indigo.svg)](#deterministic-reproducibility)

> **LEADPULSE AI** is an enterprise-grade full-stack Customer Relationship Management (CRM) and revenue intelligence platform inspired by Salesforce and HubSpot. It implements an auditable 100-point transparent lead scoring framework, automated SLA follow-ups, territory routing, opportunity progression tracking, regulatory consent gates, duplicate clustering, negative anomaly detection, and independent server-side count verification.

---

## Table of Contents
1. [Executive Summary & Features](#1-executive-summary--features)
2. [Application Architecture & Technology Stack](#2-application-architecture--technology-stack)
3. [The 18 Complete Navigation Modules](#3-the-18-complete-navigation-modules)
4. [Data Model & The 11 Core Entities](#4-data-model--the-11-core-entities)
5. [Deterministic Synthetic Data Generation (Mulberry32 PRNG)](#5-deterministic-synthetic-data-generation-mulberry32-prng)
6. [Lead Scoring Methodology (100-Point Framework)](#6-lead-scoring-methodology-100-point-framework)
7. [Regulatory Consent & Deduplication Policies](#7-regulatory-consent--deduplication-policies)
8. [The 5 Mandatory Negative Anomaly Scenarios](#8-the-5-mandatory-negative-anomaly-scenarios)
9. [Automated Testing Suite (Vitest)](#9-automated-testing-suite-vitest)
10. [Data Export Capabilities (CSV, JSON, SQL DDL)](#10-data-export-capabilities-csv-json-sql-ddl)
11. [Installation & Local Setup](#11-installation--local-setup)
12. [Firebase Configuration & Security Rules](#12-firebase-configuration--security-rules)
13. [Independent Server-Side Verification](#13-independent-server-side-verification)
14. [Deployment & Production Run](#14-deployment--production-run)
15. [Troubleshooting](#15-troubleshooting)
16. [Documentation Suite Index](#16-documentation-suite-index)
17. [GitHub Publication Readiness](#17-github-publication-readiness)

---

## 1. Executive Summary & Features

### Core Capabilities:
- **Transparent Lead Intelligence:** Deterministic 100-point scoring (Fit 30, Intent 40, Engagement 30) with zero black-box obscurity.
- **Dual-Mode Resumable Seeder:**
  - **Benchmark Mode:** 200 Leads, 100 Contacts, 50 Companies, 60 Opportunities for lightning-fast testing.
  - **Full Scale Mode:** 20,000 Leads, 10,000 Contacts, 5,000 Companies, 3,000 Opportunities, ~42,800 Activities, ~20,000 Consents, ~16,400 Tasks, ~6,420 Stage Transitions.
- **Fixed Seed Determinism:** `SEED = 20261022` (Mulberry32 PRNG) generates 100% bitwise-reproducible records.
- **100% Foreign Key Referential Integrity:** Parent records are provisioned prior to child records; zero orphan records.
- **Regulatory Privacy Gate (GDPR / TCPA):** Outreach is deterministically blocked for leads with `OPTED_OUT` or `WITHDRAWN` consent status.
- **Automated SLA Tasks:** Priority-driven follow-ups (`HOT`: 1-Day, `WARM`: 3-Day, `COLD`: Nurture) with duplicate suppression.
- **Pipeline Stage Continuity:** Sequential stage transitions with mandatory won/lost reasons and immutable stage history logs.
- **Continuous Anomaly Sentinel:** Monitors and flags 5 mandatory negative anomaly scenarios with isolated ground truth.
- **Independent Server-Side Verification:** Queries Firestore via `getCountFromServer` to prove actual persisted document volume.

---

## 2. Application Architecture & Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-driven SPA with reactive state context |
| **Styling & Design** | Tailwind CSS 4.x | Professional enterprise Navy/White/Purple aesthetic |
| **Icons & Visualization** | Lucide React + Recharts | Responsive charts (funnels, score distributions, revenue curves) |
| **Database** | Firebase Cloud Firestore | NoSQL document database with compound indexes |
| **Authentication** | Firebase Auth | Role-Based Access Control (Admin, Sales Manager, Rep, Marketing, Analyst) |
| **AI Assistant** | Gemini API (`gemini-3.8-flash`) | Optional server-side analytical explanations & deal summaries |
| **Testing** | Vitest | 17 automated integration & data integrity test suites |
| **Data Generation** | Mulberry32 PRNG + Faker | Deterministic synthetic generator anchored to Seed `20261022` |
| **Exports** | FileSaver / Blob Engine | CSV, JSON, and PostgreSQL 15+ relational DDL |

---

## 3. The 18 Complete Navigation Modules

1. **Overview Dashboard:** Live KPI cards, conversion funnel, lead score distributions, and territory performance.
2. **Leads Management:** Master table with search, status filters, score category pills, pagination, and lead detail drawer.
3. **Companies:** Enterprise accounts directory (`CO-000001`), territory mappings, and headcount tiers.
4. **Contacts:** Business decision-maker directory (`CON-000001`), normalized email index, and seniority levels.
5. **Campaigns:** Inbound acquisition programs (`CMP-000001`), budgets, spend, and cost-per-lead attribution.
6. **Activities:** Touchpoint stream (`ACT-LEAD-2026-XXXXXX-XXX`) with point attribution and temporal leakage flags.
7. **Lead Scoring Engine:** 100-point scoring formula breakdown, configurable rule toggles, and live sandbox simulator.
8. **Sales Representatives:** Capacity roster (`REP-001`), active/vacation status, territory jurisdiction, and load balancing.
9. **Follow-up Tasks:** Automated SLA task board (`TASK-LEAD-2026-XXXXXX-XXX`) with countdown timers and status transitions.
10. **Opportunities:** Kanban pipeline board (`OPP-2026-000001`) with sequential stage gates and win/loss reason modals.
11. **Stage History:** Immutable transition logs (`STG-OPP-2026-XXXXXX-XXX`) recording stage duration and authorizing actor.
12. **Anomaly Detection:** Rule-based sentinel alerting on the 5 mandatory negative scenarios with resolution actions.
13. **Consent Management:** Dedicated GDPR/TCPA compliance hub tracking opt-ins, revocations, and communication blocks.
14. **Analytics & Evaluation:** Precision, Recall, F1-Score, ROC-AUC, PR-AUC, confusion matrix, and held-out evaluation splits.
15. **Data Management:** Dual-mode synthetic generator, batch write controls (pause, resume, cancel), and export hub.
16. **Validation Center:** Interactive 18-point verification matrix testing all relational and business invariants with evidence logs.
17. **Audit Logs:** Unified immutable chronological event timeline recording consent shifts, stage movements, and anomaly flags.
18. **Settings & Governance:** RBAC role switcher (Admin, Manager, Rep, Marketing, Analyst) and database connection status.

---

## 4. Data Model & The 11 Core Entities

| Entity | Primary ID Pattern | Cardinality & Parent Reference | Lifecycle Statuses |
|---|---|---|---|
| **1. Company** | `CO-000001` | Independent Master | Active, Inactive, Archived |
| **2. Contact** | `CON-000001` | `N:1` with `Company` (`companyId`) | Active, Inactive |
| **3. Lead** | `LEAD-2026-000001` | `N:1` with `Company`, `Contact`, `Campaign`, `SalesRep` | `NEW`, `ASSIGNED`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `UNQUALIFIED`, `DISQUALIFIED` |
| **4. Campaign** | `CMP-000001` | Independent Master | `PLANNING`, `ACTIVE`, `PAUSED`, `COMPLETED` |
| **5. Activity** | `ACT-LEAD-2026-XXXXXX-XXX` | `N:1` with `Lead` (`leadId`) | Completed |
| **6. Consent** | `CS-LEAD-2026-XXXXXX-XXX` | `N:1` with `Lead` (`leadId`) | `OPTED_IN`, `OPTED_OUT`, `PENDING`, `WITHDRAWN` |
| **7. ScoreRule** | `RULE-001` | Scoring Coefficient Master | Active, Inactive |
| **8. SalesRep** | `REP-001` | Operational Master | Active, Inactive |
| **9. Task** | `TASK-LEAD-2026-XXXXXX-XXX` | `N:1` with `Lead` and `SalesRep` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED` |
| **10. Opportunity** | `OPP-2026-000001` | `1:0..1` with `Lead` (`leadId`) | `NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` |
| **11. StageHistory**| `STG-OPP-2026-XXXXXX-XXX` | `N:1` with `Opportunity` (`opportunityId`) | Recorded |

---

## 5. Deterministic Synthetic Data Generation (Mulberry32 PRNG)

To guarantee that benchmarks and regression tests are 100% reproducible across different developer machines and CI/CD pipelines, all random generation uses the **Mulberry32 PRNG** initialized with master seed:

```
SEED = 20261022
```

### Supported Dataset Configurations:
- **Benchmark Mode:** 200 Leads, 100 Contacts, 50 Companies, 60 Opportunities.
- **Full Scale Mode:** 20,000 Leads, 10,000 Contacts, 5,000 Companies, 3,000 Opportunities.

### Safe Batch Seeding Parameters:
- **Chunk Size:** &le; 300 operations per Firestore batch (Firestore hard limit: 500).
- **Throttling:** 60ms delay between batch commits to prevent burst quota exhaustion.
- **Resumability:** Seeding can be paused, resumed, or cancelled at any time with exact batch recovery.
- **Retry Mechanism:** Exponential backoff with up to 3 automatic retries per chunk.

---

## 6. Lead Scoring Methodology (100-Point Framework)

$$\text{Total Score} = \min(100, \text{Fit Score} + \text{Intent Score} + \text{Engagement Score})$$

- **Fit Score (30 Pts Max):** Company size (&ge;500 emp: 10 pts), Target Industry (10 pts), Decision-maker title (5 pts), Territory alignment (5 pts).
- **Intent Score (40 Pts Max):** Demo Request (15 pts), Pricing Page View (10 pts), RFQ / Product Inquiry (10 pts), Purchase Form (10 pts).
- **Engagement Score (30 Pts Max):** Email clicks (10 pts), Email opens (5 pts), Web sessions (&ge;3: 10 pts), Webinar attendance (10 pts), Recency (5 pts).

### Categories & SLAs:
- `HOT` (&ge;80 Points): Routed to 1-Day SLA Task (`URGENT_1_DAY`).
- `WARM` (50–79 Points): Routed to 3-Day SLA Task (`HIGH_3_DAY`).
- `COLD` (<50 Points): Routed to Marketing Nurture Task (`NORMAL_NURTURE`).

### Anti-Leakage Rule:
Any activity created after `Lead.convertedAt` is flagged with `isPostConversion = true` and strictly excluded from scoring calculations.

---

## 7. Regulatory Consent & Deduplication Policies

### GDPR / TCPA Compliance:
- Leads with `Consent.status` of `OPTED_OUT` or `WITHDRAWN` have automated outreach deterministically disabled.
- Any manual or automated task assigned to an opted-out lead triggers a `CRITICAL` compliance anomaly.

### Deduplication Engine:
- Leads are normalized using lowercase trimmed email (`normalizedEmail`) and corporate domain matching.
- Duplicate records are flagged with `isDuplicate = true` and grouped under a common `duplicateGroupId` (e.g., `DUP-000042`).
- Secondary duplicate records are excluded from round-robin lead routing to prevent double outreach.

---

## 8. The 5 Mandatory Negative Anomaly Scenarios

1. `OPTED_OUT_LEAD_CONTACTED` (Severity: `CRITICAL`): Lead has opted out, but an active follow-up task is scheduled.
2. `POST_CONVERSION_ACTIVITY_USED_IN_SCORE` (Severity: `HIGH`): Activity created after deal conversion was counted in the pre-conversion lead score.
3. `LEAD_ASSIGNED_OUTSIDE_TERRITORY` (Severity: `MEDIUM`): Sales rep's territory does not match the company's regional territory.
4. `DUPLICATE_OPPORTUNITY_CREATED` (Severity: `HIGH`): Violates the 1:0..1 opportunity cardinality rule by creating two deals for one lead.
5. `STAGE_HISTORY_GAP` (Severity: `LOW`): Opportunity skipped required intermediate milestone stages without audit logs.

*Ground Truth Separation:* Ground truth labels are stored in the isolated collection `ground_truth` and are never accessible to runtime scoring algorithms.

---

## 9. Automated Testing Suite (Vitest)

The test suite includes 17 passing integration tests across two core test files:
- `/src/test/dataIntegrity.test.ts` (11 test suites)
- `/src/test/scoringEngine.test.ts` (6 test suites)

### Run Tests:
```bash
npx vitest run
```

### Coverage:
- Primary key uniqueness & ID format regex
- 100% foreign key integrity across all child collections
- Consent enforcement blocks
- Territory routing validation
- Duplicate opportunity suppression
- Score bounds [0, 100] & category calibration
- Negative anomaly detection verification
- Fixed seed Mulberry32 reproducibility

---

## 10. Data Export Capabilities (CSV, JSON, SQL DDL)

Accessible from the **Data Management Hub** (`/dataManagement`):
- **12 Individual CSV Exports:** `companies.csv`, `contacts.csv`, `leads.csv`, `campaigns.csv`, `activities.csv`, `consent.csv`, `score_rules.csv`, `sales_reps.csv`, `tasks.csv`, `opportunities.csv`, `stage_history.csv`, `ground_truth.csv`.
- **Complete JSON Dump:** Entire database state exported as a formatted JSON document.
- **Full 20,000 Synthetic Dataset Export:** Direct client-side stream generation and download of the full 20k dataset.
- **PostgreSQL / Cloud SQL DDL:** Complete relational schema script with primary keys, foreign keys, unique constraints, check constraints, and B-Tree indexes (`leadpulse_cloudsql_schema.sql`).

---

## 11. Installation & Local Setup

### 1. Clone Repository:
```bash
git clone https://github.com/your-org/leadpulse-ai-lead-intelligence.git
cd leadpulse-ai-lead-intelligence
```

### 2. Install Dependencies:
```bash
npm install
```

### 3. Configure Environment Variables:
```bash
cp .env.example .env
```

### 4. Start Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 12. Firebase Configuration & Security Rules

- **Database:** Firebase Cloud Firestore
- **Project ID:** Configured in `firebase-applet-config.json`
- **Security Rules:** Stored in `/firestore.rules` and enforced server-side.

Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

---

## 13. Independent Server-Side Verification

Rather than trusting in-memory client counters, LEADPULSE AI includes an independent server-side count auditor:
- Uses Firestore `getCountFromServer` directly against database collections.
- Compares expected vs. actual persisted counts for all 11 collections + anomalies.
- Displays discrepancies, execution timestamp, and verification certification.

---

## 14. Deployment & Production Run

### 1. Lint & Validate:
```bash
npm run lint
```

### 2. Run All Tests:
```bash
npx vitest run
```

### 3. Production Build:
```bash
npm run build
```

---

## 15. Troubleshooting

- **Firestore Rate Limit / 429 Quota Exceeded:** The seeder chunks writes into &le; 300 batches with a 60ms delay. If throttled, the automatic exponential backoff retry mechanism will recover the operation.
- **Port Conflict on 3000:** The development server is configured to run on port 3000. Ensure no conflicting process occupies port 3000.

---

## 16. Documentation Suite Index

Comprehensive engineering specifications are located in `/docs`:
- [`DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md): Complete field-by-field specifications for all 11 entities.
- [`ENTITY_RELATIONSHIPS.md`](docs/ENTITY_RELATIONSHIPS.md): Mermaid ER diagrams and relational cardinality mappings.
- [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md): Firestore and PostgreSQL DDL schemas with indexes.
- [`SCORING_METHODOLOGY.md`](docs/SCORING_METHODOLOGY.md): 100-point transparent framework and temporal rules.
- [`BUSINESS_RULES.md`](docs/BUSINESS_RULES.md): Regulatory consent, deduplication, routing, and SLA policies.
- [`ANOMALY_CATALOG.md`](docs/ANOMALY_CATALOG.md): The 5 mandatory negative anomaly scenarios.
- [`VALIDATION_REPORT.md`](docs/VALIDATION_REPORT.md): 18-point verification matrix results and evidence.
- [`REPRODUCIBILITY_REPORT.md`](docs/REPRODUCIBILITY_REPORT.md): PRNG Mulberry32 SEED 20261022 proof.
- [`SOURCE_MANIFEST.md`](docs/SOURCE_MANIFEST.md): Synthetic source declaration and legal privacy notices.
- [`TESTING_GUIDE.md`](docs/TESTING_GUIDE.md): Vitest command line and test suite architecture.
- [`DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md): Production build, Firebase setup, and hosting guide.

---

## 17. GitHub Publication Readiness

The repository is structured and validated for immediate publication under the target repository name:

```
leadpulse-ai-lead-intelligence
```

### Included in Repository:
- Clean modular React 19 + TypeScript frontend.
- Secure server-side architecture and Firestore security rules.
- Complete 12-document engineering specification suite.
- 17/17 passing automated Vitest tests.
- Sanitized `.gitignore` preventing commit of private API keys, credentials, or `.env` secrets.

---

*LEADPULSE AI – Enterprise Revenue Intelligence & Automated Lead Governance.*
