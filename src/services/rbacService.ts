/**
 * LEADPULSE AI - Role-Based Access Control (RBAC) Specification & Permission Matrix
 * Enforces strict enterprise access governance across all 5 roles.
 */

import { UserRole, PermissionAction, Resource } from '../types/crm';

export interface RoleDefinition {
  role: UserRole;
  title: string;
  description: string;
  badgeColor: string;
  permissions: {
    resource: Resource;
    actions: PermissionAction[];
  }[];
}

/**
 * Enterprise 5-Role Permission Matrix
 */
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  Admin: {
    role: 'Admin',
    title: 'System Administrator',
    description: 'Complete unrestricted access across all CRM modules, data generation, scoring rules, and user governance.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
    permissions: [
      { resource: 'dashboard', actions: ['view', 'export'] },
      { resource: 'leads', actions: ['view', 'create', 'edit', 'delete', 'assign', 'export'] },
      { resource: 'companies', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      { resource: 'contacts', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      { resource: 'campaigns', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      { resource: 'activities', actions: ['view', 'create', 'edit', 'delete', 'log_activity', 'export'] },
      { resource: 'scoring_rules', actions: ['view', 'create', 'edit', 'delete', 'manage_rules', 'export'] },
      { resource: 'sales_reps', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      { resource: 'tasks', actions: ['view', 'create', 'edit', 'delete', 'assign', 'export'] },
      { resource: 'opportunities', actions: ['view', 'create', 'edit', 'delete', 'advance_stage', 'export'] },
      { resource: 'stage_history', actions: ['view', 'export'] },
      { resource: 'anomalies', actions: ['view', 'edit', 'delete', 'export'] },
      { resource: 'consent', actions: ['view', 'create', 'edit', 'delete', 'record_consent', 'export'] },
      { resource: 'analytics', actions: ['view', 'export'] },
      { resource: 'data_management', actions: ['view', 'create', 'wipe', 'export'] },
      { resource: 'validation_center', actions: ['view', 'create', 'export'] },
      { resource: 'audit_logs', actions: ['view', 'export'] },
      { resource: 'user_management', actions: ['view', 'create', 'edit', 'delete', 'manage_users', 'export'] },
      { resource: 'settings', actions: ['view', 'edit', 'manage_settings'] },
    ],
  },
  'Sales Manager': {
    role: 'Sales Manager',
    title: 'Sales Operations Manager',
    description: 'Manages sales representatives, assigns leads, tracks opportunities, and oversees team quotas. Cannot alter scoring logic or system settings.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    permissions: [
      { resource: 'dashboard', actions: ['view', 'export'] },
      { resource: 'leads', actions: ['view', 'create', 'edit', 'assign', 'export'] },
      { resource: 'companies', actions: ['view', 'create', 'edit', 'export'] },
      { resource: 'contacts', actions: ['view', 'create', 'edit', 'export'] },
      { resource: 'campaigns', actions: ['view', 'export'] },
      { resource: 'activities', actions: ['view', 'log_activity', 'export'] },
      { resource: 'scoring_rules', actions: ['view'] },
      { resource: 'sales_reps', actions: ['view', 'edit', 'export'] },
      { resource: 'tasks', actions: ['view', 'create', 'edit', 'assign', 'export'] },
      { resource: 'opportunities', actions: ['view', 'create', 'edit', 'advance_stage', 'export'] },
      { resource: 'stage_history', actions: ['view', 'export'] },
      { resource: 'anomalies', actions: ['view', 'export'] },
      { resource: 'consent', actions: ['view', 'export'] },
      { resource: 'analytics', actions: ['view', 'export'] },
      { resource: 'data_management', actions: ['view', 'export'] }, // Can view counts & export, no wipe or mass generation
      { resource: 'validation_center', actions: ['view', 'export'] },
      { resource: 'audit_logs', actions: ['view', 'export'] },
    ],
  },
  'Sales Representative': {
    role: 'Sales Representative',
    title: 'Account Executive / Sales Rep',
    description: 'Works assigned leads and deals. Scoped access to own leads, follow-up SLA tasks, and logging prospect activities.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    permissions: [
      { resource: 'dashboard', actions: ['view'] },
      { resource: 'leads', actions: ['view', 'edit'] }, // Scoped to assigned leads
      { resource: 'companies', actions: ['view', 'edit'] },
      { resource: 'contacts', actions: ['view', 'edit'] },
      { resource: 'campaigns', actions: ['view'] },
      { resource: 'activities', actions: ['view', 'log_activity'] },
      { resource: 'sales_reps', actions: ['view'] }, // Directory
      { resource: 'tasks', actions: ['view', 'edit'] }, // Scoped to own tasks
      { resource: 'opportunities', actions: ['view', 'edit', 'advance_stage'] }, // Scoped to own deals
      { resource: 'stage_history', actions: ['view'] },
      { resource: 'consent', actions: ['view'] },
    ],
  },
  Marketing: {
    role: 'Marketing',
    title: 'Demand Generation Specialist',
    description: 'Owns marketing campaigns, prospect acquisition, activity touchpoints, and GDPR/CCPA regulatory consent tracking.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    permissions: [
      { resource: 'dashboard', actions: ['view', 'export'] },
      { resource: 'leads', actions: ['view', 'create', 'export'] },
      { resource: 'companies', actions: ['view', 'create', 'export'] },
      { resource: 'contacts', actions: ['view', 'create', 'edit', 'export'] },
      { resource: 'campaigns', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      { resource: 'activities', actions: ['view', 'create', 'log_activity', 'export'] },
      { resource: 'scoring_rules', actions: ['view'] },
      { resource: 'sales_reps', actions: ['view'] },
      { resource: 'opportunities', actions: ['view'] }, // Read-only view
      { resource: 'stage_history', actions: ['view'] },
      { resource: 'consent', actions: ['view', 'create', 'edit', 'record_consent', 'export'] },
      { resource: 'analytics', actions: ['view', 'export'] },
    ],
  },
  Analyst: {
    role: 'Analyst',
    title: 'Revenue & Data Analyst',
    description: 'Read-only access across all CRM models, anomaly intelligence, evaluations, and compliance logs with full CSV/JSON export capability.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    permissions: [
      { resource: 'dashboard', actions: ['view', 'export'] },
      { resource: 'leads', actions: ['view', 'export'] },
      { resource: 'companies', actions: ['view', 'export'] },
      { resource: 'contacts', actions: ['view', 'export'] },
      { resource: 'campaigns', actions: ['view', 'export'] },
      { resource: 'activities', actions: ['view', 'export'] },
      { resource: 'scoring_rules', actions: ['view', 'export'] },
      { resource: 'sales_reps', actions: ['view', 'export'] },
      { resource: 'tasks', actions: ['view', 'export'] },
      { resource: 'opportunities', actions: ['view', 'export'] },
      { resource: 'stage_history', actions: ['view', 'export'] },
      { resource: 'anomalies', actions: ['view', 'export'] },
      { resource: 'consent', actions: ['view', 'export'] },
      { resource: 'analytics', actions: ['view', 'export'] },
      { resource: 'validation_center', actions: ['view', 'export'] },
      { resource: 'audit_logs', actions: ['view', 'export'] },
    ],
  },
};

