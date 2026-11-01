# LEADPULSE AI – Database Schema & Architecture

## 1. Multi-Target Storage Architecture
**LEADPULSE AI** is designed with a dual-target storage abstraction:
1. **Primary Operational Engine:** Firebase Cloud Firestore (NoSQL Document Store with document-level atomicity, compound indexing, and server-side aggregation).
2. **Relational / Analytical Target:** PostgreSQL / Cloud SQL (ACID relational engine with declarative foreign keys, check constraints, and B-Tree indexes).

---

## 2. Firebase Cloud Firestore Schema

### Collection Hierarchy & Document ID Conventions

| Collection Path | Document ID Pattern | Sharding / Partition Key | Compound Indexes |
|---|---|---|---|
| `companies/{id}` | `CO-000001` | Territory | `territory ASC, employeeCount DESC` |
| `contacts/{id}` | `CON-000001` | Company ID | `companyId ASC, roleLevel ASC` |
| `leads/{id}` | `LEAD-2026-000001` | Territory | `territory ASC, totalScore DESC`, `status ASC, createdAt DESC` |
| `campaigns/{id}` | `CMP-000001` | Status | `status ASC, startDate DESC` |
| `activities/{id}` | `ACT-LEAD-2026-XXXXXX-XXX` | Lead ID | `leadId ASC, createdAt DESC`, `type ASC, isPostConversion ASC` |
| `consents/{id}` | `CS-LEAD-2026-XXXXXX-XXX` | Lead ID | `leadId ASC, timestamp DESC`, `status ASC` |
| `score_rules/{id}` | `RULE-001` | Category | `category ASC, isActive ASC` |
| `sales_reps/{id}` | `REP-001` | Territory | `territory ASC, isActive ASC, currentLeadCount ASC` |
| `tasks/{id}` | `TASK-LEAD-2026-XXXXXX-XXX` | Assigned Rep ID | `assignedSalesRepId ASC, status ASC, dueDate ASC` |
| `opportunities/{id}` | `OPP-2026-000001` | Stage | `stage ASC, dealValue DESC`, `assignedSalesRepId ASC, stage ASC` |
| `stage_history/{id}` | `STG-OPP-2026-XXXXXX-XXX`| Opportunity ID | `opportunityId ASC, changedAt ASC` |
| `anomalies/{id}` | `ANOM-000001` | Status | `status ASC, severity ASC, detectedAt DESC` |
| `ground_truth/{id}` | `GT-LEAD-2026-000001` | Outcome | `actualOutcome ASC, isAnomaly ASC` |

### Firestore Security Rules Enforcement
Rules are enforced in `/firestore.rules`:
- Unauthenticated writes are rejected.
- Audit collections (`stage_history`, `consents`, `ground_truth`) are strictly append-only.
- Updates cannot alter primary key IDs or mutate historical timestamps.
- Rep assignments require active rep status.

---

## 3. PostgreSQL / Cloud SQL DDL Specification

