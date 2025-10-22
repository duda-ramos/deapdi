describe('User Role Permissions', () => {
  const testRoles = [
    {
      role: 'employee',
      name: 'Employee User',
      shouldSee: ['Dashboard', 'Meu Perfil', 'PDI', 'Competências'],
      shouldNotSee: ['Administração', 'Gerenciar Usuários']
    },
    {
      role: 'manager',
      name: 'Manager User',
      shouldSee: ['Dashboard', 'Área de RH'],
      shouldNotSee: ['Administração']
    },
    {
      role: 'admin',
      name: 'Admin User',
      shouldSee: ['Dashboard', 'Administração', 'Gerenciar Usuários', 'Área de RH'],
      shouldNotSee: []
    }
  ];

  testRoles.forEach(({ role, name, shouldSee, shouldNotSee }) => {
    describe(`${role} role`, () => {
      beforeEach(() => {
        cy.window().then((win) => {
          win.localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'mock-token',
            user: {
              id: `${role}-user-id`,
              email: `${role}@example.com`,
              name: name,
              role: role
            }
          }));
        });
      });

      it(`should show appropriate menu items for ${role}`, () => {
        cy.visit('/dashboard');
        
        shouldSee.forEach(menuItem => {
          cy.contains(menuItem).should('be.visible');
        });
        
        shouldNotSee.forEach(menuItem => {
          cy.contains(menuItem).should('not.exist');
        });
      });

      if (shouldNotSee.includes('Administração')) {
        it(`should block access to admin pages for ${role}`, () => {
          cy.visit('/admin');
          cy.contains('Acesso Negado').should('be.visible');
        });
      }

      if (shouldNotSee.includes('Gerenciar Usuários')) {
        it(`should block access to user management for ${role}`, () => {
          cy.visit('/users');
          cy.contains('Acesso Negado').should('be.visible');
        });
      }
    });
  });
});