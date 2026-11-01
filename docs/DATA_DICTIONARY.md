# LEADPULSE AI – Comprehensive Data Dictionary

## 1. Overview
This Data Dictionary defines all 11 core entities, their primary/foreign key specifications, data types, cardinalities, allowed values, validation constraints, and business rules within the **LEADPULSE AI** platform.

---

## 2. Entity 1: Company (`companies`)
Represents target commercial organizations, accounts, and client enterprises.

- **Primary Key:** `id` (Format: `CO-000001` through `CO-005000`)
- **Collection / Table:** `companies`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^CO-\d{6}$` | N/A | Unique | PK | Immutable regex format `CO-000001` | Unique primary identifier for enterprise account. |
| `name` | string | Required | 2–120 characters | N/A | Non-unique | None | Non-empty string | Legal commercial company name. |
| `domain` | string | Required | Standard FQDN | N/A | Unique | None | Normalized lowercase domain | Web domain address used for duplicate resolution. |
| `industry` | string (enum) | Required | `Technology`, `Healthcare`, `Financial Services`, `Manufacturing`, `Retail`, `Education`, `Telecommunications`, `Energy` | N/A | Non-unique | None | In predefined set | Primary commercial market vertical. |
| `size` | string (enum) | Required | `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1000+` | Employees | Non-unique | None | In predefined set | Standard employee headcount tier. |
| `employeeCount`| number | Required | Integers &ge; 1 | Headcount | Non-unique | None | `employeeCount >= 1` | Exact estimated employee count. |
| `annualRevenue`| number | Required | Number &ge; 0 | USD ($) | Non-unique | None | Non-negative numeric | Estimated annual gross revenue in USD. |
| `city` | string | Required | 1–80 characters | N/A | Non-unique | None | Non-empty | Operational headquarters city. |
| `state` | string | Required | 2–80 characters | N/A | Non-unique | None | Non-empty | State or administrative province. |
| `country` | string | Required | ISO country name | N/A | Non-unique | None | Non-empty | Operational headquarters country. |
| `territory` | string (enum) | Required | `North America`, `EMEA`, `APAC`, `LATAM` | N/A | Non-unique | None | Valid territory enum | Sales operational territory. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Record creation audit timestamp. |
| `updatedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `updatedAt >= createdAt` | Last profile modification timestamp. |

---

## 3. Entity 2: Contact (`contacts`)
Represents individual decision-makers and business professionals associated with an account.

