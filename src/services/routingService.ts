/**
 * LEADPULSE AI - Territory & Product Routing (Module 6)
 * Deterministic lead routing based on:
 * - Geographic territory match
 * - Product interest specialization
 * - Sales rep status (AVAILABLE) and capacity limits
 * - If no representative is available: route to UNASSIGNED with routing exception reason
 * - Never assign a lead outside its authorized territory
 */

import { Lead, SalesRep, Anomaly } from '../types/crm';

export interface RoutingDecision {
  assignedRepId?: string;
  assignedRepName?: string;
  routingStatus: 'ASSIGNED' | 'UNASSIGNED' | 'EXCEPTION';
  reason: string;
  isViolation: boolean;
}

export function routeLeadToSalesRep(lead: Lead, salesReps: SalesRep[]): RoutingDecision {
  // Filter reps in the lead's exact territory
  const territoryReps = salesReps.filter(rep => rep.territory === lead.territory);

  if (territoryReps.length === 0) {
    return {
      routingStatus: 'EXCEPTION',
      reason: `No sales representatives registered for territory '${lead.territory}'.`,
      isViolation: false,
    };
  }

  // Filter reps by product specialization or generalist
  const qualifiedReps = territoryReps.filter(
    rep => rep.specialization === 'All Products' || rep.specialization === lead.productInterest
  );

  const candidatePool = qualifiedReps.length > 0 ? qualifiedReps : territoryReps;

  // Filter for available reps with capacity
  const availableReps = candidatePool.filter(
    rep => rep.status === 'AVAILABLE' && rep.activeLeadsCount < rep.capacityLimit
  );

  if (availableReps.length === 0) {
    return {
      routingStatus: 'UNASSIGNED',
      reason: `All ${candidatePool.length} representatives in territory '${lead.territory}' are at maximum capacity or currently unavailable.`,
      isViolation: false,
    };
  }

  // Pick representative with lowest current lead load (balanced round-robin load distribution)
  availableReps.sort((a, b) => a.activeLeadsCount - b.activeLeadsCount);
  const selectedRep = availableReps[0];

  return {
    assignedRepId: selectedRep.id,
    assignedRepName: selectedRep.name,
    routingStatus: 'ASSIGNED',
    reason: `Assigned to ${selectedRep.name} (${selectedRep.territory} • ${selectedRep.specialization}) with ${selectedRep.activeLeadsCount}/${selectedRep.capacityLimit} active leads.`,
    isViolation: false,
  };
}

/**
 * Validates manual or programmatic assignment to ensure territory boundary is not violated.
 */
export function validateTerritoryAssignment(lead: Lead, assignedRep: SalesRep): { valid: boolean; anomaly?: Anomaly } {
  if (lead.territory !== assignedRep.territory) {
    const anomaly: Anomaly = {
      id: `ANOM-ROUTING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'LEAD_ASSIGNED_OUTSIDE_TERRITORY',
      severity: 'HIGH',
      affectedEntity: 'Lead',
      affectedRecordId: lead.id,
      expectedDecision: `ASSIGN_WITHIN_${lead.territory.toUpperCase().replace(/\s+/g, '_')}`,
      actualDecision: `ASSIGNED_TO_${assignedRep.territory.toUpperCase().replace(/\s+/g, '_')}_REP_${assignedRep.id}`,
      isGroundTruth: false,
      status: 'DETECTED',
      details: `Routing violation detected: Lead ${lead.id} in ${lead.territory} was assigned to Sales Rep ${assignedRep.name} (${assignedRep.id}) in ${assignedRep.territory}.`,
      timestamp: new Date().toISOString(),
    };

    return { valid: false, anomaly };
  }

  return { valid: true };
}
