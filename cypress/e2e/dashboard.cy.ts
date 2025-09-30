describe('Dashboard', () => {
  beforeEach(() => {
    // Mock successful login
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      }));
    });
  });

  it('should display dashboard after login', () => {
    cy.visit('/dashboard');
    cy.contains('Olá, Test User!').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show navigation sidebar', () => {
    cy.visit('/dashboard');
    cy.contains('TalentFlow').should('be.visible');
    cy.contains('Meu Perfil').should('be.visible');
    cy.contains('PDI').should('be.visible');
    cy.contains('Competências').should('be.visible');
  });

  it('should display stats cards', () => {
    cy.visit('/dashboard');
    cy.contains('Progresso na Carreira').should('be.visible');
    cy.contains('PDIs Ativos').should('be.visible');
    cy.contains('Pontos Totais').should('be.visible');
    cy.contains('Conquistas').should('be.visible');
  });

  it('should navigate to different pages', () => {
    cy.visit('/dashboard');
    
    // Navigate to Profile
    cy.contains('Meu Perfil').click();
    cy.url().should('include', '/profile');
    
    // Navigate to PDI
    cy.contains('PDI').click();
    cy.url().should('include', '/pdi');
    
    // Navigate back to Dashboard
    cy.contains('Dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  it('should show quick actions', () => {
    cy.visit('/dashboard');
    cy.contains('Ações Rápidas').should('be.visible');
    cy.contains('Criar PDI').should('be.visible');
    cy.contains('Ver Equipe').should('be.visible');
    cy.contains('Iniciar Curso').should('be.visible');
  });
});