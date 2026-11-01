# Security Specification: LEADPULSE AI CRM Security & Access Control

## 1. Data Invariants
1. **Primary Key Format Invariance**: All primary keys must adhere to strict alphanumeric and hyphens formats:
   - Company: `CO-000001` (`^CO-[0-9]{6}$`)
   - Contact: `CON-000001` (`^CON-[0-9]{6}$`)
   - Lead: `LEAD-2026-000001` (`^LEAD-2026-[0-9]{6}$`)
   - Activity: `ACT-LEAD-2026-000001-001` (`^ACT-LEAD-2026-[0-9]{6}-[0-9]{3}$`)
   - Opportunity: `OPP-2026-000001` (`^OPP-2026-[0-9]{6}$`)
   - Task: `TASK-LEAD-2026-000001-001` (`^TASK-LEAD-2026-[0-9]{6}-[0-9]{3}$`)
2. **Foreign Key Integrity**: A Lead cannot exist without a valid `companyId` and `contactId`. An Opportunity cannot exist without a valid `leadId`. An Activity cannot exist without a valid `leadId`.
3. **Score Boundaries**: Total Score is strictly non-negative and `<= 100`. Fit Score `<= 30`, Intent Score `<= 40`, Engagement Score `<= 30`.
4. **Consent Enforcement**: When consent status is `OPTED_OUT` or `WITHDRAWN`, no automated sales outreach or tasks may be scheduled for execution. Attempted contact triggers anomaly block.
5. **Single Active Opportunity**: A lead can generate at most one active opportunity.
6. **Ground Truth Isolation**: Ground truth records in `/groundTruth` are isolated and cannot be fed as model features.
7. **Immutable Primary IDs**: Once written, IDs, `createdAt`, and `originalOwnerId` cannot be updated or overwritten.
8. **Temporal Integrity**: State timestamps must be valid RFC3339 strings or Firestore server timestamps.

## 2. The Dirty Dozen Payloads (Security Attack Vectors)
1. **Payload 1 - Path Poisoning**: Attempting to write document ID `../../etc/passwd` or 50KB character string.
2. **Payload 2 - Score Overwrite**: Attempting to inject `totalScore: 9999` bypassing the 100 pt limit.
3. **Payload 3 - Shadow Admin Privilege Injection**: Injecting `"role": "SuperAdmin"` or `"isAdmin": true` in a sales rep update payload.
4. **Payload 4 - Orphaned Lead**: Writing a Lead document where `companyId: ""` or non-existent entity.
5. **Payload 5 - Post-Conversion Activity Score Tampering**: Scoring an activity recorded *after* an opportunity was already won/lost to artificially bump historical win metrics.
6. **Payload 6 - Consent Bypass**: Attempting to create an outreach task for a lead whose `consentStatus: "OPTED_OUT"`.
7. **Payload 7 - Territory Route Breach**: Assigning a sales rep residing in `APAC` to a `North America` enterprise lead.
8. **Payload 8 - Duplicate Active Opportunity**: Creating a second active Opportunity `OPP-2026-000002` targeting a Lead that already has `convertedOpportunityId: "OPP-2026-000001"`.
9. **Payload 9 - Terminal Opportunity Resurrection**: Changing an Opportunity stage from `WON` or `LOST` back to `NEW` without documented transition reason.
10. **Payload 10 - Stage History Skip**: Transitioning Opportunity directly from `NEW` to `WON` with missing qualification and proposal stage events.
11. **Payload 11 - Denial of Wallet String Injection**: Pushing a 2MB JSON object into `scoreBreakdown` or company description.
12. **Payload 12 - Unauthenticated Query Scraping**: Attempting to list all leads without an authenticated session.

## 3. Test Runner Invariant
All requests must be strictly checked against authenticated sessions, validated schema types, and proper role authorizations.
