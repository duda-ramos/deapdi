import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  Smartphone, 
  Users, 
  FileText, 
  CheckSquare,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Play,
  Eye
} from 'lucide-react';
import { TestingPanel } from '../components/testing/TestingPanel';
import { UATPrepKit } from '../components/testing/UATPrepKit';
import { ResponsiveDebugger } from '../components/ui/ResponsiveContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const QualityAssurance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDebugger, setShowDebugger] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={16} /> },
    { id: 'responsive', label: 'Responsividade', icon: <Smartphone size={16} /> },
    { id: 'scenarios', label: 'Cenários UAT', icon: <Users size={16} /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} /> }
  ];

  const qualityMetrics = [
    {
      category: 'Responsividade',
      items: [
        { name: 'Mobile (< 768px)', status: 'pending', priority: 'high' },
        { name: 'Tablet (768px - 1024px)', status: 'pending', priority: 'high' },
        { name: 'Desktop (> 1024px)', status: 'pending', priority: 'medium' },
        { name: 'Touch interactions', status: 'pending', priority: 'high' }
      ]
    },
    {
      category: 'Funcionalidades',
      items: [
        { name: 'Autenticação completa', status: 'completed', priority: 'critical' },
        { name: 'CRUD de PDIs', status: 'completed', priority: 'critical' },
        { name: 'Sistema de competências', status: 'completed', priority: 'critical' },
        { name: 'Grupos de ação', status: 'in-progress', priority: 'high' },
        { name: 'Sistema de conquistas', status: 'in-progress', priority: 'medium' },
        { name: 'Mentoria completa', status: 'pending', priority: 'medium' }
      ]
    },
    {
      category: 'Performance',
      items: [
        { name: 'Carregamento inicial < 3s', status: 'pending', priority: 'high' },
        { name: 'Navegação fluida', status: 'pending', priority: 'medium' },
        { name: 'Lazy loading implementado', status: 'completed', priority: 'medium' },
        { name: 'Bundle size otimizado', status: 'completed', priority: 'low' }
      ]
    },
    {
      category: 'Segurança',
      items: [
        { name: 'RLS configurado', status: 'completed', priority: 'critical' },
        { name: 'Sanitização de inputs', status: 'completed', priority: 'critical' },
        { name: 'Rate limiting', status: 'completed', priority: 'high' },
        { name: 'Headers de segurança', status: 'completed', priority: 'high' }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress': return <Clock size={16} className="text-blue-500" />;
      case 'pending': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'pending': return 'warning';
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

  const calculateProgress = () => {
    const allItems = qualityMetrics.flatMap(m => m.items);
    const completed = allItems.filter(i => i.status === 'completed').length;
    return Math.round((completed / allItems.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TestTube className="mr-3 text-purple-500" size={28} />
            Garantia de Qualidade
          </h1>
          <p className="text-gray-600 mt-1">Ferramentas de teste e validação</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowDebugger(!showDebugger)}
          >
            <Eye size={16} className="mr-2" />
            {showDebugger ? 'Ocultar' : 'Mostrar'} Debug
          </Button>
          <Badge variant="info">
            {calculateProgress()}% Completo
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Progresso Geral da Qualidade</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {qualityMetrics.map((metric) => (
                <div key={metric.category}>
                  <h4 className="font-medium text-gray-900 mb-3">{metric.category}</h4>
                  <div className="space-y-2">
                    {metric.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <Badge variant={getPriorityColor(item.priority)} size="sm">
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <Smartphone size={32} className="mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Testes de Responsividade</h3>
              <p className="text-sm text-gray-600 mb-4">
                Valide a interface em diferentes dispositivos
              </p>
              <Button onClick={() => setActiveTab('responsive')} className="w-full">
                Iniciar Testes
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Users size={32} className="mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Cenários UAT</h3>
              <p className="text-sm text-gray-600 mb-4">
                Execute cenários de teste com usuários reais
              </p>
              <Button onClick={() => setActiveTab('scenarios')} className="w-full">
                Ver Cenários
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <CheckSquare size={32} className="mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Checklist Final</h3>
              <p className="text-sm text-gray-600 mb-4">
                Validação completa antes da produção
              </p>
              <Button onClick={() => setActiveTab('checklist')} className="w-full">
                Abrir Checklist
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Responsive Tab */}
      {activeTab === 'responsive' && (
        <TestingPanel />
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <UATPrepKit />
      )}

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Checklist de Qualidade</h3>
          <div className="space-y-6">
            {qualityMetrics.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CheckSquare size={16} className="mr-2" />
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          onChange={() => {
                            // In a real implementation, this would update the status
                            console.log(`Toggling ${item.name}`);
                          }}
                          className="rounded"
                        />
                        <span className="text-gray-900">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(item.status)} size="sm">
                          {item.status === 'completed' ? 'Concluído' :
                           item.status === 'in-progress' ? 'Em Progresso' : 'Pendente'}
                        </Badge>
                        <Badge variant={getPriorityColor(item.priority)} size="sm">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Responsive Debugger */}
      {showDebugger && <ResponsiveDebugger />}
    </div>
  );
};

export default QualityAssurance;