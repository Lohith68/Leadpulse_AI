/**
 * LEADPULSE AI - Deduplication Engine (Module 5)
 * Detects duplicates via normalized email, company name, contact name, phone, domain.
 * Non-destructive: maintains duplicate_group_id, issue_type, and resolution_status.
 * Prevents duplicate opportunity creation.
 */

import { Lead, Contact, Company, Opportunity } from '../types/crm';

export interface DuplicateMatch {
  leadId: string;
  matchedWithLeadId: string;
  matchType: 'EMAIL' | 'COMPANY_NAME' | 'PHONE' | 'DOMAIN';
  matchValue: string;
  confidence: number;
}

export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export function normalizeName(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function extractDomain(input: string): string {
  if (!input) return '';
  const clean = input.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
  return clean.split('/')[0];
}

/**
 * Scans a set of leads and returns potential duplicate clusters
 */
export function detectLeadDuplicates(
  leads: Lead[],
  contactsMap: Map<string, Contact>,
  companiesMap: Map<string, Company>
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const emailIndex = new Map<string, string>(); // normalizedEmail -> leadId
  const phoneIndex = new Map<string, string>(); // normalizedPhone -> leadId
  const domainIndex = new Map<string, string>(); // domain -> leadId

  for (const lead of leads) {
    const contact = contactsMap.get(lead.contactId);
    const company = companiesMap.get(lead.companyId);

    if (contact) {
      const normEmail = normalizeEmail(contact.email);
      if (normEmail) {
        if (emailIndex.has(normEmail)) {
          matches.push({
            leadId: lead.id,
            matchedWithLeadId: emailIndex.get(normEmail)!,
            matchType: 'EMAIL',
            matchValue: normEmail,
            confidence: 1.0,
          });
        } else {
          emailIndex.set(normEmail, lead.id);
        }
      }

      const normPhone = normalizePhone(contact.phone);
      if (normPhone && normPhone.length >= 7) {
        if (phoneIndex.has(normPhone)) {
          matches.push({
            leadId: lead.id,
            matchedWithLeadId: phoneIndex.get(normPhone)!,
            matchType: 'PHONE',
            matchValue: normPhone,
            confidence: 0.9,
          });
        } else {
          phoneIndex.set(normPhone, lead.id);
        }
      }
    }

    if (company && company.domain) {
      const domain = extractDomain(company.domain);
      if (domain && domain.length > 3) {
        if (domainIndex.has(domain)) {
          // Same domain + same lead contact name could be duplicate
          matches.push({
            leadId: lead.id,
            matchedWithLeadId: domainIndex.get(domain)!,
            matchType: 'DOMAIN',
            matchValue: domain,
            confidence: 0.75,
          });
        } else {
          domainIndex.set(domain, lead.id);
        }
      }
    }
  }

  return matches;
}

/**
 * Enforces rule: Prevent duplicate opportunity creation for the same lead.
 * A lead can generate at most ONE active opportunity.
 */
export function validateOpportunityCreation(
  lead: Lead,
  existingOpportunities: Opportunity[]
): { allowed: boolean; reason?: string; existingOppId?: string } {
  const activeOpp = existingOpportunities.find(
    opp => opp.leadId === lead.id && opp.stage !== 'WON' && opp.stage !== 'LOST'
  );

  if (activeOpp) {
    return {
      allowed: false,
      reason: `Lead ${lead.id} already has an active Opportunity (${activeOpp.id}) in stage '${activeOpp.stage}'. Creating a duplicate active opportunity is blocked.`,
      existingOppId: activeOpp.id,
    };
  }

  if (lead.convertedOpportunityId) {
    const opp = existingOpportunities.find(o => o.id === lead.convertedOpportunityId);
    if (opp && opp.stage !== 'LOST') {
      return {
        allowed: false,
        reason: `Lead is already marked as converted to opportunity ${lead.convertedOpportunityId}.`,
        existingOppId: lead.convertedOpportunityId,
      };
    }
  }

  return { allowed: true };
}
