/**
 * Tests for Sidebar role-based filtering
 * 
 * These tests verify that menu items are properly filtered based on user roles
 * and that parent items are visible when they contain accessible subitems.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth context
const mockAuthContext = {
  user: null,
  supabaseUser: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  refreshUser: jest.fn()
};

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const renderSidebar = (userRole: string) => {
  mockAuthContext.user = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    role: userRole as any,
    status: 'active',
    position: 'Test Position',
    level: 'Senior',
    points: 100,
    avatar_url: null,
    bio: null,
    team_id: null,
    manager_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
};

describe('Sidebar Role-based Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Manager Role', () => {
    it('should show Management menu for managers', () => {
      renderSidebar('manager');
      
      // Should see the parent "Gestão" menu
      expect(screen.getByText('Gestão')).toBeInTheDocument();
    });

    it('should show Manager Feedback submenu for managers', () => {
      renderSidebar('manager');
      
      // Should see the "Feedback do Gestor" submenu
      expect(screen.getByText('Feedback do Gestor')).toBeInTheDocument();
    });

    it('should not show HR-only submenus for managers', () => {
      renderSidebar('manager');
      
      // Should NOT see HR-only items
      expect(screen.queryByText('Gestão de Pessoas')).not.toBeInTheDocument();
      expect(screen.queryByText('Gestão de Times')).not.toBeInTheDocument();
      expect(screen.queryByText('Gestão de Trilhas')).not.toBeInTheDocument();
      expect(screen.queryByText('Gestão de Avaliações')).not.toBeInTheDocument();
    });

    it('should not show Portal do Psicólogo for managers', () => {
      renderSidebar('manager');
      
      // Should NOT see HR-only items
      expect(screen.queryByText('Portal do Psicólogo')).not.toBeInTheDocument();
    });
  });

  describe('Admin Role', () => {
    it('should show all Management submenus for admins', () => {
      renderSidebar('admin');
      
      // Should see all management items
      expect(screen.getByText('Gestão')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Pessoas')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Times')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Trilhas')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Avaliações')).toBeInTheDocument();
    });

    it('should not show Manager Feedback for admins', () => {
      renderSidebar('admin');
      
      // Should NOT see manager-specific items
      expect(screen.queryByText('Feedback do Gestor')).not.toBeInTheDocument();
    });
  });

  describe('HR Role', () => {
    it('should show all Management submenus for HR', () => {
      renderSidebar('hr');
      
      // Should see all management items
      expect(screen.getByText('Gestão')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Pessoas')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Times')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Trilhas')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Avaliações')).toBeInTheDocument();
    });

    it('should show Portal do Psicólogo for HR', () => {
      renderSidebar('hr');
      
      // Should see HR-specific items
      expect(screen.getByText('Portal do Psicólogo')).toBeInTheDocument();
    });

    it('should not show Manager Feedback for HR', () => {
      renderSidebar('hr');
      
      // Should NOT see manager-specific items
      expect(screen.queryByText('Feedback do Gestor')).not.toBeInTheDocument();
    });
  });

  describe('Employee Role', () => {
    it('should not show Management menu for employees', () => {
      renderSidebar('employee');
      
      // Should NOT see management items
      expect(screen.queryByText('Gestão')).not.toBeInTheDocument();
      expect(screen.queryByText('Feedback do Gestor')).not.toBeInTheDocument();
    });

    it('should not show Portal do Psicólogo for employees', () => {
      renderSidebar('employee');
      
      // Should NOT see HR-specific items
      expect(screen.queryByText('Portal do Psicólogo')).not.toBeInTheDocument();
    });
  });

  describe('Mental Health Access', () => {
    it('should show mental health menu for employees', () => {
      renderSidebar('employee');
      
      // Should see the mental health menu for employees
      expect(screen.getByText('Bem-estar')).toBeInTheDocument();
    });

    it('should show mental health menu for managers', () => {
      renderSidebar('manager');
      
      // Should see the mental health menu for managers
      expect(screen.getByText('Bem-estar')).toBeInTheDocument();
    });

    it('should show wellness admin menu for admins', () => {
      renderSidebar('admin');
      
      // Should see the wellness admin menu for admins
      expect(screen.getByText('Bem-estar')).toBeInTheDocument();
    });

    it('should not show wellness admin menu for HR', () => {
      renderSidebar('hr');
      
      // HR should see Portal do Psicólogo instead
      expect(screen.getByText('Portal do Psicólogo')).toBeInTheDocument();
      expect(screen.queryByText('Bem-estar')).not.toBeInTheDocument();
    });
  });
});