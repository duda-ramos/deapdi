import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Database,
  Shield,
  Bell,
  Palette,
  Users,
  BarChart3,
  FileText,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { MigrationManager } from '../components/admin/MigrationManager';
import CompetencyManager from '../components/admin/CompetencyManager';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';

const Administration: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('system');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState({
    company_name: 'TalentFlow Corp',
    system_url: 'https://talentflow.empresa.com',
    timezone: 'America/Sao_Paulo',
    default_language: 'pt-BR',
    admin_email: 'admin@empresa.com',
    maintenance_mode: false
  });
  const [configLoading, setConfigLoading] = useState(false);

  const tabs = [
    { id: 'system', label: 'Sistema', icon: <Settings size={16} /> },
    { id: 'database', label: 'Banco de Dados', icon: <Database size={16} /> },
    { id: 'migrations', label: 'Migrações', icon: <RefreshCw size={16} /> },
    { id: 'competencies', label: 'Competências', icon: <Target size={16} /> },
    { id: 'security', label: 'Segurança', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={16} /> },
    { id: 'appearance', label: 'Aparência', icon: <Palette size={16} /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText size={16} /> }
  ];

  useEffect(() => {
    loadSystemStats();
    loadSystemConfig();
  }, []);

  const loadSystemStats = async () => {
    try {
      const [profiles, pdis] = await Promise.all([
        databaseService.getProfiles(),
        supabase.from('pdis').select('id', { count: 'exact', head: true })
      ]);

      setSystemStats({
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.filter(p => p.status === 'active').length || 0,
        totalPDIs: pdis.count || 0,
        systemUptime: '99.9%', // This would come from monitoring service
        lastBackup: new Date().toISOString().split('T')[0] + ' 03:00:00'
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      setSystemStats({
        totalUsers: 0,
        activeUsers: 0,
        totalPDIs: 0,
        systemUptime: 'N/A',
        lastBackup: 'N/A'
      });
    }
  };

  const loadSystemConfig = async () => {
    try {
      // In a real implementation, this would load from a system_config table
      const savedConfig = localStorage.getItem('system_config');
      if (savedConfig) {
        setSystemConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setConfigLoading(true);
      const { adminService } = await import('../services/admin');
      await adminService.updateSystemConfig(systemConfig);
      
      // Create audit log
      if (user) {
        await adminService.createAuditLog(
          user.id,
          'Configuração do sistema atualizada',
          'system_config',
          undefined,
          { updated_fields: Object.keys(systemConfig) }
        );
      }
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setConfigLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar a área de administração.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
          <p className="text-gray-600 mt-1">Configurações avançadas do sistema</p>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-lg font-bold text-gray-900">{systemStats.systemUptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-lg font-bold text-gray-900">{systemStats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Usuários</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-lg font-bold text-gray-900">{systemStats.activeUsers}</div>
              <div className="text-sm text-gray-600">Usuários Ativos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-lg font-bold text-gray-900">{systemStats.totalPDIs}</div>
              <div className="text-sm text-gray-600">PDIs Criados</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-lg font-bold text-gray-900">15/01</div>
              <div className="text-sm text-gray-600">Último Backup</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedTab === tab.id
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

      {/* System Tab */}
      {selectedTab === 'system' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Nome da Empresa"
                  defaultValue="TalentFlow Corp"
                />
                <Input
                  label="URL do Sistema"
                  defaultValue="https://talentflow.empresa.com"
                />
                <Select
                  label="Fuso Horário"
                  defaultValue="America/Sao_Paulo"
                  options={[
                    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
                    { value: 'America/New_York', label: 'Nova York (GMT-5)' },
                    { value: 'Europe/London', label: 'Londres (GMT+0)' }
                  ]}
                />
              </div>
              <div className="space-y-4">
                <Select
                  label="Idioma Padrão"
                  defaultValue="pt-BR"
                  options={[
                    { value: 'pt-BR', label: 'Português (Brasil)' },
                    { value: 'en-US', label: 'English (US)' },
                    { value: 'es-ES', label: 'Español' }
                  ]}
                />
                <Input
                  label="Email do Administrador"
                  type="email"
                  defaultValue="admin@empresa.com"
                />
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="maintenance" className="rounded" />
                  <label htmlFor="maintenance" className="text-sm text-gray-700">
                    Modo de Manutenção
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button>Salvar Configurações</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="secondary" className="flex items-center justify-center space-x-2">
                <RefreshCw size={16} />
                <span>Reiniciar Cache</span>
              </Button>
              <Button variant="secondary" className="flex items-center justify-center space-x-2">
                <Download size={16} />
                <span>Exportar Logs</span>
              </Button>
              <Button variant="danger" className="flex items-center justify-center space-x-2">
                <Trash2 size={16} />
                <span>Limpar Dados Temporários</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Database Tab */}
      {selectedTab === 'database' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Status do Banco de Dados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">Online</div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2.3GB</div>
                <div className="text-sm text-gray-600">Tamanho</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">156ms</div>
                <div className="text-sm text-gray-600">Latência Média</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Tabelas Principais</h4>
              <div className="space-y-2">
                {[
                  { name: 'profiles', records: 156, size: '45MB' },
                  { name: 'pdis', records: 234, size: '12MB' },
                  { name: 'competencies', records: 1248, size: '8MB' },
                  { name: 'achievements', records: 89, size: '3MB' },
                  { name: 'notifications', records: 2341, size: '18MB' }
                ].map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{table.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{table.records} registros</span>
                    </div>
                    <Badge variant="default">{table.size}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Backup e Restauração</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Backup Automático</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Último backup:</span>
                    <span className="text-sm font-medium">{systemStats.lastBackup}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frequência:</span>
                    <Badge variant="success">Diário</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retenção:</span>
                    <span className="text-sm font-medium">30 dias</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Ações</h4>
                <div className="space-y-2">
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setShowBackupModal(true)}
                  >
                    <Download size={16} className="mr-2" />
                    Criar Backup Manual
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <Upload size={16} className="mr-2" />
                    Restaurar Backup
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Migrations Tab */}
      {selectedTab === 'migrations' && (
        <MigrationManager />
      )}

      {/* Competencies Tab */}
      {selectedTab === 'competencies' && (
        <CompetencyManager />
      )}

      {/* Security Tab */}
      {selectedTab === 'security' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações de Segurança</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Políticas de Senha</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Comprimento Mínimo"
                    type="number"
                    defaultValue="8"
                  />
                  <Input
                    label="Validade (dias)"
                    type="number"
                    defaultValue="90"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="uppercase" className="rounded" defaultChecked />
                    <label htmlFor="uppercase" className="text-sm text-gray-700">
                      Exigir letras maiúsculas
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="numbers" className="rounded" defaultChecked />
                    <label htmlFor="numbers" className="text-sm text-gray-700">
                      Exigir números
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="symbols" className="rounded" />
                    <label htmlFor="symbols" className="text-sm text-gray-700">
                      Exigir símbolos especiais
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Controle de Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tentativas de Login"
                    type="number"
                    defaultValue="5"
                  />
                  <Input
                    label="Bloqueio (minutos)"
                    type="number"
                    defaultValue="15"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="2fa" className="rounded" />
                    <label htmlFor="2fa" className="text-sm text-gray-700">
                      Autenticação de dois fatores obrigatória
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="session" className="rounded" defaultChecked />
                    <label htmlFor="session" className="text-sm text-gray-700">
                      Expirar sessões inativas (24h)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button>Salvar Configurações</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Log de Auditoria</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {React.useMemo(() => {
                const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
                
                React.useEffect(() => {
                  const loadLogs = async () => {
                    try {
                      const { adminService } = await import('../services/admin');
                      const logs = await adminService.getAuditLogs(10);
                      setAuditLogs(logs);
                    } catch (error) {
                      console.error('Error loading audit logs:', error);
                    }
                  };
                  loadLogs();
                }, []);
                
                return auditLogs;
              }, []).map((log, index) => (
                <div key={log.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{log.action}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      por {log.user?.email || 'Sistema'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">{log.ip_address}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {selectedTab === 'notifications' && (
        <Card className="p-8 text-center">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configurações de Notificações
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento...
          </p>
        </Card>
      )}

      {selectedTab === 'appearance' && (
        <Card className="p-8 text-center">
          <Palette size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Personalização da Aparência
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento...
          </p>
        </Card>
      )}

      {selectedTab === 'reports' && (
        <Card className="p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Relatórios Administrativos
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento...
          </p>
        </Card>
      )}

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Criar Backup Manual"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Deseja criar um backup manual do sistema? Este processo pode levar alguns minutos.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="full-backup" className="rounded" defaultChecked />
              <label htmlFor="full-backup" className="text-sm text-gray-700">
                Backup completo (dados + configurações)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="compress" className="rounded" defaultChecked />
              <label htmlFor="compress" className="text-sm text-gray-700">
                Comprimir arquivo
              </label>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informações do Backup</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tamanho estimado: ~2.3GB</li>
              <li>• Tempo estimado: 5-10 minutos</li>
              <li>• Formato: .sql.gz</li>
              <li>• Localização: /backups/manual/</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowBackupModal(false)}
            >
              Cancelar
            </Button>
            <Button>
              Criar Backup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Administration;