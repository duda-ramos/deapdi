import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FormAssignmentService,
  AssignmentPermission
} from '../../services/formAssignment';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';

interface FormAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
  formType: 'performance' | 'mental_health';
  onSuccess: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  team_id?: string;
  manager_id?: string;
}

const FormAssignmentModal: React.FC<FormAssignmentModalProps> = ({
  isOpen,
  onClose,
  formId,
  formTitle,
  formType,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<'individual' | 'multiple' | 'all'>('individual');
  const [dueDate, setDueDate] = useState('');
  const [basicPermission, setBasicPermission] = useState<AssignmentPermission | null>(null);
  const [assignmentPermission, setAssignmentPermission] = useState<AssignmentPermission | null>(null);
  const [checkingAssignmentPermission, setCheckingAssignmentPermission] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAssignableUsers();
      checkPermissions();
    }
  }, [isOpen, user, formType]);

  useEffect(() => {
    if (!isOpen) {
      setAssignmentPermission(null);
      setCheckingAssignmentPermission(false);
      setBasicPermission(null);
    }
  }, [isOpen]);

  const loadAssignableUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await FormAssignmentService.getAssignableUsers(
        user.id,
        user.role,
        formType
      );

      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setError(result.error || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (!user) return;

    try {
      // Use basic permission check for initial modal access
      const permission = FormAssignmentService.checkBasicAssignmentPermission(
        user.role,
        formType
      );
      setBasicPermission(permission);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  useEffect(() => {
    if (!user || !isOpen) return;
    if (!basicPermission || !basicPermission.canAssign) return;

    if (selectedUsers.length === 0) {
      setAssignmentPermission(null);
      setCheckingAssignmentPermission(false);
      return;
    }

    let isSubscribed = true;
    setAssignmentPermission(null);
    setCheckingAssignmentPermission(true);

    FormAssignmentService.checkAssignmentPermission(
      user.role,
      formType,
      selectedUsers,
      user.id
    )
      .then(result => {
        if (isSubscribed) {
          setAssignmentPermission(result);
        }
      })
      .catch(error => {
        console.error('Error validating assignment permissions:', error);
        if (isSubscribed) {
          setAssignmentPermission({
            canAssign: false,
            canViewResults: false,
            allowedUsers: [],
            reason: 'Não foi possível validar as permissões para os usuários selecionados'
          });
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setCheckingAssignmentPermission(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [user?.id, user?.role, isOpen, basicPermission, selectedUsers, formType]);

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleAssignmentTypeChange = (type: 'individual' | 'multiple' | 'all') => {
    setAssignmentType(type);
    if (type === 'all') {
      setSelectedUsers(users.map(u => u.id));
    } else if (type === 'individual') {
      setSelectedUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      setError('');

      // Validate permissions with selected users before creating assignment
      const permissionCheck = assignmentPermission?.allowedUsers?.length === selectedUsers.length
        ? assignmentPermission
        : await FormAssignmentService.checkAssignmentPermission(
            user.role,
            formType,
            selectedUsers,
            user.id
          );

      if (!permissionCheck?.canAssign) {
        setError(
          permissionCheck?.reason ||
            'Você não tem permissão para atribuir este formulário para os usuários selecionados'
        );
        return;
      }

      // Log de auditoria
      await FormAssignmentService.logDataAccess(
        user.id,
        formType,
        'assign',
        `Atribuindo formulário "${formTitle}" para ${selectedUsers.length} usuário(s)`
      );

      const result = await FormAssignmentService.createAssignment(
        formId,
        user.id,
        selectedUsers,
        assignmentType,
        formType,
        dueDate || undefined
      );

      if (result.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(result.error || 'Erro ao criar atribuição');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Erro ao criar atribuição');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setAssignmentType('individual');
    setDueDate('');
    setError('');
    setAssignmentPermission(null);
    setCheckingAssignmentPermission(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!basicPermission) {
    return null;
  }

  if (!basicPermission.canAssign) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Acesso Negado" size="md">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Permissão Insuficiente
          </h3>
          <p className="text-gray-600 mb-4">
            {basicPermission.reason || 'Você não tem permissão para atribuir este tipo de formulário.'}
          </p>
          <Button onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Atribuir Formulário - ${formTitle}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Privacy Notice */}
        <div className={`p-4 rounded-lg border ${
          formType === 'mental_health' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <Shield className={`mt-1 ${
              formType === 'mental_health' ? 'text-red-600' : 'text-blue-600'
            }`} size={20} />
            <div>
              <h4 className={`font-medium ${
                formType === 'mental_health' ? 'text-red-900' : 'text-blue-900'
              } mb-2`}>
                {formType === 'mental_health' ? 'Dados Confidenciais' : 'Confidencialidade'}
              </h4>
              <p className={`text-sm ${
                formType === 'mental_health' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {formType === 'mental_health' 
                  ? 'Este formulário contém dados de saúde mental. Apenas você e o respondente terão acesso aos resultados. Dados nunca serão compartilhados com gestores ou administradores.'
                  : 'Os resultados deste formulário serão visíveis apenas para você e o respondente. Dados de performance podem ser utilizados para relatórios gerenciais anonimizados.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Atribuição
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: 'individual',
                label: 'Individual',
                description: 'Selecionar usuários específicos',
                icon: <UserCheck size={20} />
              },
              {
                value: 'multiple',
                label: 'Múltipla',
                description: 'Selecionar vários usuários',
                icon: <Users size={20} />
              },
              {
                value: 'all',
                label: 'Todos',
                description: 'Atribuir para todos os usuários',
                icon: <UserPlus size={20} />
              }
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleAssignmentTypeChange(type.value as any)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assignmentType === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {type.icon}
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* User Selection */}
        {assignmentType !== 'all' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Selecionar Usuários
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedUsers.length === users.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={(checked) => handleUserSelection(user.id, checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.position}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {user.email}
                  </Badge>
                </label>
              ))}
            </div>

            {checkingAssignmentPermission && selectedUsers.length > 0 && (
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Verificando permissões para os usuários selecionados...
              </div>
            )}

            {assignmentPermission && !assignmentPermission.canAssign && selectedUsers.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="mt-0.5" size={16} />
                  <span>
                    {assignmentPermission.reason ||
                      'Você não tem permissão para atribuir este formulário para os usuários selecionados.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Limite (Opcional)
          </label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Resumo da Atribuição</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Formulário:</strong> {formTitle}</p>
            <p><strong>Tipo:</strong> {formType === 'mental_health' ? 'Saúde Mental' : 'Performance'}</p>
            <p><strong>Usuários selecionados:</strong> {selectedUsers.length}</p>
            {dueDate && (
              <p><strong>Data limite:</strong> {new Date(dueDate).toLocaleString('pt-BR')}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" size={16} />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              selectedUsers.length === 0 ||
              checkingAssignmentPermission ||
              (assignmentPermission && !assignmentPermission.canAssign)
            }
          >
            {loading ? (
              <>
                <Clock className="mr-2 animate-spin" size={16} />
                Atribuindo...
              </>
            ) : (
              <>
                <Users size={16} className="mr-2" />
                Atribuir para {selectedUsers.length} usuário(s)
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FormAssignmentModal;