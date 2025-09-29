import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notifications';
import { PDI as PDIType, Profile } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

const PDI: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [pdis, setPdis] = useState<PDIType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPDI, setSelectedPDI] = useState<PDIType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    mentor_id: ''
  });

  useEffect(() => {
    if (user) {
      loadPDIs();
      loadProfiles();
    }
  }, [user]);

  const loadPDIs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await databaseService.getPDIs(user.id);
      setPdis(data || []);
    } catch (error) {
      console.error('Erro ao carregar PDIs:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar PDIs');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await databaseService.getProfiles({ role: 'manager' });
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const handleCreatePDI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await databaseService.createPDI({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        mentor_id: formData.mentor_id || null,
        profile_id: user.id,
        created_by: user.id,
        status: 'pending',
        points: 100
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        mentor_id: ''
      });
      loadPDIs();
    } catch (error) {
      console.error('Erro ao criar PDI:', error);
    }
  };

  const handleUpdateStatus = async (pdiId: string, newStatus: PDIType['status']) => {
    try {
      const pdi = pdis.find(p => p.id === pdiId);
      
      await databaseService.updatePDI(pdiId, { 
        status: newStatus,
        validated_by: newStatus === 'validated' ? user?.id : null
      });
      
      // Send notifications based on status change
      if (pdi && user) {
        if (newStatus === 'validated') {
          await notificationService.notifyPDIApproved(pdi.profile_id, pdi.title, pdiId);
        } else if (newStatus === 'rejected') {
          await notificationService.notifyPDIRejected(pdi.profile_id, pdi.title, pdiId);
        }
      }
      
      // If completed or validated, award points
      if (newStatus === 'completed' || newStatus === 'validated') {
        if (pdi && user) {
          await databaseService.updateProfile(user.id, {
            points: user.points + pdi.points
          });
          
          // Check for new achievements
          setTimeout(() => {
            checkAchievements();
          }, 1000);
        }
      }
      
      loadPDIs();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusColor = (status: PDIType['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'validated':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: PDIType['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in-progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluído';
      case 'validated':
        return 'Validado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: PDIType['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'in-progress':
        return <AlertCircle size={16} />;
      case 'completed':
      case 'validated':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const canUpdateStatus = (pdi: PDIType) => {
    if (!user) return false;
    
    // User can mark their own PDIs as completed
    if (pdi.profile_id === user.id && pdi.status === 'in-progress') {
      return true;
    }
    
    // Managers/HR/Admin can validate completed PDIs
    if ((user.role === 'manager' || user.role === 'hr' || user.role === 'admin') && pdi.status === 'completed') {
      return true;
    }
    
    return false;
  };

  const mentorOptions = profiles.map(profile => ({
    value: profile.id,
    label: profile.name
  }));

  if (loading) {
    return <LoadingScreen message="Carregando PDIs..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDI - Plano de Desenvolvimento Individual</h1>
          <p className="text-gray-600 mt-1">Gerencie seus objetivos de desenvolvimento</p>
        </div>
        <ErrorMessage error={error} onRetry={loadPDIs} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDI - Plano de Desenvolvimento Individual</h1>
          <p className="text-gray-600 mt-1">Gerencie seus objetivos de desenvolvimento</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Novo PDI
        </Button>
      </div>

      {/* PDI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total', count: pdis.length, color: 'bg-blue-500' },
          { label: 'Pendentes', count: pdis.filter(p => p.status === 'pending').length, color: 'bg-yellow-500' },
          { label: 'Em Progresso', count: pdis.filter(p => p.status === 'in-progress').length, color: 'bg-blue-500' },
          { label: 'Concluídos', count: pdis.filter(p => p.status === 'completed' || p.status === 'validated').length, color: 'bg-green-500' }
        ].map((stat) => (
          <Card key={stat.label} className="p-3 md:p-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`} />
              <div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* PDI List */}
      {pdis.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum PDI encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando seu primeiro Plano de Desenvolvimento Individual.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Criar Primeiro PDI
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {pdis.map((pdi, index) => (
            <motion.div
              key={pdi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 md:p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {pdi.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {pdi.description}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(pdi.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(pdi.status)}
                      <span>{getStatusLabel(pdi.status)}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Prazo: {new Date(pdi.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>

                  {pdi.mentor && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User size={16} className="mr-2" />
                      <span>Mentor: {pdi.mentor.name}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">+{pdi.points}</span> pontos
                    </div>
                    
                    {canUpdateStatus(pdi) && (
                      <div className="flex flex-wrap gap-2">
                        {pdi.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(pdi.id, 'in-progress')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {pdi.status === 'in-progress' && pdi.profile_id === user?.id && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(pdi.id, 'completed')}
                          >
                            Concluir
                          </Button>
                        )}
                        {pdi.status === 'completed' && (user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(pdi.id, 'validated')}
                          >
                            Validar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create PDI Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Novo PDI"
        size="lg"
      >
        <form onSubmit={handleCreatePDI} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Desenvolver habilidades em React"
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva detalhadamente o objetivo e como pretende alcançá-lo..."
            rows={4}
            required
          />

          <Input
            label="Prazo"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />

          <Select
            label="Mentor (Opcional)"
            value={formData.mentor_id}
            onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
            options={mentorOptions}
            placeholder="Selecione um mentor"
          />

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informações sobre PDI</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Este PDI será criado com status "Pendente"</li>
              <li>• Você ganhará 100 pontos ao concluir</li>
              <li>• Um gestor precisará validar a conclusão</li>
              <li>• O mentor pode acompanhar seu progresso</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar PDI
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PDI;