import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  FileText, 
  Download, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Crown,
  Heart,
  Settings
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';

interface UATScenario {
  id: string;
  title: string;
  userRole: 'admin' | 'hr' | 'manager' | 'employee';
  priority: 'critical' | 'high' | 'medium' | 'low';
  steps: string[];
  expectedResults: string[];
  testData?: any;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  userRole: string;
  page: string;
  browser: string;
  device: string;
  steps: string[];
  expected: string;
  actual: string;
  status: 'open' | 'in-progress' | 'resolved';
  reportedAt: string;
}

const uatScenarios: UATScenario[] = [
  {
    id: 'complete-pdi-cycle',
    title: 'Ciclo Completo de PDI',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      'Fazer login como colaborador',
      'Navegar para página PDI',
      'Criar novo PDI com título, descrição e prazo',
      'Iniciar o PDI (mudar status para "em progresso")',
      'Marcar PDI como concluído',
      'Login como gestor',
      'Validar o PDI concluído',
      'Verificar se pontos foram atribuídos'
    ],
    expectedResults: [
      'PDI criado com sucesso',
      'Status atualizado corretamente',
      'Notificações enviadas',
      'Pontos atribuídos automaticamente',
      'Histórico registrado'
    ]
  },
  {
    id: 'competency-evaluation-flow',
    title: 'Fluxo de Avaliação de Competências',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      'Login como colaborador',
      'Navegar para Competências',
      'Fazer autoavaliação (5 competências)',
      'Salvar avaliações',
      'Login como gestor',
      'Avaliar as mesmas competências',
      'Verificar gráficos de comparação',
      'Analisar divergências'
    ],
    expectedResults: [
      'Autoavaliação salva',
      'Avaliação do gestor salva',
      'Gráficos atualizados',
      'Divergências calculadas',
      'Dados persistidos'
    ]
  },
  {
    id: 'group-action-collaboration',
    title: 'Colaboração em Grupo de Ação',
    userRole: 'manager',
    priority: 'high',
    steps: [
      'Login como gestor',
      'Criar novo grupo de ação',
      'Adicionar 3 participantes',
      'Criar 5 tarefas para diferentes membros',
      'Login como membro',
      'Aceitar participação no grupo',
      'Executar tarefas atribuídas',
      'Verificar progresso do grupo'
    ],
    expectedResults: [
      'Grupo criado',
      'Participantes notificados',
      'Tarefas atribuídas',
      'Progresso calculado automaticamente',
      'Notificações de conclusão'
    ]
  },
  {
    id: 'mentorship-complete-flow',
    title: 'Fluxo Completo de Mentoria',
    userRole: 'employee',
    priority: 'high',
    steps: [
      'Solicitar mentoria',
      'Login como mentor',
      'Aceitar solicitação',
      'Agendar primeira sessão',
      'Realizar sessão (marcar como concluída)',
      'Login como mentee',
      'Avaliar mentor',
      'Verificar histórico de sessões'
    ],
    expectedResults: [
      'Solicitação enviada',
      'Mentoria aceita',
      'Sessão agendada',
      'Sessão registrada',
      'Avaliação salva',
      'Histórico atualizado'
    ]
  },
  {
    id: 'mental-health-privacy',
    title: 'Privacidade em Saúde Mental',
    userRole: 'employee',
    priority: 'critical',
    steps: [
      'Aceitar termos de saúde mental',
      'Fazer check-in emocional',
      'Solicitar sessão de psicologia',
      'Login como RH',
      'Verificar dados administrativos',
      'Login como gestor',
      'Tentar acessar dados do colaborador'
    ],
    expectedResults: [
      'Consentimento registrado',
      'Check-in salvo',
      'Solicitação criada',
      'RH vê dados agregados',
      'Gestor NÃO vê dados individuais',
      'Privacidade mantida'
    ]
  }
];

