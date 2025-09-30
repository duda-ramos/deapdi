import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Play, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Bug
} from 'lucide-react';
import { testRunner, responsiveTestCases, testScenarios, TestResult } from '../../utils/testHelpers';
import { responsive } from '../../utils/responsive';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export const TestingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('responsive');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const runResponsiveTests = async () => {
    setRunning(true);
    try {
      const results = await testRunner.runResponsiveTests();
      setTestResults(results);
    } catch (error) {
      console.error('Error running responsive tests:', error);
    } finally {
      setRunning(false);
    }
  };

  const simulateBreakpoint = (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => {
    responsive.testBreakpoint(breakpoint);
  };

  const exportResults = () => {
    testRunner.exportTestResults(testResults);
  };

  const tabs = [
    { id: 'responsive', label: 'Responsividade', icon: <Smartphone size={16} /> },
    { id: 'scenarios', label: 'Cenários', icon: <Users size={16} /> },
    { id: 'results', label: 'Resultados', icon: <FileText size={16} /> }
  ];

  return (
    <>
      {/* Floating Test Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
        title="Painel de Testes"
      >
        <TestTube size={20} />
      </button>

      {/* Testing Panel Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Painel de Testes e QA"
        size="xl"
      >
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Responsive Testing Tab */}
          {activeTab === 'responsive' && (
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Simulação de Dispositivos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => simulateBreakpoint('sm')}
                    className="flex flex-col items-center py-4 space-y-2"
                  >
                    <Smartphone size={24} />
                    <span className="text-xs">Mobile</span>
                    <span className="text-xs text-gray-500">640px</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => simulateBreakpoint('md')}
                    className="flex flex-col items-center py-4 space-y-2"
                  >
                    <Tablet size={24} />
                    <span className="text-xs">Tablet</span>
                    <span className="text-xs text-gray-500">768px</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => simulateBreakpoint('lg')}
                    className="flex flex-col items-center py-4 space-y-2"
                  >
                    <Monitor size={24} />
                    <span className="text-xs">Desktop</span>
                    <span className="text-xs text-gray-500">1024px</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => simulateBreakpoint('xl')}
                    className="flex flex-col items-center py-4 space-y-2"
                  >
                    <Monitor size={24} />
                    <span className="text-xs">Large</span>
                    <span className="text-xs text-gray-500">1280px</span>
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Testes Automáticos</h3>
                  <Button
                    onClick={runResponsiveTests}
                    loading={running}
                  >
                    <Play size={16} className="mr-2" />
                    Executar Testes
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {responsiveTestCases.map((testCase) => (
                    <div key={testCase.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                        <Badge variant="info">{testCase.breakpoint}</Badge>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {testCase.tests.map((test, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Test Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Cenários de Teste Manual</h3>
                <div className="space-y-4">
                  {testScenarios.map((scenario) => (
                    <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                          <p className="text-sm text-gray-600">{scenario.description}</p>
                        </div>
                        <Badge variant={
                          scenario.userRole === 'admin' ? 'danger' :
                          scenario.userRole === 'hr' ? 'warning' :
                          scenario.userRole === 'manager' ? 'info' : 'default'
                        }>
                          {scenario.userRole}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Passos:</h5>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {scenario.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-600 font-medium">{index + 1}.</span>
                              <span>
                                <strong>{step.action}</strong> {step.target}
                                {step.input && <span className="text-blue-600"> → "{step.input}"</span>}
                                {step.wait && <span className="text-orange-600"> (aguardar {step.wait}ms)</span>}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Resultados Esperados:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {scenario.expectedResults.map((result, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle size={12} className="text-green-500" />
                              <span>{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
                  <div className="flex items-center space-x-2">
                    {testResults.length > 0 && (
                      <Button
                        variant="secondary"
                        onClick={exportResults}
                      >
                        <Download size={16} className="mr-2" />
                        Exportar
                      </Button>
                    )}
                  </div>
                </div>

                {testResults.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>Execute os testes para ver os resultados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result) => (
                      <div key={result.scenarioId} className={`p-3 rounded-lg border ${
                        result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.passed ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                            <span className="font-medium">{result.scenarioId}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.duration}ms
                          </div>
                        </div>
                        
                        {result.errors.length > 0 && (
                          <div className="space-y-1">
                            {result.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-700 flex items-start space-x-1">
                                <Bug size={12} className="mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};