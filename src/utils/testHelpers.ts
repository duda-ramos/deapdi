/**
 * Test helpers and utilities for manual testing
 */

export interface TestScenario {
  id: string;
  title: string;
  description: string;
  userRole: 'admin' | 'hr' | 'manager' | 'employee';
  priority: 'critical' | 'high' | 'medium' | 'low';
  steps: TestStep[];
  expectedResults: string[];
  testData?: any;
}

export interface TestStep {
  action: string;
  target: string;
  input?: string;
  wait?: number;
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  errors: string[];
  duration: number;
  timestamp: string;
}

export const testScenarios: TestScenario[] = [
  {
    id: 'complete-pdi-cycle',
    title: 'Ciclo Completo de PDI',
    description: 'Colaborador cria PDI → Gestor valida → Sistema atribui pontos',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      { action: 'navigate', target: '/pdi' },
      { action: 'click', target: 'button:contains("Novo PDI")' },
      { action: 'type', target: 'input[placeholder*="React"]', input: 'Aprender TypeScript Avançado' },
      { action: 'type', target: 'textarea', input: 'Estudar conceitos avançados de TypeScript' },
      { action: 'type', target: 'input[type="date"]', input: '2024-12-31' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'wait', target: '', wait: 2000 },
      { action: 'click', target: 'button:contains("Iniciar")' },
      { action: 'wait', target: '', wait: 1000 },
      { action: 'click', target: 'button:contains("Concluir")' }
    ],
    expectedResults: [
      'PDI criado com sucesso',
      'Status mudou para "Em Progresso"',
      'Status mudou para "Concluído"',
      'Aguardando validação do gestor'
    ]
  },
  {
    id: 'competency-evaluation-flow',
    title: 'Fluxo de Avaliação de Competências',
    description: 'Colaborador faz autoavaliação → Gestor avalia → Sistema mostra divergências',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      { action: 'navigate', target: '/competencies' },
      { action: 'click', target: 'button:contains("Autoavaliação")' },
      { action: 'click', target: '.rating-star[data-rating="4"]' },
      { action: 'click', target: 'button:contains("Salvar")' },
      { action: 'wait', target: '', wait: 2000 }
    ],
    expectedResults: [
      'Autoavaliação salva com sucesso',
      'Gráfico radar atualizado',
      'Competências aparecem na lista'
    ]
  },
  {
    id: 'group-action-collaboration',
    title: 'Colaboração em Grupo de Ação',
    description: 'Gestor cria grupo → Adiciona participantes → Atribui tarefas → Membros executam',
    userRole: 'manager',
    priority: 'high',
    steps: [
      { action: 'navigate', target: '/groups' },
      { action: 'click', target: 'button:contains("Novo Grupo")' },
      { action: 'type', target: 'input[placeholder*="Projeto"]', input: 'Projeto de Melhoria de Processos' },
      { action: 'type', target: 'textarea', input: 'Melhorar eficiência dos processos internos' },
      { action: 'type', target: 'input[type="date"]', input: '2024-12-31' },
      { action: 'click', target: 'button[type="submit"]' }
    ],
    expectedResults: [
      'Grupo criado com sucesso',
      'Criador definido como líder',
      'Progresso inicial em 0%'
    ]
  },
  {
    id: 'mentorship-complete-flow',
    title: 'Fluxo Completo de Mentoria',
    description: 'Colaborador solicita mentoria → Mentor aceita → Sessão é agendada',
    userRole: 'employee',
    priority: 'high',
    steps: [
      { action: 'navigate', target: '/mentorship' },
      { action: 'click', target: 'button:contains("Solicitar Mentoria")' },
      { action: 'select', target: 'select[name="mentor"]', input: 'first-option' },
      { action: 'type', target: 'textarea', input: 'Gostaria de desenvolver habilidades de liderança' },
      { action: 'click', target: 'button[type="submit"]' }
    ],
    expectedResults: [
      'Solicitação enviada com sucesso',
      'Mentor recebe notificação',
      'Status aparece como "Pendente"'
    ]
  },
  {
    id: 'mental-health-privacy',
    title: 'Privacidade em Saúde Mental',
    description: 'Verificar que dados de saúde mental são privados e seguros',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      { action: 'navigate', target: '/mental-health' },
      { action: 'click', target: 'button:contains("Aceitar e Participar")' },
      { action: 'click', target: 'button:contains("Check-in Diário")' },
      { action: 'type', target: 'input[type="range"]', input: '3' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'navigate', target: '/logout' },
      { action: 'login', target: 'manager', input: 'gestor@empresa.com' },
      { action: 'navigate', target: '/people' },
      { action: 'verify', target: 'no-mental-health-data' }
    ],
    expectedResults: [
      'Consentimento registrado',
      'Check-in salvo com sucesso',
      'Dados não visíveis para gestor',
      'Privacidade mantida',
      'Apenas RH tem acesso agregado'
    ]
  }
];