/**
 * Checks whether a given role has permission to perform an action on a resource
 */
export function hasPermission(
  role: UserRole,
  action: PermissionAction,
  resource: Resource
): boolean {
  const roleDef = ROLE_DEFINITIONS[role];
  if (!roleDef) return false;
  const resourcePerm = roleDef.permissions.find(p => p.resource === resource);
  if (!resourcePerm) return false;
  return resourcePerm.actions.includes(action);
}

/**
 * Determines which navigation routes are accessible to a given role
 */
export function getAuthorizedNavItems(role: UserRole): string[] {
  switch (role) {
    case 'Admin':
      return [
        'overview',
        'leads',
        'companies',
        'contacts',
        'campaigns',
        'activities',
        'scoring',
        'salesReps',
        'tasks',
        'opportunities',
        'stageHistory',
        'anomalies',
        'consent',
        'analytics',
        'dataManagement',
        'validation',
        'auditLogs',
        'userManagement',
        'settings',
      ];
    case 'Sales Manager':
      return [
        'overview',
        'leads',
        'companies',
        'contacts',
        'campaigns',
        'activities',
        'scoring',
        'salesReps',
        'tasks',
        'opportunities',
        'stageHistory',
        'anomalies',
        'consent',
        'analytics',
        'dataManagement',
        'validation',
        'auditLogs',
      ];
    case 'Sales Representative':
      return [
        'overview',
        'leads',
        'companies',
        'contacts',
        'campaigns',
        'activities',
        'salesReps',
        'tasks',
        'opportunities',
        'stageHistory',
        'consent',
      ];
    case 'Marketing':
      return [
        'overview',
        'leads',
        'companies',
        'contacts',
        'campaigns',
        'activities',
        'scoring',
        'salesReps',
        'opportunities',
        'stageHistory',
        'consent',
        'analytics',
      ];
    case 'Analyst':
      return [
        'overview',
        'leads',
        'companies',
        'contacts',
        'campaigns',
        'activities',
        'scoring',
        'salesReps',
        'tasks',
        'opportunities',
        'stageHistory',
        'anomalies',
        'consent',
        'analytics',
        'validation',
        'auditLogs',
      ];
    default:
      return ['overview'];
  }
}

/**
 * Maps a nav ID to its corresponding resource for RBAC checks
 */
export function navIdToResource(navId: string): Resource {
  const map: Record<string, Resource> = {
    overview: 'dashboard',
    leads: 'leads',
    companies: 'companies',
    contacts: 'contacts',
    campaigns: 'campaigns',
    activities: 'activities',
    scoring: 'scoring_rules',
    salesReps: 'sales_reps',
    tasks: 'tasks',
    opportunities: 'opportunities',
    stageHistory: 'stage_history',
    anomalies: 'anomalies',
    consent: 'consent',
    analytics: 'analytics',
    dataManagement: 'data_management',
    validation: 'validation_center',
    auditLogs: 'audit_logs',
    userManagement: 'user_management',
    settings: 'settings',
  };
  return map[navId] || 'dashboard';
}
