/**
 * LEADPULSE AI - Opportunity & Stage History Management (Module 8)
 * Lifecycle: NEW -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> WON / LOST
 * - Strict StageHistory tracking on every progression
 * - Immutable transition logging with duration calculation
 * - Mandatory documented won/lost reasons
 * - Single active opportunity invariant per lead
 */

import { Opportunity, StageHistory, OpportunityStage, Lead } from '../types/crm';

export const STAGE_ORDER: OpportunityStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export interface StageTransitionPayload {
  toStage: OpportunityStage;
  transitionReason?: string;
  wonReason?: string;
  lostReason?: string;
  changedBy: string;
}

export function validateStageTransition(
  currentStage: OpportunityStage,
  toStage: OpportunityStage,
  payload: StageTransitionPayload
): { valid: boolean; error?: string } {
  if (currentStage === toStage) {
    return { valid: false, error: `Opportunity is already in stage '${currentStage}'.` };
  }

  // Terminal state check: WON and LOST are terminal
  if (currentStage === 'WON' || currentStage === 'LOST') {
    return {
      valid: false,
      error: `Opportunity in terminal stage '${currentStage}' cannot be updated without administrative override.`,
    };
  }

  // Mandatory reasons for WON/LOST
  if (toStage === 'WON' && (!payload.wonReason || payload.wonReason.trim().length < 5)) {
    return { valid: false, error: 'Documented wonReason is mandatory when closing an opportunity as WON.' };
  }

  if (toStage === 'LOST' && (!payload.lostReason || payload.lostReason.trim().length < 5)) {
    return { valid: false, error: 'Documented lostReason is mandatory when closing an opportunity as LOST.' };
  }

  return { valid: true };
}

export function createOpportunityRecord(
  lead: Lead,
  name: string,
  value: number,
  expectedCloseDays: number = 30,
  seqNumber: number
): { opportunity: Opportunity; initialStageHistory: StageHistory } {
  const oppId = `OPP-2026-${String(seqNumber).padStart(6, '0')}`;
  const now = new Date();
  const expClose = new Date(now.getTime() + expectedCloseDays * 24 * 60 * 60 * 1000);

  const opportunity: Opportunity = {
    id: oppId,
    leadId: lead.id,
    companyId: lead.companyId,
    contactId: lead.contactId,
    assignedRepId: lead.assignedRepId || 'REP-001',
    name,
    value,
    stage: 'NEW',
    expectedCloseDate: expClose.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const initialStageHistory: StageHistory = {
    id: `STG-${oppId}-001`,
    opportunityId: oppId,
    fromStage: 'START',
    toStage: 'NEW',
    durationDays: 0,
    transitionReason: `Opportunity created and qualified from Lead ${lead.id}`,
    changedBy: 'System / Automated Lead Conversion',
    timestamp: now.toISOString(),
  };

  return { opportunity, initialStageHistory };
}

export function transitionOpportunityStage(
  opportunity: Opportunity,
  stageHistories: StageHistory[],
  payload: StageTransitionPayload
): { updatedOpportunity: Opportunity; newStageHistory: StageHistory } {
  const validation = validateStageTransition(opportunity.stage, payload.toStage, payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const now = new Date();

  // Find last stage history to calculate duration in prior stage
  const oppHistories = stageHistories.filter(h => h.opportunityId === opportunity.id);
  oppHistories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  let durationDays = 1;
  if (oppHistories.length > 0) {
    const lastTimestamp = new Date(oppHistories[0].timestamp).getTime();
    durationDays = Math.max(0, Math.round((now.getTime() - lastTimestamp) / (24 * 60 * 60 * 1000)));
  }

  const seq = String(oppHistories.length + 1).padStart(3, '0');
  const stageHistoryId = `STG-${opportunity.id}-${seq}`;

  const newStageHistory: StageHistory = {
    id: stageHistoryId,
    opportunityId: opportunity.id,
    fromStage: opportunity.stage,
    toStage: payload.toStage,
    durationDays,
    transitionReason: payload.transitionReason || `Moved to ${payload.toStage}`,
    changedBy: payload.changedBy,
    timestamp: now.toISOString(),
  };

  const updatedOpportunity: Opportunity = {
    ...opportunity,
    stage: payload.toStage,
    updatedAt: now.toISOString(),
    ...(payload.toStage === 'WON'
      ? { actualCloseDate: now.toISOString(), wonReason: payload.wonReason }
      : {}),
    ...(payload.toStage === 'LOST'
      ? { actualCloseDate: now.toISOString(), lostReason: payload.lostReason }
      : {}),
  };

  return { updatedOpportunity, newStageHistory };
}
