describe('HR Workflows', () => {
  beforeEach(() => {
    cy.setTestUser('hr');
    cy.intercept('GET', '**/rest/v1/profiles*', { fixture: 'hr/profiles.json' }).as('getProfiles');
    cy.intercept('GET', '**/rest/v1/pdis*', { fixture: 'hr/pdis.json' }).as('getPendingPdis');
    cy.intercept('GET', '**/rest/v1/competencies*', { fixture: 'hr/competencies.json' }).as('getCompetencies');
  });

  it('loads the HR area overview with key dashboards', () => {
    cy.visit('/hr');
    cy.wait(['@getProfiles', '@getPendingPdis', '@getCompetencies']);

    cy.contains('Área de RH').should('be.visible');
    cy.contains('Total Colaboradores').prev().should('contain', '3');
    cy.contains('Ativos').prev().should('contain', '2');
    cy.contains('Distribuição por Função').should('be.visible');
    cy.contains('Tendência de Engajamento').should('be.visible');
    cy.contains('Lista de Colaboradores').should('be.visible');
    cy.contains('Colaborador Teste').should('be.visible');
  });
});
