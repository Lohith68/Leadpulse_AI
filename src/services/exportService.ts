/**
 * LEADPULSE AI - Data Management & Export Engine (Module 13)
 * Full export capabilities:
 * - CSV export for all 11 entities + ground_truth.csv
 * - JSON dump
 * - PostgreSQL / Cloud SQL DDL & DML Schema export
 * - Synthetic Source Manifest documentation
 * - Data Dictionary specification
 */

import { GeneratedDataset, generateSyntheticDataset } from './syntheticDataGenerator';

export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(item =>
    headers
      .map(header => {
        let val = item[header];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportEntityAsCSV(entityName: string, records: any[]) {
  const csv = convertToCSV(records);
  downloadFile(csv, `leadpulse_${entityName.toLowerCase()}_export.csv`, 'text/csv');
}

export function exportGroundTruthCSV(groundTruthRecords: any[]) {
  const csv = convertToCSV(groundTruthRecords);
  downloadFile(csv, 'ground_truth.csv', 'text/csv');
}

export function exportFullJSON(dataset: any) {
  const json = JSON.stringify(dataset, null, 2);
  downloadFile(json, 'leadpulse_crm_full_export.json', 'application/json');
}

export function exportFull20kDatasetJSON(seed: number = 20261022) {
  const fullDataset = generateSyntheticDataset({ mode: 'FULL', seed });
  const json = JSON.stringify(fullDataset, null, 2);
  downloadFile(json, 'leadpulse_synthetic_full_20000_dataset.json', 'application/json');
}

export function generateSQLSchema(): string {
  return `-- =========================================================
-- LEADPULSE AI CRM - Relational PostgreSQL / Cloud SQL DDL
-- Generated for PostgreSQL 15+ / Cloud SQL
-- =========================================================

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(32) PRIMARY KEY, -- Format: CO-000001
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    employee_count INTEGER,
    annual_revenue NUMERIC(15,2),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50),
    territory VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(32) PRIMARY KEY, -- Format: CON-000001
    company_id VARCHAR(32) REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL,
    normalized_email VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    job_title VARCHAR(100),
    role_level VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(32) PRIMARY KEY, -- Format: CMP-000001
    name VARCHAR(120) NOT NULL,
    type VARCHAR(50) NOT NULL,
    budget NUMERIC(12,2),
    status VARCHAR(30) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    leads_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_reps (
    id VARCHAR(32) PRIMARY KEY, -- Format: REP-001
    name VARCHAR(80) NOT NULL,
    email VARCHAR(100) NOT NULL,
    territory VARCHAR(50) NOT NULL,
    specialization VARCHAR(50) NOT NULL,
    capacity_limit INTEGER NOT NULL,
    active_leads_count INTEGER DEFAULT 0,
    quota NUMERIC(12,2),
    pipeline_won NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS score_rules (
    id VARCHAR(32) PRIMARY KEY, -- Format: RULE-001
    category VARCHAR(30) NOT NULL,
    dimension VARCHAR(100) NOT NULL,
    max_points INTEGER NOT NULL,
    criteria TEXT,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(32) PRIMARY KEY, -- Format: LEAD-2026-000001
    company_id VARCHAR(32) REFERENCES companies(id),
    contact_id VARCHAR(32) REFERENCES contacts(id),
    campaign_id VARCHAR(32) REFERENCES campaigns(id),
    assigned_rep_id VARCHAR(32) REFERENCES sales_reps(id),
    product_interest VARCHAR(50) NOT NULL,
    territory VARCHAR(50) NOT NULL,
    fit_score INTEGER NOT NULL CHECK (fit_score BETWEEN 0 AND 30),
    intent_score INTEGER NOT NULL CHECK (intent_score BETWEEN 0 AND 40),
    engagement_score INTEGER NOT NULL CHECK (engagement_score BETWEEN 0 AND 30),
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    score_category VARCHAR(10) NOT NULL CHECK (score_category IN ('HOT', 'WARM', 'COLD')),
    score_breakdown JSONB,
    consent_status VARCHAR(20) NOT NULL CHECK (consent_status IN ('OPTED_IN', 'OPTED_OUT', 'PENDING', 'WITHDRAWN')),
    lifecycle_status VARCHAR(20) NOT NULL,
    duplicate_group_id VARCHAR(50),
    converted_opportunity_id VARCHAR(32),
    conversion_timestamp TIMESTAMP WITH TIME ZONE,
    routing_status VARCHAR(20) NOT NULL,
    routing_exception_reason TEXT,
    last_scored_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(48) PRIMARY KEY, -- Format: ACT-LEAD-2026-000001-001
    lead_id VARCHAR(32) REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    points_contributed INTEGER DEFAULT 0,
    is_post_conversion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(48) PRIMARY KEY, -- Format: CS-LEAD-2026-000001-001
    lead_id VARCHAR(32) REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_by VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(48) PRIMARY KEY, -- Format: TASK-LEAD-2026-000001-001
    lead_id VARCHAR(32) REFERENCES leads(id) ON DELETE CASCADE,
    assigned_rep_id VARCHAR(32) REFERENCES sales_reps(id),
    title VARCHAR(150) NOT NULL,
    due_business_days INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(32) PRIMARY KEY, -- Format: OPP-2026-000001
    lead_id VARCHAR(32) REFERENCES leads(id),
    company_id VARCHAR(32) REFERENCES companies(id),
    contact_id VARCHAR(32) REFERENCES contacts(id),
    assigned_rep_id VARCHAR(32) REFERENCES sales_reps(id),
    name VARCHAR(150) NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    expected_close_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    won_reason TEXT,
    lost_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stage_histories (
    id VARCHAR(48) PRIMARY KEY, -- Format: STG-OPP-2026-000001-001
    opportunity_id VARCHAR(32) REFERENCES opportunities(id) ON DELETE CASCADE,
    from_stage VARCHAR(30) NOT NULL,
    to_stage VARCHAR(30) NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 0,
    transition_reason TEXT,
    changed_by VARCHAR(80),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_leads_score_cat ON leads(score_category);
CREATE INDEX IF NOT EXISTS idx_leads_territory ON leads(territory);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_rep ON leads(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_status ON tasks(lead_id, status);
CREATE INDEX IF NOT EXISTS idx_opps_stage ON opportunities(stage);
`;
}

export const SYNTHETIC_SOURCE_MANIFEST = {
  platform: 'LEADPULSE AI',
  environment: 'Enterprise Production Grade Sandbox',
  datasetVersion: '2026.10.22-v1',
  fixedSeed: 20261022,
  legalNotice: 'ALL DATA CONTAINED IN THIS SYSTEM IS SYNTHETICALLY GENERATED USING DETERMINISTIC PSEUDO-RANDOM ALGORITHMS. NO REAL PERSONAL DATA, REAL CUSTOMER RECORDS, OR ACTUAL ENTERPRISE CONFIDENTIAL INFORMATION IS CONTAINED HEREIN. COMPLIES WITH GDPR RECITAL 26 FOR SYNTHETIC BENCHMARK DATA.',
  primaryEntitiesCount: 11,
  idFormatStandards: {
    Company: 'CO-000001',
    Contact: 'CON-000001',
    Lead: 'LEAD-2026-000001',
    Activity: 'ACT-LEAD-2026-000001-001',
    Opportunity: 'OPP-2026-000001',
    Task: 'TASK-LEAD-2026-000001-001',
  },
};