- **Primary Key:** `id` (Format: `CON-000001` through `CON-010000`)
- **Foreign Key:** `companyId` &rarr; `companies.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^CON-\d{6}$` | N/A | Unique | PK | Immutable regex format `CON-000001` | Unique contact identifier. |
| `companyId` | string | Required | `^CO-\d{6}$` | N/A | Non-unique | FK | Must exist in `companies.id` | Foreign key reference to parent company. |
| `firstName` | string | Required | 1–50 characters | N/A | Non-unique | None | Trimmed non-empty string | Given name of individual. |
| `lastName` | string | Required | 1–50 characters | N/A | Non-unique | None | Trimmed non-empty string | Family surname of individual. |
| `email` | string | Required | Standard RFC 5322 email | N/A | Unique | None | Valid email address | Professional contact email address. |
| `normalizedEmail`| string | Required | Lowercase trimmed email | N/A | Unique | None | `email.toLowerCase().trim()` | Canonical email used for deduplication. |
| `phone` | string | Optional | E.164 phone format | N/A | Non-unique | None | Valid dialable phone format | Direct business telephone line. |
| `jobTitle` | string | Required | 2–80 characters | N/A | Non-unique | None | Non-empty string | Corporate designation or job title. |
| `roleLevel` | string (enum) | Required | `C-Level`, `VP`, `Director`, `Manager`, `Individual Contributor` | N/A | Non-unique | None | In predefined set | Seniority tier used for Fit scoring. |
| `department` | string | Required | Standard department names | N/A | Non-unique | None | Non-empty string | Functional business unit. |
| `country` | string | Required | ISO country name | N/A | Non-unique | None | Non-empty string | Physical residence country. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Record creation audit timestamp. |
| `updatedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `updatedAt >= createdAt` | Last update audit timestamp. |

---

## 4. Entity 3: Lead (`leads`)
Represents an inbound or prospect interest instance progressing through the revenue qualification funnel.

- **Primary Key:** `id` (Format: `LEAD-2026-000001` through `LEAD-2026-020000`)
- **Foreign Keys:**
  - `companyId` &rarr; `companies.id`
  - `contactId` &rarr; `contacts.id`
  - `campaignId` &rarr; `campaigns.id`
  - `assignedSalesRepId` &rarr; `salesReps.id` (Optional / Nullable)

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^LEAD-2026-\d{6}$` | N/A | Unique | PK | Immutable regex format `LEAD-2026-000001` | Unique lead record identifier. |
| `companyId` | string | Required | `^CO-\d{6}$` | N/A | Non-unique | FK | Must exist in `companies.id` | Reference to target company. |
| `contactId` | string | Required | `^CON-\d{6}$` | N/A | Non-unique | FK | Must exist in `contacts.id` | Reference to individual contact. |
| `campaignId` | string | Required | `^CMP-\d{6}$` | N/A | Non-unique | FK | Must exist in `campaigns.id` | Inbound marketing acquisition campaign. |
| `assignedSalesRepId` | string | Optional | `^REP-\d{3,6}$` or null | N/A | Non-unique | FK | Valid rep ID or null | Current assigned sales executive. |
| `leadSource` | string | Required | `Direct Demo`, `Organic Search`, `Paid Search`, `Content Syndication`, `Webinar`, `Referral`, `Partner` | N/A | Non-unique | None | In predefined set | Demand generation source. |
| `productInterest`| string (enum) | Required | `Enterprise Cloud`, `Security & Compliance`, `Data & AI`, `Core CRM` | N/A | Non-unique | None | In predefined set | Primary software product interest. |
| `territory` | string (enum) | Required | `North America`, `EMEA`, `APAC`, `LATAM` | N/A | Non-unique | None | Inherited from company | Regional sales jurisdiction. |
| `status` | string (enum) | Required | `NEW`, `ASSIGNED`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `UNQUALIFIED`, `DISQUALIFIED` | N/A | Non-unique | None | Valid lifecycle state | Current pipeline lifecycle stage. |
| `fitScore` | number | Required | 0 – 30 | Points | Non-unique | None | `0 <= fitScore <= 30` | Demographic and account fit score. |
| `intentScore` | number | Required | 0 – 40 | Points | Non-unique | None | `0 <= intentScore <= 40` | Behavioral high-intent touchpoint score. |
| `engagementScore`| number | Required | 0 – 30 | Points | Non-unique | None | `0 <= engagementScore <= 30`| Interaction frequency and recency score. |
| `totalScore` | number | Required | 0 – 100 | Points | Non-unique | None | `totalScore = fit + intent + eng` | Calibrated overall 100-point score. |
| `scoreCategory` | string (enum) | Required | `HOT` (&ge;80), `WARM` (50–79), `COLD` (<50) | N/A | Non-unique | None | Threshold mapping | Priority category for SLA and routing. |
| `scoringTimestamp`| string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Last score calculation timestamp. |
| `isDuplicate` | boolean | Required | `true`, `false` | N/A | Non-unique | None | Boolean flag | Indicates duplicate lead entity. |
| `duplicateGroupId` | string | Optional | `DUP-\d{6}` or null | N/A | Non-unique | None | If isDuplicate true, must be populated | Cluster grouping for duplicate records. |
| `conversionStatus`| string (enum) | Required | `CONVERTED`, `UNCONVERTED` | N/A | Non-unique | None | Linked to status | Deal conversion status flag. |
| `convertedAt` | string (ISO) | Optional | ISO 8601 UTC or null | N/A | Non-unique | None | `convertedAt >= createdAt` | Timestamp when lead became opportunity. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Lead ingestion timestamp. |
| `updatedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `updatedAt >= createdAt` | Last modification timestamp. |

---

## 5. Entity 4: Campaign (`campaigns`)
Represents marketing demand-generation initiatives generating lead volume.

- **Primary Key:** `id` (Format: `CMP-000001` through `CMP-000020`)
- **Collection / Table:** `campaigns`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^CMP-\d{6}$` | N/A | Unique | PK | Immutable regex format `CMP-000001` | Unique campaign record identifier. |
| `name` | string | Required | 3–100 characters | N/A | Non-unique | None | Non-empty | Marketing campaign initiative title. |
| `type` | string (enum) | Required | `PAID_SEARCH`, `CONTENT`, `WEBINAR`, `EMAIL`, `EVENT`, `PARTNER` | N/A | Non-unique | None | In predefined set | Marketing delivery medium. |
| `budget` | number | Required | Number &ge; 0 | USD ($) | Non-unique | None | Non-negative numeric | Allocated marketing spend. |
| `spent` | number | Required | Number &ge; 0 | USD ($) | Non-unique | None | `spent <= budget * 1.5` | Actual spend to date. |
| `status` | string (enum) | Required | `PLANNING`, `ACTIVE`, `PAUSED`, `COMPLETED` | N/A | Non-unique | None | In predefined set | Operational campaign status. |
| `startDate` | string (ISO) | Required | ISO 8601 UTC date | N/A | Non-unique | None | Valid date | Official launch date. |
| `endDate` | string (ISO) | Required | ISO 8601 UTC date | N/A | Non-unique | None | `endDate >= startDate` | Planned or actual completion date. |
| `targetTerritory` | string (enum) | Required | `North America`, `EMEA`, `APAC`, `LATAM`, `Global` | N/A | Non-unique | None | Valid territory | Target geographical territory. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Record creation timestamp. |

