describe('Action Groups Page', () => {
  const SUPABASE_URL = 'https://test.supabase.co';
  const PROFILES = [
    {
      id: 'manager-1',
      name: 'Gestora de Pessoas',
      email: 'manager@example.com',
      position: 'Gestor de Pessoas',
      role: 'manager',
      avatar_url: null
    },
    {
      id: 'member-1',
      name: 'Colaborador Um',
      email: 'colaborador1@example.com',
      position: 'Analista de Dados',
      role: 'employee',
      avatar_url: null
    }
  ];

  let groups: any[];
  let participants: any[];
  let tasks: any[];
  let notifications: any[];
  let pdis: any[];

  const resetData = () => {
    const now = new Date('2024-01-10T00:00:00.000Z').toISOString();

    groups = [
      {
        id: 'group-1',
        title: 'Transformação Digital',
        description: 'Implementar novas ferramentas digitais na organização.',
        deadline: '2025-12-31',
        status: 'active',
        progress: 0,
        created_by: 'manager-1',
        created_at: now,
        updated_at: now,
        linked_pdi_id: 'pdi-1'
      }
    ];

    participants = [
      {
        id: 'participant-1',
        group_id: 'group-1',
        profile_id: 'manager-1',
        role: 'leader',
        created_at: now
      },
      {
        id: 'participant-2',
        group_id: 'group-1',
        profile_id: 'member-1',
        role: 'member',
        created_at: now
      }
    ];

    tasks = [];
    notifications = [];
    pdis = [
      {
        id: 'pdi-1',
        profile_id: 'manager-1',
        title: 'Plano de Desenvolvimento em Liderança',
        status: 'in-progress',
        created_at: now,
        updated_at: now
      }
    ];
  };

  const parseEqParam = (value?: string | null) => {
    if (!value) return null;
    let cleaned = value.replace('eq.', '');
    cleaned = cleaned.replace(/"/g, '');
    return decodeURIComponent(cleaned);
  };

  const getProfile = (id: string) => PROFILES.find(profile => profile.id === id);

  const buildGroupPayload = () =>
    groups.map(group => ({
      ...group,
      participants: participants
        .filter(participant => participant.group_id === group.id)
        .map(participant => ({
          ...participant,
          profile: getProfile(participant.profile_id)
        })),
      tasks: tasks
        .filter(task => task.group_id === group.id)
        .map(task => ({
          ...task,
          assignee: (() => {
            const profile = getProfile(task.assignee_id);
            return profile
              ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url }
              : { id: task.assignee_id, name: 'Desconhecido', avatar_url: null };
          })()
        }))
    }));

  const reply = (req: Cypress.Interception, body: any, single = false) => {
    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    if (!single) {
      const length = Array.isArray(body) ? body.length : body ? 1 : 0;
      headers['content-range'] = length > 0 ? `0-${length - 1}/${length}` : '0-0/0';
    }

    req.reply({ statusCode: 200, body, headers });
  };

  const setupSupabaseInterceptors = () => {
    cy.intercept('OPTIONS', `${SUPABASE_URL}/rest/v1/*`, req => req.reply({ statusCode: 200 }));
    cy.intercept('OPTIONS', `${SUPABASE_URL}/auth/v1/*`, req => req.reply({ statusCode: 200 }));

    cy.intercept('GET', `${SUPABASE_URL}/auth/v1/user`, req => {
      req.reply({
        statusCode: 200,
        body: {
          id: 'manager-1',
          email: 'manager@example.com',
          user_metadata: {
            name: 'Gestora de Pessoas',
            role: 'manager',
            position: 'Gestor de Pessoas'
          }
        }
      });
    });

    cy.intercept('POST', `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, req => {
      req.reply({
        statusCode: 200,
        body: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 'manager-1',
            email: 'manager@example.com'
          }
        }
      });
    });

    cy.intercept('POST', `${SUPABASE_URL}/rest/v1/rpc/get_user_achievement_stats`, req => {
      req.reply({
        statusCode: 200,
        body: {
          completedpdis: 0,
          completedtasks: 0,
          completedcourses: 0,
          competenciesrated: 0,
          mentorshipsessions: 0,
          careerprogressions: 0,
          actiongrouptasks: 0,
          wellnesscheckins: 0
        }
      });
    });

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/achievement_templates*`, req => reply(req, []));
    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/achievements*`, req => reply(req, []));

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/profiles*`, req => {
      const url = new URL(req.url);
      const accept = req.headers['accept'] as string | undefined;
      const idFilter = parseEqParam(url.searchParams.get('id'));

      const result = idFilter ? PROFILES.filter(profile => profile.id === idFilter) : PROFILES;
      reply(req, accept?.includes('object') ? result[0] : result, !!accept?.includes('object'));
    }).as('getProfiles');

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/pdis*`, req => {
      const url = new URL(req.url);
      const profileFilter = parseEqParam(url.searchParams.get('profile_id'));
      const data = profileFilter ? pdis.filter(pdi => pdi.profile_id === profileFilter) : pdis;
      reply(req, data);
    }).as('getPdis');

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/action_groups*`, req => {
      const url = new URL(req.url);
      const idFilter = parseEqParam(url.searchParams.get('id'));
      let payload = buildGroupPayload();

      if (idFilter) {
        payload = payload.filter(group => group.id === idFilter);
      }

      const single = (req.headers['accept'] as string | undefined)?.includes('object');
      reply(req, single ? payload[0] : payload, single);
    }).as('getActionGroups');

    cy.intercept('POST', `${SUPABASE_URL}/rest/v1/action_groups`, req => {
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const now = new Date().toISOString();
      const newGroup = {
        ...body,
        id: `group-${Date.now()}`,
        created_at: now,
        updated_at: now,
        status: body.status || 'active'
      };
      groups.unshift(newGroup);
      reply(req, newGroup, true);
    }).as('createActionGroup');

    cy.intercept('PATCH', `${SUPABASE_URL}/rest/v1/action_groups*`, req => {
      const url = new URL(req.url);
      const id = parseEqParam(url.searchParams.get('id'));
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const group = groups.find(item => item.id === id);
      if (group) {
        Object.assign(group, body, { updated_at: new Date().toISOString() });
      }
      reply(req, group ?? body, true);
    }).as('updateActionGroup');

    cy.intercept('POST', `${SUPABASE_URL}/rest/v1/action_group_participants`, req => {
      const entries = Array.isArray(req.body) ? req.body : [req.body];
      const now = new Date().toISOString();
      const created = entries.map(entry => {
        const participant = {
          ...entry,
          id: `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          created_at: now
        };
        participants.push(participant);
        return participant;
      });
      reply(req, Array.isArray(req.body) ? created : created[0], !Array.isArray(req.body));
    }).as('addParticipant');

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/action_group_participants*`, req => {
      const url = new URL(req.url);
      const groupId = parseEqParam(url.searchParams.get('group_id'));
      const data = (groupId ? participants.filter(p => p.group_id === groupId) : participants).map(participant => ({
        ...participant,
        profile: getProfile(participant.profile_id)
      }));
      reply(req, data);
    }).as('getParticipants');

    cy.intercept('DELETE', `${SUPABASE_URL}/rest/v1/action_group_participants*`, req => {
      const url = new URL(req.url);
      const groupId = parseEqParam(url.searchParams.get('group_id'));
      const profileId = parseEqParam(url.searchParams.get('profile_id'));
      participants = participants.filter(
        participant =>
          !(participant.group_id === groupId && participant.profile_id === profileId)
      );
      req.reply({ statusCode: 204, body: '' });
    }).as('removeParticipant');

    cy.intercept('POST', `${SUPABASE_URL}/rest/v1/tasks`, req => {
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const now = new Date().toISOString();
      const task = {
        ...body,
        id: `task-${Date.now()}`,
        status: body.status || 'todo',
        created_at: now,
        updated_at: now
      };
      tasks.push(task);
      const profile = getProfile(task.assignee_id);
      reply(
        req,
        {
          ...task,
          assignee: profile
            ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url }
            : { id: task.assignee_id, name: 'Desconhecido', avatar_url: null }
        },
        true
      );
    }).as('createTask');

    cy.intercept('PATCH', `${SUPABASE_URL}/rest/v1/tasks*`, req => {
      const url = new URL(req.url);
      const id = parseEqParam(url.searchParams.get('id'));
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const task = tasks.find(item => item.id === id);
      if (task) {
        Object.assign(task, body, { updated_at: new Date().toISOString() });
      }
      const profile = task ? getProfile(task.assignee_id) : undefined;
      reply(
        req,
        task
          ? {
              ...task,
              assignee: profile
                ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url }
                : { id: task.assignee_id, name: 'Desconhecido', avatar_url: null }
            }
          : body,
        true
      );
    }).as('updateTask');

    cy.intercept('PATCH', `${SUPABASE_URL}/rest/v1/pdis*`, req => {
      const url = new URL(req.url);
      const id = parseEqParam(url.searchParams.get('id'));
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const pdi = pdis.find(item => item.id === id);
      if (pdi) {
        Object.assign(pdi, body, { updated_at: new Date().toISOString() });
      }
      reply(req, pdi ?? body, true);
    }).as('updatePdi');

    cy.intercept('POST', `${SUPABASE_URL}/rest/v1/notifications`, req => {
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      const notification = {
        ...body,
        id: `notification-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      notifications.push(notification);
      reply(req, notification, true);
    }).as('createNotification');
  };

  const visitActionGroups = () => {
    cy.getManagerSession().then(({ supabaseUrl, supabaseAnonKey, session }) => {
      const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];

      setupSupabaseInterceptors();

      cy.visit('/action-groups', {
        onBeforeLoad(win) {
          win.localStorage.setItem('TEMP_SUPABASE_URL', supabaseUrl);
          win.localStorage.setItem('TEMP_SUPABASE_ANON_KEY', supabaseAnonKey);
          win.localStorage.setItem(
            `sb-${projectRef}-auth-token`,
            JSON.stringify({
              currentSession: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                token_type: 'bearer',
                expires_in: 3600,
                user: session.user
              },
              expiresAt: Math.floor(Date.now() / 1000) + 3600
            })
          );
          win.localStorage.setItem(
            'supabase.auth.token',
            JSON.stringify({ access_token: session.access_token, user: session.user })
          );
        }
      });
    });
  };

  beforeEach(() => {
    resetData();
  });

  it('lists action groups using mocked Supabase responses', () => {
    visitActionGroups();
    cy.wait('@getActionGroups');

    cy.contains('Grupos de Ação').should('be.visible');
    cy.contains('Transformação Digital').should('be.visible');
    cy.contains('Colabore em projetos e iniciativas estratégicas').should('be.visible');
  });

  it('creates a new action group including participants', () => {
    visitActionGroups();
    cy.wait('@getActionGroups');

    cy.contains('button', 'Novo Grupo').click();

    cy.contains('label', 'Título do Grupo').parent().find('input').type('Novo Projeto Estratégico');
    cy.contains('label', 'Descrição').parent().find('textarea').type('Grupo para conduzir a expansão internacional.');
    cy.contains('label', 'Prazo').parent().find('input').type('2025-06-01');

    cy.contains('span', 'Colaborador Um')
      .parents('div')
      .first()
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.contains('button', 'Criar Grupo').click();

    cy.wait('@createActionGroup');
    cy.wait('@addParticipant');
    cy.wait('@getActionGroups');

    cy.contains('Novo Projeto Estratégico').should('be.visible');
  });

  it('creates a task and updates its status to completed', () => {
    visitActionGroups();
    cy.wait('@getActionGroups');

    cy.contains('h3', 'Transformação Digital')
      .parent()
      .parent()
      .siblings('div')
      .find('button')
      .filter((_, el) => Cypress.$(el).find('svg.lucide-edit').length > 0)
      .click();

    cy.contains('button', 'Nova Tarefa').click();

    cy.contains('label', 'Título da Tarefa').parent().find('input').type('Planejar Roadmap');
    cy.contains('label', 'Responsável').parent().find('select').select('Colaborador Um');
    cy.contains('label', 'Prazo').parent().find('input').type('2025-07-15');

    cy.contains('button', 'Criar Tarefa').click();

    cy.wait('@createTask');
    cy.wait('@getActionGroups');

    cy.contains('Planejar Roadmap').should('be.visible');
    cy.contains('Planejar Roadmap').parent().parent().parent().within(() => {
      cy.contains('button', 'Iniciar').click();
    });

    cy.wait('@updateTask');
    cy.wait('@getActionGroups');

    cy.contains('Planejar Roadmap').parent().parent().parent().within(() => {
      cy.contains('button', 'Concluir').click();
    });

    cy.wait('@updateTask');
    cy.wait('@getActionGroups');

    cy.contains('Planejar Roadmap')
      .parent()
      .parent()
      .parent()
      .within(() => {
        cy.contains('Concluída').should('be.visible');
      });
  });

  it('completes an action group when all tasks are done', () => {
    tasks.push({
      id: 'task-existing',
      title: 'Preparar Materiais',
      description: null,
      assignee_id: 'member-1',
      group_id: 'group-1',
      deadline: '2025-03-01',
      status: 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    visitActionGroups();
    cy.wait('@getActionGroups');

    cy.contains('h3', 'Transformação Digital')
      .parent()
      .parent()
      .siblings('div')
      .find('button')
      .filter((_, el) => Cypress.$(el).find('svg.lucide-edit').length > 0)
      .click();

    cy.contains('button', 'Marcar como Concluído').click();

    cy.wait('@updateActionGroup');
    cy.wait('@updatePdi');
    cy.wait('@getActionGroups');

    cy.contains('h3', 'Transformação Digital')
      .parent()
      .parent()
      .siblings('div')
      .within(() => {
        cy.contains('Concluído').should('be.visible');
      });
  });

  it('shows configuration guidance when RLS recursion is detected', () => {
    setupSupabaseInterceptors();

    cy.intercept('GET', `${SUPABASE_URL}/rest/v1/action_groups*`, req => {
      req.reply({
        statusCode: 400,
        body: {
          message: 'infinite recursion detected in policy for relation "action_groups"',
          code: '42P17'
        }
      });
    }).as('getActionGroupsError');

    cy.getManagerSession().then(({ supabaseUrl, supabaseAnonKey, session }) => {
      const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];

      cy.visit('/action-groups', {
        onBeforeLoad(win) {
          win.localStorage.setItem('TEMP_SUPABASE_URL', supabaseUrl);
          win.localStorage.setItem('TEMP_SUPABASE_ANON_KEY', supabaseAnonKey);
          win.localStorage.setItem(
            `sb-${projectRef}-auth-token`,
            JSON.stringify({
              currentSession: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                token_type: 'bearer',
                expires_in: 3600,
                user: session.user
              },
              expiresAt: Math.floor(Date.now() / 1000) + 3600
            })
          );
          win.localStorage.setItem(
            'supabase.auth.token',
            JSON.stringify({ access_token: session.access_token, user: session.user })
          );
        }
      });
    });

    cy.wait('@getActionGroupsError');

    cy.contains('⚠️ Problema de configuração detectado').should('be.visible');
    cy.contains('As políticas de segurança da tabela action_groups no Supabase').should('be.visible');
  });
});
