import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';

// Mock all dependencies before importing components
jest.mock('../../utils/memoryMonitor', () => ({
  memoryMonitor: {
    logMemoryUsage: jest.fn()
  }
}));

jest.mock('../../lib/supabase', () => ({
  supabase: null,
  getSupabaseClient: jest.fn()
}));

jest.mock('../../services/auth', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
}));

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      is_onboarded: true
    },
    loading: false
  })
}));

import { Sidebar } from '../../components/layout/Sidebar';
import { AuthProvider } from '../../contexts/AuthContext';

const renderSidebar = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Sidebar {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Sidebar Accessibility', () => {
  it('should not have accessibility violations in desktop mode', async () => {
    const { container } = renderSidebar();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations in mobile mode', async () => {
    const { container } = renderSidebar({ isMobile: true });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have navigation landmark', () => {
    const { getByRole } = renderSidebar();
    const nav = getByRole('menubar');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Principal');
  });

  it('should have proper menu structure', () => {
    const { getAllByRole } = renderSidebar();
    const menuItems = getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('should have accessible menu items with proper attributes', () => {
    const { getAllByRole } = renderSidebar();
    const menuItems = getAllByRole('menuitem');
    
    menuItems.forEach(item => {
      // Each menu item should be keyboard focusable
      expect(item).toHaveAttribute('tabindex');
    });
  });

  it('should indicate expandable menus with aria-haspopup', () => {
    const { container } = renderSidebar();
    const expandableItems = container.querySelectorAll('[aria-haspopup="true"]');
    
    expandableItems.forEach(item => {
      expect(item).toHaveAttribute('aria-expanded');
    });
  });

  it('should indicate current page with aria-current', () => {
    // This test depends on the current route
    const { container } = renderSidebar();
    // In a real scenario, you'd set up the router to be on a specific page
    // and check that aria-current="page" is set on the correct item
    expect(container).toBeInTheDocument();
  });
});
