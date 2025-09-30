describe('PDI Management', () => {
  beforeEach(() => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'employee'
        }
      }));
    });
  });

  it('should display PDI page', () => {
    cy.visit('/pdi');
    cy.contains('PDI - Plano de Desenvolvimento Individual').should('be.visible');
    cy.contains('Gerencie seus objetivos de desenvolvimento').should('be.visible');
  });

  it('should show create PDI button', () => {
    cy.visit('/pdi');
    cy.contains('Novo PDI').should('be.visible');
  });

  it('should open create PDI modal', () => {
    cy.visit('/pdi');
    cy.contains('Novo PDI').click();
    cy.contains('Criar Novo PDI').should('be.visible');
    cy.get('input[placeholder*="React"]').should('be.visible');
    cy.get('textarea[placeholder*="Descreva detalhadamente"]').should('be.visible');
  });

  it('should validate required fields in PDI form', () => {
    cy.visit('/pdi');
    cy.contains('Novo PDI').click();
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // Should show HTML5 validation
    cy.get('input:invalid').should('exist');
  });

  it('should fill and submit PDI form', () => {
    cy.visit('/pdi');
    cy.contains('Novo PDI').click();
    
    cy.get('input[placeholder*="React"]').type('Aprender TypeScript Avançado');
    cy.get('textarea[placeholder*="Descreva detalhadamente"]').type('Estudar conceitos avançados de TypeScript incluindo generics, decorators e utility types');
    cy.get('input[type="date"]').type('2024-06-30');
    
    cy.get('button[type="submit"]').click();
    
    // Modal should close (assuming successful submission)
    cy.contains('Criar Novo PDI').should('not.exist');
  });

  it('should display PDI stats', () => {
    cy.visit('/pdi');
    cy.contains('Total').should('be.visible');
    cy.contains('Pendentes').should('be.visible');
    cy.contains('Em Progresso').should('be.visible');
    cy.contains('Concluídos').should('be.visible');
  });

  it('should show empty state when no PDIs exist', () => {
    cy.visit('/pdi');
    // Assuming no PDIs exist for test user
    cy.contains('Nenhum PDI encontrado').should('be.visible');
    cy.contains('Criar Primeiro PDI').should('be.visible');
  });
});