export const UATPrepKit: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<UATScenario | null>(null);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'medium' as BugReport['severity'],
    userRole: '',
    page: '',
    browser: '',
    device: '',
    steps: '',
    expected: '',
    actual: ''
  });

  const handleReportBug = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBug: BugReport = {
      id: Date.now().toString(),
      ...bugForm,
      steps: bugForm.steps.split('\n').filter(s => s.trim()),
      status: 'open',
      reportedAt: new Date().toISOString()
    };
    
    setBugReports(prev => [newBug, ...prev]);
    setShowBugModal(false);
    setBugForm({
      title: '',
      description: '',
      severity: 'medium',
      userRole: '',
      page: '',
      browser: '',
      device: '',
      steps: '',
      expected: '',
      actual: ''
    });
  };

  const exportUATReport = () => {
    const report = generateUATReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `uat-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateUATReport = () => {
    let report = `# Relatório de UAT - TalentFlow\n\n`;
    report += `**Data**: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `**Total de Cenários**: ${uatScenarios.length}\n`;
    report += `**Bugs Reportados**: ${bugReports.length}\n\n`;
    
    report += `## Cenários de Teste\n\n`;
    uatScenarios.forEach(scenario => {
      report += `### ${scenario.title}\n`;
      report += `**Papel**: ${scenario.userRole}\n`;
      report += `**Prioridade**: ${scenario.priority}\n`;
      report += `**Descrição**: ${scenario.description}\n\n`;
      
      report += `**Passos**:\n`;
      scenario.steps.forEach((step, index) => {
        report += `${index + 1}. ${step}\n`;
      });
      
      report += `\n**Resultados Esperados**:\n`;
      scenario.expectedResults.forEach(result => {
        report += `- ${result}\n`;
      });
      report += '\n';
    });
    
    if (bugReports.length > 0) {
      report += `## Bugs Reportados\n\n`;
      bugReports.forEach(bug => {
        report += `### ${bug.title}\n`;
        report += `**Severidade**: ${bug.severity}\n`;
        report += `**Página**: ${bug.page}\n`;
        report += `**Usuário**: ${bug.userRole}\n`;
        report += `**Navegador**: ${bug.browser}\n`;
        report += `**Dispositivo**: ${bug.device}\n`;
        report += `**Status**: ${bug.status}\n\n`;
        report += `**Descrição**: ${bug.description}\n\n`;
        report += `**Passos para Reproduzir**:\n`;
        bug.steps.forEach((step, index) => {
          report += `${index + 1}. ${step}\n`;
        });
        report += `\n**Esperado**: ${bug.expected}\n`;
        report += `**Atual**: ${bug.actual}\n\n`;
      });
    }
    
    return report;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Settings size={16} className="text-red-500" />;
      case 'hr': return <Heart size={16} className="text-orange-500" />;
      case 'manager': return <Crown size={16} className="text-blue-500" />;
      case 'employee': return <User size={16} className="text-green-500" />;
      default: return <User size={16} className="text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kit de Preparação UAT</h2>
          <p className="text-gray-600">Ferramentas para testes de aceitação do usuário</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowBugModal(true)}
          >
            <AlertTriangle size={16} className="mr-2" />
            Reportar Bug
          </Button>
          <Button onClick={exportUATReport}>
            <Download size={16} className="mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Test Scenarios */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cenários de Teste Críticos</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {uatScenarios.map((scenario) => (
            <div key={scenario.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(scenario.userRole)}
                  <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                </div>
                <Badge variant={getPriorityColor(scenario.priority)}>
                  {scenario.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {scenario.steps.length} passos • {scenario.expectedResults.length} resultados
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setShowScenarioModal(true);
                  }}
                >
                  <Eye size={14} className="mr-1" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bug Reports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bugs Reportados</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="danger">
              {bugReports.filter(b => b.severity === 'critical').length} Críticos
            </Badge>
            <Badge variant="warning">
              {bugReports.filter(b => b.severity === 'high').length} Altos
            </Badge>
          </div>
        </div>

        {bugReports.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p>Nenhum bug reportado ainda</p>
            <p className="text-sm">Isso é uma boa notícia! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bugReports.map((bug) => (
              <div key={bug.id} className={`p-4 rounded-lg border ${
                bug.severity === 'critical' ? 'border-red-300 bg-red-50' :
                bug.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                bug.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{bug.title}</h4>
                    <Badge variant={getSeverityColor(bug.severity)}>
                      {bug.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(bug.reportedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{bug.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div><strong>Página:</strong> {bug.page}</div>
                  <div><strong>Usuário:</strong> {bug.userRole}</div>
                  <div><strong>Navegador:</strong> {bug.browser}</div>
                  <div><strong>Dispositivo:</strong> {bug.device}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Test Credentials */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Credenciais de Teste</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { role: 'admin', email: 'admin@empresa.com', password: 'admin123', color: 'red' },
            { role: 'hr', email: 'rh@empresa.com', password: 'rh123456', color: 'orange' },
            { role: 'manager', email: 'gestor@empresa.com', password: 'gestor123', color: 'blue' },
            { role: 'employee', email: 'colaborador@empresa.com', password: 'colab123', color: 'green' }
          ].map((cred) => (
            <div key={cred.role} className={`p-4 bg-${cred.color}-50 rounded-lg border border-${cred.color}-200`}>
              <div className="flex items-center space-x-2 mb-2">
                {getRoleIcon(cred.role)}
                <h4 className="font-medium text-gray-900 capitalize">{cred.role}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <code className="ml-1 text-xs bg-white px-1 rounded">{cred.email}</code>
                </div>
                <div>
                  <span className="text-gray-600">Senha:</span>
                  <code className="ml-1 text-xs bg-white px-1 rounded">{cred.password}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scenario Details Modal */}
      <Modal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        title={selectedScenario?.title || ''}
        size="lg"
      >
        {selectedScenario && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {getRoleIcon(selectedScenario.userRole)}
              <div>
                <h3 className="text-lg font-semibold">{selectedScenario.title}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={getPriorityColor(selectedScenario.priority)}>
                    {selectedScenario.priority}
                  </Badge>
                  <span className="text-sm text-gray-600 capitalize">
                    Papel: {selectedScenario.userRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Passos para Execução</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                {selectedScenario.steps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="font-medium text-blue-600">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Resultados Esperados</h4>
              <ul className="text-sm text-green-800 space-y-1">
                {selectedScenario.expectedResults.map((result, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle size={12} className="text-green-600" />
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Pontos de Atenção</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Teste em diferentes navegadores (Chrome, Firefox, Safari)</li>
                <li>• Verifique responsividade em mobile e tablet</li>
                <li>• Confirme que notificações aparecem</li>
                <li>• Valide permissões por tipo de usuário</li>
                <li>• Teste com dados reais, não apenas exemplos</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Bug Report Modal */}
      <Modal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
        title="Reportar Bug"
        size="lg"
      >
        <form onSubmit={handleReportBug} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título do bug"
              value={bugForm.title}
              onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            <Select
              value={bugForm.severity}
              onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value as any })}
              options={[
                { value: 'critical', label: 'Crítico - Sistema não funciona' },
                { value: 'high', label: 'Alto - Funcionalidade quebrada' },
                { value: 'medium', label: 'Médio - Problema menor' },
                { value: 'low', label: 'Baixo - Melhoria' }
              ]}
              required
            />
          </div>

          <Textarea
            placeholder="Descrição detalhada do problema..."
            value={bugForm.description}
            onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Página (ex: /dashboard)"
              value={bugForm.page}
              onChange={(e) => setBugForm({ ...bugForm, page: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            <input
              type="text"
              placeholder="Papel do usuário"
              value={bugForm.userRole}
              onChange={(e) => setBugForm({ ...bugForm, userRole: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            <input
              type="text"
              placeholder="Navegador"
              value={bugForm.browser}
              onChange={(e) => setBugForm({ ...bugForm, browser: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            <input
              type="text"
              placeholder="Dispositivo"
              value={bugForm.device}
              onChange={(e) => setBugForm({ ...bugForm, device: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <Textarea
            placeholder="Passos para reproduzir (um por linha)..."
            value={bugForm.steps}
            onChange={(e) => setBugForm({ ...bugForm, steps: e.target.value })}
            rows={4}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              placeholder="Resultado esperado..."
              value={bugForm.expected}
              onChange={(e) => setBugForm({ ...bugForm, expected: e.target.value })}
              rows={2}
              required
            />
            
            <Textarea
              placeholder="Resultado atual..."
              value={bugForm.actual}
              onChange={(e) => setBugForm({ ...bugForm, actual: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBugModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <AlertTriangle size={16} className="mr-2" />
              Reportar Bug
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};