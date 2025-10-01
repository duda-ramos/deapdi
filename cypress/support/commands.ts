/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTestUser(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      setTestUser(role?: 'employee' | 'hr', overrides?: Record<string, any>): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('createTestUser', () => {
  cy.visit('/login');
  cy.contains('Criar Conta').click();
  
  cy.get('input[placeholder*="nome"]').type('Test User');
  cy.get('input[type="email"]').type(`test${Date.now()}@example.com`);
  cy.get('input[type="password"]').first().type('password123');
  cy.get('input[type="password"]').last().type('password123');
  cy.get('input[placeholder*="cargo"]').type('Desenvolvedor');
  
  cy.get('button[type="submit"]').click();
  cy.contains('Conta criada com sucesso').should('be.visible');
});

Cypress.Commands.add('cleanupTestData', () => {
  // This would typically clean up test data from the database
  // For now, we'll just clear local storage
  cy.clearLocalStorage();
  cy.clearCookies();
});

Cypress.Commands.add('setTestUser', (role: 'employee' | 'hr' = 'employee', overrides: Record<string, any> = {}) => {
  cy.window().then((win) => {
    const baseUser = {
      id: role === 'hr' ? 'hr-user-id' : 'employee-user-id',
      email: role === 'hr' ? 'rh@example.com' : 'colaborador@example.com',
      name: role === 'hr' ? 'Especialista RH' : 'Colaborador Teste',
      role,
      position: role === 'hr' ? 'Business Partner' : 'Analista',
      level: 'Pleno',
      mental_health_consent: role === 'employee',
      ...overrides
    };

    win.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      user: baseUser
    }));
  });
});