```sql
-- ============================================================================
-- LEADPULSE AI - PostgreSQL 15+ Enterprise Relational Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE
CREATE TABLE companies (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(64) NOT NULL CHECK (industry IN ('Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 'Retail', 'Education', 'Telecommunications', 'Energy')),
    size VARCHAR(32) NOT NULL CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    employee_count INTEGER NOT NULL CHECK (employee_count >= 1),
    annual_revenue NUMERIC(15, 2) NOT NULL CHECK (annual_revenue >= 0),
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    country VARCHAR(80) NOT NULL,
    territory VARCHAR(32) NOT NULL CHECK (territory IN ('North America', 'EMEA', 'APAC', 'LATAM')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_territory_rev ON companies(territory, annual_revenue DESC);
CREATE INDEX idx_companies_domain ON companies(domain);

-- 2. CONTACTS TABLE
CREATE TABLE contacts (
    id VARCHAR(32) PRIMARY KEY,
    company_id VARCHAR(32) NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    normalized_email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(32),
    job_title VARCHAR(100) NOT NULL,
    role_level VARCHAR(32) NOT NULL CHECK (role_level IN ('C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor')),
    department VARCHAR(64) NOT NULL,
    country VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_company_role ON contacts(company_id, role_level);
CREATE INDEX idx_contacts_norm_email ON contacts(normalized_email);

-- 3. CAMPAIGNS TABLE
CREATE TABLE campaigns (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('PAID_SEARCH', 'CONTENT', 'WEBINAR', 'EMAIL', 'EVENT', 'PARTNER')),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (spent >= 0),
    status VARCHAR(32) NOT NULL CHECK (status IN ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    target_territory VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);

-- 4. SALES REPS TABLE
CREATE TABLE sales_reps (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    territory VARCHAR(32) NOT NULL CHECK (territory IN ('North America', 'EMEA', 'APAC', 'LATAM')),
    product_specialization VARCHAR(64) NOT NULL,
    current_lead_count INTEGER NOT NULL DEFAULT 0 CHECK (current_lead_count >= 0),
    max_capacity INTEGER NOT NULL DEFAULT 60 CHECK (max_capacity >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_sales_reps_terr_cap ON sales_reps(territory, is_active, current_lead_count);

-- 5. LEADS TABLE
CREATE TABLE leads (
    id VARCHAR(32) PRIMARY KEY,
    company_id VARCHAR(32) NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    contact_id VARCHAR(32) NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    campaign_id VARCHAR(32) NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    assigned_sales_rep_id VARCHAR(32) REFERENCES sales_reps(id) ON DELETE SET NULL,
    lead_source VARCHAR(64) NOT NULL,
    product_interest VARCHAR(64) NOT NULL CHECK (product_interest IN ('Enterprise Cloud', 'Security & Compliance', 'Data & AI', 'Core CRM')),
    territory VARCHAR(32) NOT NULL CHECK (territory IN ('North America', 'EMEA', 'APAC', 'LATAM')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED', 'DISQUALIFIED')),
    fit_score NUMERIC(5, 2) NOT NULL CHECK (fit_score BETWEEN 0 AND 30),
    intent_score NUMERIC(5, 2) NOT NULL CHECK (intent_score BETWEEN 0 AND 40),
    engagement_score NUMERIC(5, 2) NOT NULL CHECK (engagement_score BETWEEN 0 AND 30),
    total_score NUMERIC(5, 2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    score_category VARCHAR(16) NOT NULL CHECK (score_category IN ('HOT', 'WARM', 'COLD')),
    scoring_timestamp TIMESTAMPTZ NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_group_id VARCHAR(32),
    conversion_status VARCHAR(16) NOT NULL DEFAULT 'UNCONVERTED' CHECK (conversion_status IN ('CONVERTED', 'UNCONVERTED')),
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_score_cat ON leads(total_score DESC, score_category);
CREATE INDEX idx_leads_territory_status ON leads(territory, status);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);

-- 6. ACTIVITIES TABLE
CREATE TABLE activities (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(32) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    points NUMERIC(5, 2) NOT NULL DEFAULT 0,
    is_post_conversion BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_lead_created ON activities(lead_id, created_at DESC);
CREATE INDEX idx_activities_post_conv ON activities(is_post_conversion);

-- 7. CONSENTS TABLE
CREATE TABLE consents (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(32) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('EMAIL', 'PHONE', 'SMS', 'MARKETING')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('OPTED_IN', 'OPTED_OUT', 'PENDING', 'WITHDRAWN')),
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consents_lead_status ON consents(lead_id, status);

-- 8. TASKS TABLE
CREATE TABLE tasks (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(32) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_sales_rep_id VARCHAR(32) NOT NULL REFERENCES sales_reps(id) ON DELETE RESTRICT,
    title VARCHAR(140) NOT NULL,
    priority VARCHAR(32) NOT NULL CHECK (priority IN ('URGENT_1_DAY', 'HIGH_3_DAY', 'NORMAL_NURTURE')),
    due_business_days INTEGER NOT NULL CHECK (due_business_days IN (1, 3, 7)),
    due_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    idempotency_key VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_task_idempotency UNIQUE(lead_id, idempotency_key)
);

CREATE INDEX idx_tasks_rep_due ON tasks(assigned_sales_rep_id, status, due_date ASC);

-- 9. OPPORTUNITIES TABLE
CREATE TABLE opportunities (
    id VARCHAR(32) PRIMARY KEY,
    lead_id VARCHAR(32) NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    company_id VARCHAR(32) NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    contact_id VARCHAR(32) NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    assigned_sales_rep_id VARCHAR(32) NOT NULL REFERENCES sales_reps(id) ON DELETE RESTRICT,
    name VARCHAR(140) NOT NULL,
    deal_value NUMERIC(15, 2) NOT NULL CHECK (deal_value >= 1000),
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    won_reason VARCHAR(255),
    lost_reason VARCHAR(255),
    probability NUMERIC(3, 2) NOT NULL CHECK (probability BETWEEN 0.0 AND 1.0),
    expected_close_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opps_stage_value ON opportunities(stage, deal_value DESC);
CREATE INDEX idx_opps_rep_stage ON opportunities(assigned_sales_rep_id, stage);

-- 10. STAGE HISTORY TABLE
CREATE TABLE stage_history (
    id VARCHAR(64) PRIMARY KEY,
    opportunity_id VARCHAR(32) NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    from_stage VARCHAR(32) NOT NULL,
    to_stage VARCHAR(32) NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 0),
    changed_by VARCHAR(64) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stage_hist_opp_date ON stage_history(opportunity_id, changed_at ASC);

-- 11. SCORE RULES TABLE
CREATE TABLE score_rules (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('FIT', 'INTENT', 'ENGAGEMENT')),
    criteria TEXT NOT NULL,
    points NUMERIC(5, 2) NOT NULL CHECK (points BETWEEN 1 AND 20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

## 4. Batch Operations & Transaction Limits
When interacting with Firestore during seeding or updates:
- **Batch Ceiling:** Maximum 300 write operations per batch (well below Firestore's 500 hard limit to preserve transaction headroom).
- **Throttling:** 60ms inter-batch delay to prevent rate quota throttling on write streams.
- **Retry Policy:** Exponential backoff ($t = 2^k \times 100\text{ms}$) with a maximum of 3 retries per failed batch.
