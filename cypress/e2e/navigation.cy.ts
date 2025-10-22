describe('Navigation', () => {
  beforeEach(() => {
    // Mock authenticated user with admin role
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      }));
    });
  });

  it('should navigate to all main pages', () => {
    const pages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Meu Perfil', url: '/profile' },
      { name: 'Trilha de Carreira', url: '/career' },
      { name: 'Competências', url: '/competencies' },
      { name: 'PDI', url: '/pdi' },
      { name: 'Grupos de Ação', url: '/groups' },
      { name: 'Mentoria', url: '/mentorship' },
      { name: 'Gerenciar Usuários', url: '/users' },
      { name: 'Área de RH', url: '/hr' },
      { name: 'Administração', url: '/admin' }
    ];

    cy.visit('/dashboard');

    pages.forEach(page => {
      cy.contains(page.name).click();
      cy.url().should('include', page.url);
      cy.go('back');
    });
  });

  it('should show active state for current page', () => {
    cy.visit('/dashboard');
    cy.contains('Dashboard').parent().should('have.class', 'bg-blue-50');
    
    cy.contains('PDI').click();
    cy.contains('PDI').parent().should('have.class', 'bg-blue-50');
  });

  it('should redirect to dashboard from root', () => {
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  it('should protect routes for unauthenticated users', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should show logout functionality', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="logout-button"]').should('be.visible');
  });
});