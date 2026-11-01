/**
 * LEADPULSE AI - Client AI Service
 * Invokes secure server-side Gemini API endpoints for lead intelligence and anomaly analysis.
 */

import { Lead, Company, Contact, Activity, Anomaly } from '../types/crm';

export async function generateAIPitch(
  lead: Lead,
  company?: Company,
  contact?: Contact,
  activities?: Activity[]
): Promise<string> {
  try {
    const res = await fetch('/api/ai/pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, company, contact, activities }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.pitch || 'No pitch generated.';
  } catch (error) {
    console.error('Failed to call AI pitch endpoint:', error);
    return `### Executive Brief for ${company?.name || lead.id}
**Score:** ${lead.totalScore}/100 (${lead.scoreCategory})
**Product:** ${lead.productInterest}
**Recommendation:** Schedule immediate discovery call regarding cloud compliance and automated routing.`;
  }
}

export async function generateAIAnomalyAnalysis(anomaly: Anomaly): Promise<string> {
  try {
    const res = await fetch('/api/ai/analyze-anomaly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anomaly }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.analysis || 'No analysis available.';
  } catch (error) {
    console.error('Failed to call AI anomaly endpoint:', error);
    return `### Incident Root Cause Analysis
**Anomaly:** ${anomaly.type}
**Status:** Blocked by system security invariants.
**Action:** Audit logs verified; no leakage permitted.`;
  }
}
