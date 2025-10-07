/**
 * Security Tests for FormAssignmentService
 * 
 * These tests verify that the critical security fix prevents admins
 * from accessing mental health data.
 */

import { FormAssignmentService } from '../formAssignment';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
};

// Mock the supabase import
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('FormAssignmentService Security Tests', () => {
  describe('getUserAssignments', () => {
    it('should prevent admins from accessing mental health assignments', async () => {
      const result = await FormAssignmentService.getUserAssignments(
        'admin-user-id',
        'admin',
        'mental_health'
      );

      expect(result.success).toBe(true);
      expect(result.assignments).toEqual([]);
      expect(result.error).toBe('Administradores não podem acessar dados de saúde mental');
    });

    it('should allow admins to access performance assignments only', async () => {
      const result = await FormAssignmentService.getUserAssignments(
        'admin-user-id',
        'admin',
        'performance'
      );

      expect(result.success).toBe(true);
      // Should not contain mental health data
      expect(result.assignments).toBeDefined();
    });

    it('should prevent managers from accessing mental health assignments', async () => {
      const result = await FormAssignmentService.getUserAssignments(
        'manager-user-id',
        'manager',
        'mental_health'
      );

      expect(result.success).toBe(true);
      expect(result.assignments).toEqual([]);
    });

    it('should allow HR to access mental health assignments', async () => {
      const result = await FormAssignmentService.getUserAssignments(
        'hr-user-id',
        'hr',
        'mental_health'
      );

      expect(result.success).toBe(true);
      expect(result.assignments).toBeDefined();
    });
  });

  describe('getAssignableUsers', () => {
    it('should prevent admins from getting users for mental health assignments', async () => {
      const result = await FormAssignmentService.getAssignableUsers(
        'admin-user-id',
        'admin',
        'mental_health'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Apenas usuários do RH podem atribuir formulários de saúde mental');
    });

    it('should allow admins to get users for performance assignments', async () => {
      const result = await FormAssignmentService.getAssignableUsers(
        'admin-user-id',
        'admin',
        'performance'
      );

      expect(result.success).toBe(true);
      expect(result.users).toBeDefined();
    });

    it('should prevent managers from getting users for mental health assignments', async () => {
      const result = await FormAssignmentService.getAssignableUsers(
        'manager-user-id',
        'manager',
        'mental_health'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Apenas usuários do RH podem atribuir formulários de saúde mental');
    });
  });

  describe('checkAssignmentPermission', () => {
    it('should deny admin permission for mental health assignments', async () => {
      const result = await FormAssignmentService.checkAssignmentPermission(
        'admin',
        'mental_health',
        ['user1', 'user2'],
        'admin-user-id'
      );

      expect(result.canAssign).toBe(false);
      expect(result.canViewResults).toBe(false);
      expect(result.reason).toBe('Apenas usuários do RH podem atribuir formulários de saúde mental');
    });

    it('should allow admin permission for performance assignments', async () => {
      const result = await FormAssignmentService.checkAssignmentPermission(
        'admin',
        'performance',
        ['user1', 'user2'],
        'admin-user-id'
      );

      expect(result.canAssign).toBe(true);
      expect(result.canViewResults).toBe(true);
    });

    it('should deny manager permission for mental health assignments', async () => {
      const result = await FormAssignmentService.checkAssignmentPermission(
        'manager',
        'mental_health',
        ['user1', 'user2'],
        'manager-user-id'
      );

      expect(result.canAssign).toBe(false);
      expect(result.canViewResults).toBe(false);
      expect(result.reason).toBe('Apenas usuários do RH podem atribuir formulários de saúde mental');
    });
  });

  describe('createAssignment', () => {
    it('should prevent non-HR users from creating mental health assignments', async () => {
      // Mock user profile as admin
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { role: 'admin' },
              error: null
            }))
          }))
        }))
      });

      const result = await FormAssignmentService.createAssignment(
        'form-id',
        'admin-user-id',
        ['user1', 'user2'],
        'multiple',
        'mental_health',
        '2024-12-31'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Apenas usuários do RH podem criar atribuições de saúde mental');
    });

    it('should allow HR users to create mental health assignments', async () => {
      // Mock user profile as HR
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { role: 'hr' },
              error: null
            }))
          }))
        }))
      });

      const result = await FormAssignmentService.createAssignment(
        'form-id',
        'hr-user-id',
        ['user1', 'user2'],
        'multiple',
        'mental_health',
        '2024-12-31'
      );

      expect(result.success).toBe(true);
    });
  });
});