---

## 6. Entity 5: Activity (`activities`)
Represents discrete interaction touchpoints performed by a lead or sales rep.

- **Primary Key:** `id` (Format: `ACT-LEAD-2026-XXXXXX-XXX`)
- **Foreign Key:** `leadId` &rarr; `leads.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^ACT-LEAD-2026-\d{6}-\d{3}$` | N/A | Unique | PK | Composite sequence format | Unique activity touchpoint ID. |
| `leadId` | string | Required | `^LEAD-2026-\d{6}$` | N/A | Non-unique | FK | Must exist in `leads.id` | Target lead reference. |
| `type` | string (enum) | Required | `PRICING_PAGE_VIEW`, `DEMO_REQUEST`, `PRODUCT_INQUIRY`, `PURCHASE_INTENT_FORM`, `EMAIL_OPEN`, `EMAIL_CLICK`, `WEBSITE_VISIT`, `EVENT_ATTENDANCE`, `PHONE_CALL`, `SALES_NOTE` | N/A | Non-unique | None | In predefined set | Interaction taxonomy category. |
| `points` | number | Required | 0 – 20 | Points | Non-unique | None | Scoring weight | Points awarded toward Intent or Engagement. |
| `isPostConversion`| boolean | Required | `true`, `false` | N/A | Non-unique | None | Temporal check | Flag indicating activity occurred after conversion. |
| `metadata` | object | Optional | Key-value pairs | N/A | Non-unique | None | Valid JSON | Detailed payload (e.g., URL, duration, call notes). |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `createdAt <= lead.lastActivityAt` | Touchpoint occurrence timestamp. |

---

## 7. Entity 6: Consent (`consents`)
Represents immutable regulatory consent decisions under GDPR Article 7 and TCPA.

- **Primary Key:** `id` (Format: `CS-LEAD-2026-XXXXXX-XXX` or `CS-000001`)
- **Foreign Key:** `leadId` &rarr; `leads.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^CS-LEAD-2026-\d{6}-\d{3}$` | N/A | Unique | PK | Immutable format | Unique consent audit record ID. |
| `leadId` | string | Required | `^LEAD-2026-\d{6}$` | N/A | Non-unique | FK | Must exist in `leads.id` | Associated lead reference. |
| `channel` | string | Required | `EMAIL`, `PHONE`, `SMS`, `MARKETING` | N/A | Non-unique | None | In predefined set | Regulated communication channel. |
| `status` | string (enum) | Required | `OPTED_IN`, `OPTED_OUT`, `PENDING`, `WITHDRAWN` | N/A | Non-unique | None | In predefined set | Legally enforceable consent decision. |
| `ipAddress` | string | Optional | Valid IPv4 / IPv6 address | N/A | Non-unique | None | IP format regex | Evidence of opt-in / opt-out source IP. |
| `timestamp` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Exact moment consent was recorded. |

---

## 8. Entity 7: ScoreRule (`score_rules`)
Represents configurable scoring logic coefficients applied to compute 100-point total scores.

