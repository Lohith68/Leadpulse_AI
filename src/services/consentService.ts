/**
 * LEADPULSE AI - Consent Management (Module 4)
 * Strict GDPR/CCPA enforcement:
 * Possible states: OPTED_IN, OPTED_OUT, PENDING, WITHDRAWN.
 * An opted-out lead must never receive automated marketing or sales outreach.
 * Logs consent changes as separate events and prevents unauthorized communications.
 */

import { Lead, Consent, ConsentStatus, Anomaly } from '../types/crm';

export interface ConsentCheckResult {
  canContact: boolean;
  reason: string;
  isViolationAttempt: boolean;
}

/**
 * Validates whether automated or direct sales outreach is legally permitted.
 */
export function validateLeadConsent(lead: Lead): ConsentCheckResult {
  if (lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN') {
    return {
      canContact: false,
      reason: `Communication blocked: Lead is in regulatory state '${lead.consentStatus}'. Outreach prohibited.`,
      isViolationAttempt: true,
    };
  }

  if (lead.consentStatus === 'PENDING') {
    return {
      canContact: false,
      reason: 'Communication on hold: Lead consent is PENDING confirmation (double opt-in required).',
      isViolationAttempt: false,
    };
  }

  return {
    canContact: true,
    reason: 'Consent verified: Lead is OPTED_IN.',
    isViolationAttempt: false,
  };
}

/**
 * Creates a structured consent audit log event
 */
export function createConsentEvent(
  leadId: string,
  newStatus: ConsentStatus,
  channel: 'EMAIL' | 'PHONE' | 'SMS' | 'ALL',
  source: 'WEB_FORM' | 'DOUBLE_OPT_IN' | 'PREFERENCE_CENTER' | 'MANUAL_REQUEST' | 'UNSUBSCRIBE_LINK',
  recordedBy: string,
  notes?: string
): Consent {
  const seq = Math.floor(Math.random() * 900 + 100);
  return {
    id: `CS-${leadId}-${seq}`,
    leadId,
    status: newStatus,
    channel,
    source,
    notes: notes || `Consent transitioned to ${newStatus} via ${source}`,
    timestamp: new Date().toISOString(),
    recordedBy,
  };
}

/**
 * Flags an attempted consent breach as an anomaly
 */
export function recordConsentViolationAnomaly(leadId: string, attemptedAction: string): Anomaly {
  return {
    id: `ANOM-CONSENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'OPTED_OUT_LEAD_CONTACTED',
    severity: 'CRITICAL',
    affectedEntity: 'Lead',
    affectedRecordId: leadId,
    expectedDecision: 'BLOCK_COMMUNICATION',
    actualDecision: `ATTEMPTED_${attemptedAction.toUpperCase().replace(/\s+/g, '_')}`,
    isGroundTruth: false,
    status: 'BLOCKED',
    details: `Prevented contact attempt (${attemptedAction}) targeting opted-out/withdrawn lead ${leadId}. Communication gateway blocked the operation.`,
    timestamp: new Date().toISOString(),
  };
}
