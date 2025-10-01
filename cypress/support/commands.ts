/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTestUser(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      getManagerSession(): Chainable<{
        supabaseUrl: string;
        supabaseAnonKey: string;
        session: {
          access_token: string;
          refresh_token: string;
          user: {
            id: string;
            email: string;
            user_metadata: Record<string, any>;
          };
        };
      }>;
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

Cypress.Commands.add('getManagerSession', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const supabaseAnonKey = 'test-anon-key';

  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    user: {
      id: 'manager-1',
      email: 'manager@example.com',
      user_metadata: {
        name: 'Gestora de Pessoas',
        role: 'manager',
        position: 'Gestor de Pessoas'
      }
    }
  };

  return cy.wrap({
    supabaseUrl,
    supabaseAnonKey,
    session
  });
});
