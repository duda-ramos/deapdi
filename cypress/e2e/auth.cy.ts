describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.contains('TalentFlow').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Entrar');
  });

  it('should show validation errors for empty fields', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    
    // HTML5 validation should prevent submission
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('should toggle between login and signup modes', () => {
    cy.visit('/login');
    
    // Switch to signup
    cy.contains('Criar Conta').click();
    cy.contains('Criar Nova Conta').should('be.visible');
    cy.get('input[placeholder*="nome"]').should('be.visible');
    
    // Switch back to login
    cy.contains('Entrar').click();
    cy.get('button[type="submit"]').should('contain', 'Entrar');
  });

  it('should create a new user account', () => {
    cy.createTestUser();
  });

  it('should handle login with invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains('Email ou senha incorretos').should('be.visible');
  });
});