- **Primary Key:** `id` (Format: `RULE-001` through `RULE-020`)
- **Collection / Table:** `score_rules`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^RULE-\d{3,6}$` | N/A | Unique | PK | Immutable format | Unique scoring rule identifier. |
| `name` | string | Required | 3–80 characters | N/A | Non-unique | None | Non-empty string | Human-readable rule title. |
| `category` | string (enum) | Required | `FIT`, `INTENT`, `ENGAGEMENT` | N/A | Non-unique | None | In predefined set | Primary scoring dimension. |
| `criteria` | string | Required | Logical criteria expression | N/A | Non-unique | None | Non-empty string | Condition evaluated against lead or company. |
| `points` | number | Required | 1 – 20 | Points | Non-unique | None | `1 <= points <= 20` | Additive points awarded upon satisfaction. |
| `isActive` | boolean | Required | `true`, `false` | N/A | Non-unique | None | Boolean flag | Whether rule is applied in real-time calculations. |

---

## 9. Entity 8: SalesRep (`sales_reps`)
Represents internal account executives and sales representatives in territory coverage.

- **Primary Key:** `id` (Format: `REP-001` through `REP-020`)
- **Collection / Table:** `sales_reps`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^REP-\d{3,6}$` | N/A | Unique | PK | Immutable format | Unique representative ID. |
| `name` | string | Required | 2–80 characters | N/A | Non-unique | None | Non-empty string | Full legal name of account executive. |
| `email` | string | Required | Standard RFC 5322 email | N/A | Unique | None | Corporate domain email | Representative corporate email address. |
| `territory` | string (enum) | Required | `North America`, `EMEA`, `APAC`, `LATAM` | N/A | Non-unique | None | In predefined set | Operational territory jurisdiction. |
| `productSpecialization`| string (enum) | Required | `Enterprise Cloud`, `Security & Compliance`, `Data & AI`, `Core CRM`, `All Products` | N/A | Non-unique | None | In predefined set | Primary commercial product expertise. |
| `currentLeadCount`| number | Required | Integers &ge; 0 | Leads | Non-unique | None | `currentLeadCount <= maxCapacity` | Active assigned open leads. |
| `maxCapacity` | number | Required | Integers &ge; 1 | Leads | Non-unique | None | `maxCapacity >= 10` | Hard threshold for round-robin assignment. |
| `isActive` | boolean | Required | `true`, `false` | N/A | Non-unique | None | Boolean flag | Availability status for new lead routing. |

---

## 10. Entity 9: Task (`tasks`)
Represents automated and manual follow-up SLA action items assigned to sales reps.

- **Primary Key:** `id` (Format: `TASK-LEAD-2026-XXXXXX-XXX`)
- **Foreign Keys:**
  - `leadId` &rarr; `leads.id`
  - `assignedSalesRepId` &rarr; `salesReps.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^TASK-LEAD-2026-\d{6}-\d{3}$` | N/A | Unique | PK | Immutable sequence format | Unique task record identifier. |
| `leadId` | string | Required | `^LEAD-2026-\d{6}$` | N/A | Non-unique | FK | Must exist in `leads.id` | Target lead reference. |
| `assignedSalesRepId`| string | Required | `^REP-\d{3,6}$` | N/A | Non-unique | FK | Must exist in `salesReps.id`| Sales rep assigned to complete action. |
| `title` | string | Required | 5–120 characters | N/A | Non-unique | None | Non-empty string | Concise operational task headline. |
| `priority` | string (enum) | Required | `URGENT_1_DAY`, `HIGH_3_DAY`, `NORMAL_NURTURE` | N/A | Non-unique | None | Mapped to scoreCategory | SLA urgency tier. |
| `dueBusinessDays` | number | Required | 1, 3, or 7 | Days | Non-unique | None | Linked to priority | Maximum business days before SLA breach. |
| `dueDate` | string (ISO) | Required | ISO 8601 UTC date | N/A | Non-unique | None | `dueDate >= createdAt` | Calculated calendar deadline. |
| `status` | string (enum) | Required | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED` | N/A | Non-unique | None | Valid lifecycle state | Current execution status. |
| `idempotencyKey`| string | Required | String identifier | N/A | Unique per lead/priority | None | Prevents duplicates | Hash ensuring duplicate tasks are not spawned. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Task generation timestamp. |
| `updatedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `updatedAt >= createdAt` | Last update timestamp. |

---

## 11. Entity 10: Opportunity (`opportunities`)
Represents an active commercial revenue deal in the sales qualification pipeline.

- **Primary Key:** `id` (Format: `OPP-2026-000001` through `OPP-2026-003000`)
- **Foreign Keys:**
  - `leadId` &rarr; `leads.id` (1:0..1 cardinality; max 1 active per lead)
  - `companyId` &rarr; `companies.id`
  - `contactId` &rarr; `contacts.id`
  - `assignedSalesRepId` &rarr; `salesReps.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^OPP-2026-\d{6}$` | N/A | Unique | PK | Immutable regex format `OPP-2026-000001` | Unique commercial deal identifier. |
