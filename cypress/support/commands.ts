/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTestUser(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      setTestUser(
        role: 'employee' | 'hr' | 'admin',
        overrides?: Record<string, unknown>,
      ): Chainable<void>;
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

Cypress.Commands.add(
  'setTestUser',
  (role: 'employee' | 'hr' | 'admin', overrides: Record<string, unknown> = {}) => {
    cy.window().then((win) => {
      const baseUser = {
        id: 'user-hr-test-id',
        email: 'colaborador@example.com',
        name: 'Colaborador Teste',
        role,
        hr_area: role === 'hr' ? 'Especialista RH - Colaborador Teste' : null,
        position: 'Analista',
        level: 'Pleno',
        mental_health_consent: role === 'employee',
        ...overrides,
      };

      const tokenPayload = {
        currentSession: {
          access_token: 'mock-token',
          user: baseUser,
        },
        user: baseUser,
      };

      win.localStorage.setItem('supabase.auth.token', JSON.stringify(tokenPayload));
    });
  },
);
