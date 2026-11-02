/**
 * LEADPULSE AI - RBAC & Security Test Suite
 * Validates the 5 user roles, permission matrix, route guards, and admin bootstrap invariants.
 */

import { describe, it, expect } from 'vitest';
import { hasPermission, getAuthorizedNavItems, ROLE_DEFINITIONS } from '../services/rbacService';
import { INITIAL_ADMIN_CONFIG, BENCHMARK_ACCOUNTS } from '../services/authService';
import { UserRole } from '../types/crm';

describe('LEADPULSE AI - Role-Based Access Control (RBAC)', () => {
  const allRoles: UserRole[] = [
    'Admin',
    'Sales Manager',
    'Sales Representative',
    'Marketing',
    'Analyst',
  ];

  it('verifies all 5 required roles are defined in the permission matrix', () => {
    allRoles.forEach(role => {
      expect(ROLE_DEFINITIONS[role]).toBeDefined();
      expect(ROLE_DEFINITIONS[role].role).toBe(role);
    });
  });

  describe('1. Admin Role Security Clearance', () => {
    it('grants full access to all resources and management actions', () => {
      expect(hasPermission('Admin', 'view', 'dashboard')).toBe(true);
      expect(hasPermission('Admin', 'create', 'leads')).toBe(true);
      expect(hasPermission('Admin', 'delete', 'leads')).toBe(true);
      expect(hasPermission('Admin', 'assign', 'leads')).toBe(true);
      expect(hasPermission('Admin', 'manage_rules', 'scoring_rules')).toBe(true);
      expect(hasPermission('Admin', 'manage_users', 'user_management')).toBe(true);
      expect(hasPermission('Admin', 'manage_settings', 'settings')).toBe(true);
      expect(hasPermission('Admin', 'wipe', 'data_management')).toBe(true);
    });

    it('authorizes all navigation routes for Admin including userManagement and settings', () => {
      const adminNavs = getAuthorizedNavItems('Admin');
      expect(adminNavs).toContain('overview');
      expect(adminNavs).toContain('leads');
      expect(adminNavs).toContain('scoring');
      expect(adminNavs).toContain('dataManagement');
      expect(adminNavs).toContain('userManagement');
      expect(adminNavs).toContain('settings');
      expect(adminNavs.length).toBe(19);
    });
  });

  describe('2. Sales Manager Role Clearance', () => {
    it('allows pipeline oversight, lead creation, and rep assignment', () => {
      expect(hasPermission('Sales Manager', 'view', 'leads')).toBe(true);
      expect(hasPermission('Sales Manager', 'create', 'leads')).toBe(true);
      expect(hasPermission('Sales Manager', 'assign', 'leads')).toBe(true);
      expect(hasPermission('Sales Manager', 'advance_stage', 'opportunities')).toBe(true);
      expect(hasPermission('Sales Manager', 'assign', 'tasks')).toBe(true);
    });

    it('strictly forbids modifying scoring rules, user management, and settings', () => {
      expect(hasPermission('Sales Manager', 'manage_rules', 'scoring_rules')).toBe(false);
      expect(hasPermission('Sales Manager', 'create', 'scoring_rules')).toBe(false);
      expect(hasPermission('Sales Manager', 'manage_users', 'user_management')).toBe(false);
      expect(hasPermission('Sales Manager', 'view', 'user_management')).toBe(false);
      expect(hasPermission('Sales Manager', 'manage_settings', 'settings')).toBe(false);
      expect(hasPermission('Sales Manager', 'wipe', 'data_management')).toBe(false);
    });

    it('excludes userManagement and settings from navigation', () => {
      const managerNavs = getAuthorizedNavItems('Sales Manager');
      expect(managerNavs).not.toContain('userManagement');
      expect(managerNavs).not.toContain('settings');
    });
  });

  describe('3. Sales Representative Role Scoped Clearance', () => {
    it('permits view and edit for assigned leads, tasks, and opportunities', () => {
      expect(hasPermission('Sales Representative', 'view', 'leads')).toBe(true);
      expect(hasPermission('Sales Representative', 'edit', 'leads')).toBe(true);
      expect(hasPermission('Sales Representative', 'edit', 'tasks')).toBe(true);
      expect(hasPermission('Sales Representative', 'advance_stage', 'opportunities')).toBe(true);
      expect(hasPermission('Sales Representative', 'log_activity', 'activities')).toBe(true);
    });

    it('blocks lead deletion and reassignment to other reps', () => {
      expect(hasPermission('Sales Representative', 'delete', 'leads')).toBe(false);
      expect(hasPermission('Sales Representative', 'assign', 'leads')).toBe(false);
      expect(hasPermission('Sales Representative', 'delete', 'companies')).toBe(false);
    });

    it('strictly denies access to scoring rules, user governance, data generation, and settings', () => {
      expect(hasPermission('Sales Representative', 'view', 'scoring_rules')).toBe(false);
      expect(hasPermission('Sales Representative', 'view', 'user_management')).toBe(false);
      expect(hasPermission('Sales Representative', 'view', 'data_management')).toBe(false);
      expect(hasPermission('Sales Representative', 'view', 'settings')).toBe(false);
    });
  });

  describe('4. Marketing Role Clearance', () => {
    it('allows full campaign management, activity touchpoints, and GDPR consent recording', () => {
      expect(hasPermission('Marketing', 'view', 'campaigns')).toBe(true);
      expect(hasPermission('Marketing', 'create', 'campaigns')).toBe(true);
      expect(hasPermission('Marketing', 'edit', 'campaigns')).toBe(true);
      expect(hasPermission('Marketing', 'delete', 'campaigns')).toBe(true);
      expect(hasPermission('Marketing', 'create', 'leads')).toBe(true);
      expect(hasPermission('Marketing', 'record_consent', 'consent')).toBe(true);
    });

    it('restricts sales opportunity deal pipeline to read-only', () => {
      expect(hasPermission('Marketing', 'view', 'opportunities')).toBe(true);
      expect(hasPermission('Marketing', 'edit', 'opportunities')).toBe(false);
      expect(hasPermission('Marketing', 'advance_stage', 'opportunities')).toBe(false);
      expect(hasPermission('Marketing', 'assign', 'leads')).toBe(false);
      expect(hasPermission('Marketing', 'manage_users', 'user_management')).toBe(false);
    });
  });

  describe('5. Analyst Role Clearance', () => {
    it('provides comprehensive read-only view and export across all datasets', () => {
      expect(hasPermission('Analyst', 'view', 'dashboard')).toBe(true);
      expect(hasPermission('Analyst', 'view', 'leads')).toBe(true);
      expect(hasPermission('Analyst', 'view', 'opportunities')).toBe(true);
      expect(hasPermission('Analyst', 'view', 'anomalies')).toBe(true);
      expect(hasPermission('Analyst', 'view', 'analytics')).toBe(true);
      expect(hasPermission('Analyst', 'export', 'leads')).toBe(true);
      expect(hasPermission('Analyst', 'export', 'opportunities')).toBe(true);
    });

    it('strictly forbids any create, edit, delete, or wipe operations', () => {
      expect(hasPermission('Analyst', 'create', 'leads')).toBe(false);
      expect(hasPermission('Analyst', 'edit', 'leads')).toBe(false);
      expect(hasPermission('Analyst', 'delete', 'leads')).toBe(false);
      expect(hasPermission('Analyst', 'create', 'opportunities')).toBe(false);
      expect(hasPermission('Analyst', 'advance_stage', 'opportunities')).toBe(false);
      expect(hasPermission('Analyst', 'wipe', 'data_management')).toBe(false);
      expect(hasPermission('Analyst', 'manage_users', 'user_management')).toBe(false);
    });
  });

  describe('6. Initial Admin Account Bootstrap Invariants', () => {
    it('verifies Lohith Gopisetti is designated as initial administrator with Active status', () => {
      expect(INITIAL_ADMIN_CONFIG.email).toBe('lohithgopisetti@gmail.com');
      expect(INITIAL_ADMIN_CONFIG.name).toBe('Lohith Gopisetti');
      expect(INITIAL_ADMIN_CONFIG.role).toBe('Admin');
      expect(INITIAL_ADMIN_CONFIG.status).toBe('active');
    });

    it('verifies all 4 benchmark demonstration accounts are configured for evaluation', () => {
      expect(BENCHMARK_ACCOUNTS.length).toBe(4);
      const rolesInBenchmark = BENCHMARK_ACCOUNTS.map(a => a.role);
      expect(rolesInBenchmark).toContain('Sales Manager');
      expect(rolesInBenchmark).toContain('Sales Representative');
      expect(rolesInBenchmark).toContain('Marketing');
      expect(rolesInBenchmark).toContain('Analyst');
    });
  });
});