| `leadId` | string | Required | `^LEAD-2026-\d{6}$` | N/A | Unique (except anomaly 4) | FK | Must exist in `leads.id` | Converted originating lead record. |
| `companyId` | string | Required | `^CO-\d{6}$` | N/A | Non-unique | FK | Must exist in `companies.id` | Target purchasing account. |
| `contactId` | string | Required | `^CON-\d{6}$` | N/A | Non-unique | FK | Must exist in `contacts.id` | Key executive decision maker. |
| `assignedSalesRepId`| string | Required | `^REP-\d{3,6}$` | N/A | Non-unique | FK | Must exist in `salesReps.id`| Deal owner account executive. |
| `name` | string | Required | 5–120 characters | N/A | Non-unique | None | Non-empty string | Commercial deal naming title. |
| `dealValue` | number | Required | Number &ge; 1,000 | USD ($) | Non-unique | None | `dealValue >= 1000` | Estimated contract value. |
| `stage` | string (enum) | Required | `NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` | N/A | Non-unique | None | Valid pipeline stage | Current sales qualification milestone. |
| `wonReason` | string | Optional | Required if stage is `WON` | N/A | Non-unique | None | Non-empty if `WON` | Primary commercial reason deal was closed. |
| `lostReason` | string | Optional | Required if stage is `LOST` | N/A | Non-unique | None | Non-empty if `LOST` | Primary objection or cause for loss. |
| `probability` | number | Required | 0.0 – 1.0 | Percentage | Non-unique | None | `0.0 <= probability <= 1.0` | Statistical close probability. |
| `expectedCloseDate`| string (ISO) | Required | ISO 8601 UTC date | N/A | Non-unique | None | `expectedCloseDate >= createdAt` | Projected contract signature date. |
| `createdAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Deal creation timestamp. |
| `updatedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | `updatedAt >= createdAt` | Last stage modification timestamp. |

---

## 12. Entity 11: StageHistory (`stage_history`)
Represents an immutable, append-only log of pipeline stage transitions.

- **Primary Key:** `id` (Format: `STG-OPP-2026-XXXXXX-XXX`)
- **Foreign Key:** `opportunityId` &rarr; `opportunities.id`

| Field Name | Type | Required / Optional | Allowed Values / Pattern | Units | Uniqueness | Key Status | Validation Rule | Description |
|---|---|---|---|---|---|---|---|---|
| `id` | string | Required | `^STG-OPP-2026-\d{6}-\d{3}$` | N/A | Unique | PK | Immutable composite format | Unique transition event ID. |
| `opportunityId` | string | Required | `^OPP-2026-\d{6}$` | N/A | Non-unique | FK | Must exist in `opportunities.id` | Target commercial opportunity. |
| `fromStage` | string (enum) | Required | `NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION` | N/A | Non-unique | None | Valid opportunity stage | Previous pipeline stage. |
| `toStage` | string (enum) | Required | `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` | N/A | Non-unique | None | `toStage != fromStage` | New milestone stage entered. |
| `durationDays` | number | Required | Integers &ge; 0 | Days | Non-unique | None | `durationDays >= 0` | Dwell time elapsed in previous stage. |
| `changedBy` | string | Required | User or system identifier | N/A | Non-unique | None | Non-empty string | Authorizing user or automation engine. |
| `reason` | string | Optional | Documented justification | N/A | Non-unique | None | Free text string | Contextual notes or won/lost justification. |
| `changedAt` | string (ISO) | Required | ISO 8601 UTC timestamp | N/A | Non-unique | None | Valid datetime | Exact transition timestamp. |

---

## 13. Audit & Ground Truth Entities

### Anomaly (`anomalies`)
Tracks flagged data-quality or business compliance violations.
- `id`: `^ANOM-\d{6}$`
- `type`: `OPTED_OUT_LEAD_CONTACTED` | `POST_CONVERSION_ACTIVITY_USED_IN_SCORE` | `LEAD_ASSIGNED_OUTSIDE_TERRITORY` | `DUPLICATE_OPPORTUNITY_CREATED` | `STAGE_HISTORY_GAP`
- `severity`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- `entityId`: Reference to target Lead or Opportunity
- `detectedAt`: ISO timestamp
- `status`: `DETECTED` | `RESOLVED` | `ACKNOWLEDGED`

### GroundTruthRecord (`ground_truth`)
Physically isolated benchmark ground truth used for precision/recall evaluations and negative scenario auditing.
- `leadId`: Associated lead identifier
- `actualOutcome`: `CONVERTED` | `LOST`
- `isAnomaly`: Boolean indicator
- `anomalyType`: Specific anomaly category if injected
- `intendedScore`: Calibrated ground-truth score without temporal leakage
- `labeledAt`: Evaluation timestamp
