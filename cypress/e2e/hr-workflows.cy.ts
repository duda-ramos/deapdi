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

  it('approves vacation requests and refreshes HR calendar metrics', () => {
    let useApprovedEvents = false;
    let useApprovedRequests = false;

    cy.intercept('GET', '**/rest/v1/calendar_events*', (req) => {
      req.reply({ fixture: useApprovedEvents ? 'hr/calendar-events-approved.json' : 'hr/calendar-events.json' });
    }).as('getCalendarEvents');

    cy.intercept('GET', '**/rest/v1/calendar_requests*', (req) => {
      req.reply({ fixture: useApprovedRequests ? 'hr/calendar-requests-approved.json' : 'hr/calendar-requests.json' });
    }).as('getCalendarRequests');

    cy.intercept('PATCH', '**/rest/v1/calendar_requests*', (req) => {
      useApprovedRequests = true;
      req.reply({ body: [{ ...req.body, status: 'approved', hr_approval: true }] });
    }).as('approveCalendarRequest');

    cy.intercept('POST', '**/rest/v1/calendar_events', {
      body: [{ id: 'evt-003' }]
    }).as('createCalendarEvent');

    cy.intercept('POST', '**/rest/v1/calendar_notifications', {
      body: [{ id: 'notification-001' }]
    }).as('createCalendarNotification');

    cy.visit('/hr-calendar');
    cy.wait('@getCalendarEvents');
    cy.wait('@getCalendarRequests');

    cy.contains('Total Eventos').prev().should('contain', '2');
    cy.contains('Pendentes').prev().should('contain', '1');

    cy.contains('Aprovações').click();
    cy.contains('Aprovar').click();
    cy.get('textarea').type('Aprovado automaticamente pelos testes.');

    useApprovedEvents = true;
    cy.contains('Confirmar Aprovação').click();

    cy.wait(['@approveCalendarRequest', '@createCalendarEvent', '@createCalendarNotification']);
    cy.wait('@getCalendarEvents');
    cy.wait('@getCalendarRequests');

    cy.contains('Total Eventos').prev().should('contain', '3');
    cy.contains('Pendentes').prev().should('contain', '0');
    cy.contains('Aprovações').click();
    cy.contains('Nenhuma solicitação pendente').should('be.visible');
  });

  it('rejects vacation requests and shows rejection feedback', () => {
    let useRejectedRequests = false;

    cy.intercept('GET', '**/rest/v1/calendar_events*', { fixture: 'hr/calendar-events.json' }).as('getCalendarEvents');
    cy.intercept('GET', '**/rest/v1/calendar_requests*', (req) => {
      req.reply({ fixture: useRejectedRequests ? 'hr/calendar-requests-rejected.json' : 'hr/calendar-requests.json' });
    }).as('getCalendarRequests');

    cy.intercept('PATCH', '**/rest/v1/calendar_requests*', (req) => {
      useRejectedRequests = true;
      req.reply({ body: [{ ...req.body, status: 'rejected', hr_approval: false, rejection_reason: 'Conflito de agenda' }] });
    }).as('rejectCalendarRequest');

    cy.intercept('POST', '**/rest/v1/calendar_notifications', {
      body: [{ id: 'notification-002' }]
    }).as('createRejectionNotification');

    cy.visit('/hr-calendar');
    cy.wait('@getCalendarEvents');
    cy.wait('@getCalendarRequests');

    cy.contains('Aprovações').click();
    cy.contains('Rejeitar').click();
    cy.get('textarea').type('Conflito de agenda identificado.');

    cy.contains('Confirmar Rejeição').click();

    cy.wait(['@rejectCalendarRequest', '@createRejectionNotification']);
    cy.wait('@getCalendarRequests');

    cy.contains('Aprovações').click();
    cy.contains('Rejeitado').should('be.visible');
    cy.contains('Conflito de agenda').should('be.visible');
  });
});