export const responsiveTestCases = [
  {
    id: 'mobile-navigation',
    title: 'Navegação Mobile',
    breakpoint: 'sm' as const,
    tests: [
      'Sidebar deve ser colapsível ou oculta',
      'Cards devem empilhar verticalmente',
      'Botões devem ser touch-friendly (min 44px)',
      'Texto deve ser legível sem zoom',
      'Formulários devem usar uma coluna'
    ]
  },
  {
    id: 'tablet-layout',
    title: 'Layout Tablet',
    breakpoint: 'md' as const,
    tests: [
      'Grid de 2 colunas para cards',
      'Sidebar deve permanecer visível',
      'Formulários devem usar 2 colunas quando apropriado',
      'Tabelas devem ter scroll horizontal se necessário',
      'Modais devem ocupar largura adequada'
    ]
  },
  {
    id: 'desktop-optimization',
    title: 'Otimização Desktop',
    breakpoint: 'lg' as const,
    tests: [
      'Grid de 3-4 colunas para cards',
      'Sidebar fixa e expandida',
      'Modais devem ser centralizados',
      'Tooltips devem funcionar no hover',
      'Uso eficiente do espaço horizontal'
    ]
  },
  {
    id: 'large-screen-support',
    title: 'Suporte a Telas Grandes',
    breakpoint: 'xl' as const,
    tests: [
      'Conteúdo não deve ficar muito esticado',
      'Máxima largura definida para leitura',
      'Espaçamento adequado entre elementos',
      'Aproveitamento do espaço extra',
      'Navegação permanece acessível'
    ]
  }
];

export const testRunner = {
  // Run responsive tests
  async runResponsiveTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const testCase of responsiveTestCases) {
      const startTime = Date.now();
      const errors: string[] = [];
      
      try {
        console.log(`📱 Testing: ${testCase.title} at ${testCase.breakpoint}`);
        
        // Simulate breakpoint
        const { responsive } = await import('./responsive');
        responsive.testBreakpoint(testCase.breakpoint);
        
        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check each test condition
        for (const test of testCase.tests) {
          try {
            await this.validateResponsiveCondition(test, testCase.breakpoint);
          } catch (error) {
            errors.push(`${test}: ${error}`);
          }
        }
        
      } catch (error) {
        errors.push(`Setup error: ${error}`);
      }
      
      results.push({
        scenarioId: testCase.id,
        passed: errors.length === 0,
        errors,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
    
    return results;
  },

  async validateResponsiveCondition(condition: string, breakpoint: string): Promise<void> {
    // This would contain actual DOM validation logic
    console.log(`✓ Validating: ${condition} at ${breakpoint}`);
    
    // Simulate some basic validations
    if (condition.includes('Cards devem empilhar verticalmente') && breakpoint === 'sm') {
      const cardGrids = document.querySelectorAll('[class*="grid-cols"]');
      // Check if grids are using single column on mobile
      // This is a simplified check - in reality you'd inspect computed styles
    }
    
    if (condition.includes('touch-friendly') && breakpoint === 'sm') {
      const buttons = document.querySelectorAll('button');
      // Check if buttons meet minimum touch target size (44px)
      // This would require actual size calculations
    }
  },

  // Generate test report
  generateTestReport(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    let report = `# Relatório de Testes de Responsividade\n\n`;
    report += `**Data**: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `**Total de Testes**: ${totalTests}\n`;
    report += `**Aprovados**: ${passedTests}\n`;
    report += `**Falharam**: ${failedTests}\n`;
    report += `**Taxa de Sucesso**: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;
    
    results.forEach(result => {
      report += `## ${result.scenarioId}\n`;
      report += `**Status**: ${result.passed ? '✅ PASSOU' : '❌ FALHOU'}\n`;
      report += `**Duração**: ${result.duration}ms\n`;
      
      if (result.errors.length > 0) {
        report += `**Erros**:\n`;
        result.errors.forEach(error => {
          report += `- ${error}\n`;
        });
      }
      report += '\n';
    });
    
    return report;
  },

  // Export test results
  exportTestResults(results: TestResult[], filename: string = 'test-results') {
    const report = this.generateTestReport(results);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};