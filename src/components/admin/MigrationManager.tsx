import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { migrationService, Migration, MigrationStatus } from '../../services/migrations';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export const MigrationManager: React.FC = () => {
  const { user } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [definedMigrations, setDefinedMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMigrations, setSelectedMigrations] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadMigrationData();
    }
  }, [user]);

  const loadMigrationData = async () => {
    try {
      setLoading(true);
      
      // Initialize migration system if needed
      await migrationService.initializeMigrationSystem();
      
      // Get current status
      const [status, defined] = await Promise.all([
        migrationService.getMigrationStatus(),
        Promise.resolve(migrationService.getDefinedMigrations())
      ]);
      
      setMigrationStatus(status);
      setDefinedMigrations(defined);
    } catch (error) {
      console.error('Error loading migration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMigrations = async () => {
    if (selectedMigrations.length === 0) return;

    try {
      setApplying(true);
      
      const migrationsToApply = definedMigrations.filter(m => 
        selectedMigrations.includes(m.version)
      );
      
      const result = await migrationService.applyPendingMigrations(migrationsToApply);
      
      console.log('Migration result:', result);
      
      setShowConfirmModal(false);
      setSelectedMigrations([]);
      
      // Reload status
      await loadMigrationData();
    } catch (error) {
      console.error('Error applying migrations:', error);
    } finally {
      setApplying(false);
    }
  };

  const handleResetMigrations = async () => {
    if (!import.meta.env.DEV) {
      alert('Reset only allowed in development mode');
      return;
    }

    if (confirm('ATENÇÃO: Isso irá resetar o estado de todas as migrações. Continuar?')) {
      try {
        await migrationService.resetMigrationState();
        await loadMigrationData();
      } catch (error) {
        console.error('Error resetting migrations:', error);
      }
    }
  };

  const getPendingMigrations = () => {
    const appliedVersions = new Set(migrationStatus.map(s => s.version));
    return definedMigrations.filter(m => !appliedVersions.has(m.version));
  };

  const getStatusIcon = (applied: boolean) => {
    return applied ? (
      <CheckCircle size={16} className="text-green-500" />
    ) : (
      <Clock size={16} className="text-yellow-500" />
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Apenas administradores podem gerenciar migrações.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando status das migrações...</p>
        </div>
      </Card>
    );
  }

  const pendingMigrations = getPendingMigrations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Database className="mr-2 text-blue-500" size={24} />
            Gerenciador de Migrações
          </h2>
          <p className="text-gray-600">Controle de versão do banco de dados</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={loadMigrationData}
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          {import.meta.env.DEV && (
            <Button
              variant="danger"
              onClick={handleResetMigrations}
            >
              Reset (DEV)
            </Button>
          )}
        </div>
      </div>

      {/* Migration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{migrationStatus.length}</div>
              <div className="text-sm text-gray-600">Aplicadas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{pendingMigrations.length}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{definedMigrations.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {migrationStatus.length > 0 ? 
                  new Date(migrationStatus[0]?.applied_at || '').toLocaleDateString('pt-BR') : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">Última</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Migrations */}
      {pendingMigrations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-900">
              ⚠️ Migrações Pendentes
            </h3>
            <Button
              onClick={() => {
                setSelectedMigrations(pendingMigrations.map(m => m.version));
                setShowConfirmModal(true);
              }}
              disabled={pendingMigrations.length === 0}
            >
              <Play size={16} className="mr-2" />
              Aplicar Todas
            </Button>
          </div>
          
          <div className="space-y-3">
            {pendingMigrations.map((migration) => (
              <div key={migration.version} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedMigrations.includes(migration.version)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMigrations(prev => [...prev, migration.version]);
                      } else {
                        setSelectedMigrations(prev => prev.filter(v => v !== migration.version));
                      }
                    }}
                    className="rounded"
                  />
                  <Clock size={16} className="text-yellow-500" />
                  <div>
                    <span className="font-medium text-yellow-900">{migration.version}</span>
                    <p className="text-sm text-yellow-700">{migration.description}</p>
                  </div>
                </div>
                <Badge variant="warning">Pendente</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Applied Migrations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Migrações</h3>
        
        {migrationStatus.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Database size={32} className="mx-auto mb-2 text-gray-300" />
            <p>Nenhuma migração registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {migrationStatus.map((status) => (
              <div key={status.version} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <div>
                    <span className="font-medium text-green-900">{status.version}</span>
                    <p className="text-sm text-green-700">{status.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success">Aplicada</Badge>
                  {status.applied_at && (
                    <p className="text-xs text-green-600 mt-1">
                      {new Date(status.applied_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Aplicação de Migrações"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="text-yellow-500" size={20} />
              <h4 className="font-medium text-yellow-900">Atenção</h4>
            </div>
            <p className="text-sm text-yellow-800">
              Você está prestes a aplicar {selectedMigrations.length} migração(ões) ao banco de dados.
              Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Migrações a serem aplicadas:</h4>
            {selectedMigrations.map((version) => {
              const migration = definedMigrations.find(m => m.version === version);
              return (
                <div key={version} className="p-2 bg-gray-50 rounded">
                  <span className="font-medium">{version}</span>
                  <p className="text-sm text-gray-600">{migration?.description}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">⚠️ Recomendações</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Faça backup do banco antes de aplicar</li>
              <li>• Teste em ambiente de desenvolvimento primeiro</li>
              <li>• Verifique se não há usuários ativos no sistema</li>
              <li>• Tenha um plano de rollback preparado</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={applying}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyMigrations}
              loading={applying}
            >
              <Play size={16} className="mr-2" />
              Aplicar Migrações
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};