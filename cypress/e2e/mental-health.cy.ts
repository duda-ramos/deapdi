describe('Programa de Saúde Mental', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  context('Fluxo do colaborador', () => {
    beforeEach(() => {
      cy.intercept('PATCH', '**/rest/v1/profiles*', {
        statusCode: 200,
        body: [{ mental_health_consent: true }]
      }).as('updateConsent');

      cy.intercept('POST', '**/rest/v1/emotional_checkins', {
        statusCode: 201,
        body: [{ id: 'checkin-1' }]
      }).as('createCheckin');

      cy.intercept('POST', '**/rest/v1/session_requests', {
        statusCode: 201,
        body: [{ id: 'request-1' }]
      }).as('createSessionRequest');
    });

    it('realiza consentimento, check-in e solicita sessão', () => {
      cy.visit('/mental-health', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
        }
      });
      cy.setTestUser('employee', {
        id: 'employee-1',
        email: 'colaborador@example.com',
        name: 'Colaborador Teste',
        position: 'Analista',
        level: 'Pleno',
        mental_health_consent: false
      });
      cy.reload();

      cy.contains('Programa de Bem-estar Psicológico').should('be.visible');
      cy.contains('Aceitar e Participar').click();
      cy.wait('@updateConsent');

      cy.contains('Bem-estar Psicológico').should('be.visible');

      cy.contains('Check-in Diário').click();
      cy.contains('Check-in Emocional Diário').should('be.visible');

      cy.get('input[type="range"]').eq(0).invoke('val', 8).trigger('input');
      cy.get('input[type="range"]').eq(1).invoke('val', 7).trigger('input');
      cy.get('input[type="range"]').eq(2).invoke('val', 6).trigger('input');
      cy.get('input[type="range"]').eq(3).invoke('val', 9).trigger('input');

      cy.get('textarea').type('Me sentindo motivado após uma boa reunião.');
      cy.contains('Salvar Check-in').click();
      cy.wait('@createCheckin');
      cy.contains('Check-in Emocional Diário').should('not.exist');

      cy.contains('Solicitar Sessão').click();
      cy.contains('Solicitar Sessão de Psicologia').should('be.visible');

      cy.get('select').eq(0).select('Prioritária - Preciso de atenção em breve');
      cy.get('select').eq(1).select('Online - Videochamada');
      cy.get('textarea').clear().type('Gostaria de acompanhamento para organizar prioridades.');
      cy.contains('Horários Preferidos').parent().contains('09:00').click();
      cy.contains('Horários Preferidos').parent().contains('10:00').click();

      cy.contains('Enviar Solicitação').click();
      cy.wait('@createSessionRequest');
      cy.contains('Solicitar Sessão de Psicologia').should('not.exist');
    });
  });

  context('Fluxo do RH', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/rest/v1/session_requests*', { fixture: 'mental-health/sessionRequests.json' }).as('getSessionRequests');
      cy.intercept('GET', '**/rest/v1/psychology_sessions?*select=*', { fixture: 'mental-health/sessions.json' }).as('getSessions');
      cy.intercept('GET', '**/rest/v1/mental_health_alerts?*select=*', { fixture: 'mental-health/alerts.json' }).as('getAlerts');
      cy.intercept('GET', '**/rest/v1/form_responses?*select=*', { fixture: 'mental-health/formResponses.json' }).as('getFormResponses');
      cy.intercept('GET', '**/rest/v1/emotional_checkins?*select=mood_rating*', { fixture: 'mental-health/moodCheckins.json' }).as('getMoodScores');
      cy.intercept('GET', '**/rest/v1/form_responses?*select=score*', { fixture: 'mental-health/formResponseScores.json' }).as('getResponseScores');

      cy.intercept('HEAD', '**/rest/v1/profiles?*select=id*', (req) => {
        req.reply({ statusCode: 200, headers: { 'content-range': '0-0/25' } });
      }).as('profilesCount');

      cy.intercept('HEAD', '**/rest/v1/psychology_sessions?*select=id*', (req) => {
        req.reply({ statusCode: 200, headers: { 'content-range': '0-0/3' } });
      }).as('sessionsCount');

      cy.intercept('HEAD', '**/rest/v1/mental_health_alerts?*select=id*', (req) => {
        req.reply({ statusCode: 200, headers: { 'content-range': '0-0/2' } });
      }).as('alertsCount');

      cy.intercept('PATCH', '**/rest/v1/session_requests*', {
        statusCode: 200,
        body: [{ id: 'request-1', status: 'aceita' }]
      }).as('updateRequest');

      cy.intercept('POST', '**/rest/v1/psychology_sessions', {
        statusCode: 201,
        body: [{ id: 'session-2' }]
      }).as('createSession');

      cy.intercept('PATCH', '**/rest/v1/mental_health_alerts*', {
        statusCode: 200,
        body: [{ id: 'alert-1', resolved_at: new Date().toISOString() }]
      }).as('resolveAlert');
    });

    it('carrega dashboard, aceita solicitação e resolve alerta', () => {
      cy.visit('/mental-health/admin', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
        }
      });
      cy.setTestUser('hr', {
        id: 'hr-user-1',
        email: 'rh@example.com',
        name: 'Especialista RH',
        position: 'Business Partner',
        level: 'Sênior',
        mental_health_consent: true
      });
      cy.reload();

      cy.wait(['@getSessionRequests', '@getSessions', '@getAlerts', '@getFormResponses']);
      cy.contains('Administração - Saúde Mental').should('be.visible');
      cy.contains('Total de colaboradores no programa').should('be.visible');

      cy.contains('Solicitações').click();
      cy.contains('Solicitações de Sessão').should('be.visible');
      cy.contains('Aceitar').click();
      cy.wait('@updateRequest');
      cy.contains('Agendar Sessão de Psicologia').should('be.visible');

      const today = new Date().toISOString().split('T')[0];
      cy.get('input[type="date"]').type(today);
      cy.contains('label', 'Horário').parent().find('select').select('09:00');
      cy.contains('label', 'Duração').parent().find('select').select('1 hora');
      cy.contains('label', 'Tipo de Sessão').parent().find('select').select('Online');
      cy.contains('label', 'Link da Reunião').parent().find('input').type('https://meet.example.com/sessao');

      cy.contains('Confirmar Agendamento').click();
      cy.wait('@createSession');

      cy.contains('Alertas').click();
      cy.contains('Alertas de Saúde Mental').should('be.visible');
      cy.contains('Resolver').click();
      cy.contains('Resolver Alerta de Saúde Mental').should('be.visible');

      cy.get('textarea').type('Contato realizado com a colaboradora e plano de cuidado definido.');
      cy.contains('Resolver Alerta').click();
      cy.wait('@resolveAlert');
      cy.contains('Resolver Alerta de Saúde Mental').should('not.exist');
    });
  });
});
