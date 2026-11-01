/**
 * LEADPULSE AI - Task Automation (Module 7)
 * Automated SLA Task creation driven by Lead Score and Consent validation:
 * - HOT: 1 business day follow-up SLA
 * - WARM: 3 business days follow-up SLA
 * - COLD: Automated nurture workflow
 * - Respects consent: Blocks tasks for OPTED_OUT / WITHDRAWN leads
 * - Idempotency checks to prevent duplicate task generation
 */

import { Lead, Task, TaskPriority } from '../types/crm';
import { validateLeadConsent } from './consentService';

export function calculateBusinessDueDate(businessDays: number): string {
  const date = new Date();
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      // Not Saturday or Sunday
      added++;
    }
  }
  return date.toISOString();
}

export function generateAutomatedTask(
  lead: Lead,
  existingTasks: Task[]
): { task: Task | null; error?: string; blockedByConsent?: boolean } {
  // 1. Regulatory Consent Check
  const consent = validateLeadConsent(lead);
  if (!consent.canContact) {
    return {
      task: null,
      error: `Task creation suppressed: ${consent.reason}`,
      blockedByConsent: true,
    };
  }

  // 2. Score category SLA rules
  let priority: TaskPriority;
  let dueBusinessDays: number;
  let title: string;

  if (lead.scoreCategory === 'HOT') {
    priority = 'URGENT_1_DAY';
    dueBusinessDays = 1;
    title = `[SLA Urgent] High-Intent Hot Lead Contact: ${lead.id}`;
  } else if (lead.scoreCategory === 'WARM') {
    priority = 'HIGH_3_DAY';
    dueBusinessDays = 3;
    title = `[SLA Warm] Discovery & Fit Follow-Up: ${lead.id}`;
  } else {
    priority = 'NORMAL_NURTURE';
    dueBusinessDays = 14;
    title = `[Nurture] Marketing Content Sequence Enrollment: ${lead.id}`;
  }

  // 3. Idempotency Check: Don't recreate the same pending/in-progress task
  const idempotencyKey = `TASK-${lead.id}-${lead.scoreCategory}-${priority}`;
  const existingActive = existingTasks.find(
    t => t.idempotencyKey === idempotencyKey && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
  );

  if (existingActive) {
    return {
      task: null,
      error: `Active task already exists for this lead and category (${existingActive.id}).`,
    };
  }

  // Generate ID with exact format: TASK-LEAD-2026-000001-001
  const existingLeadTasks = existingTasks.filter(t => t.leadId === lead.id);
  const nextSeq = String(existingLeadTasks.length + 1).padStart(3, '0');
  const taskId = `TASK-${lead.id}-${nextSeq}`;

  const task: Task = {
    id: taskId,
    leadId: lead.id,
    assignedRepId: lead.assignedRepId,
    title,
    dueBusinessDays,
    dueDate: calculateBusinessDueDate(dueBusinessDays),
    priority,
    status: 'PENDING',
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { task };
}
