import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Sun,
  Coffee,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { CalendarRequest, hrCalendarService } from '../../services/hrCalendar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';

interface ApprovalQueueProps {
  requests: CalendarRequest[];
  onApprove: (requestId: string, comments?: string) => void;
  onReject: (requestId: string, reason: string) => void;
  userRole: string;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  requests,
  onApprove,
  onReject,
  userRole
}) => {
  const [selectedRequest, setSelectedRequest] = useState<CalendarRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    await onApprove(selectedRequest.id, approvalComments);
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setApprovalComments('');
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    
    await onReject(selectedRequest.id, rejectionReason);
    setShowRejectionModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const getRequestIcon = (type: string) => {
    return type === 'ferias' ? (
      <Sun size={20} className="text-yellow-500" />
    ) : (
      <Coffee size={20} className="text-orange-500" />
    );
  };

  const getUrgencyLevel = (request: CalendarRequest): 'low' | 'medium' | 'high' => {
    const startDate = new Date(request.start_date);
    const today = new Date();
    const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (request.event_type === 'ferias') {
      if (daysUntil <= 45) return 'high';
      if (daysUntil <= 60) return 'medium';
      return 'low';
    } else {
      if (daysUntil <= 10) return 'high';
      if (daysUntil <= 20) return 'medium';
      return 'low';
    }
  };

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
    }
  };

  const getUrgencyLabel = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'Urgente';
      case 'medium': return 'Moderado';
      case 'low': return 'Normal';
    }
  };

  const canApprove = (request: CalendarRequest): boolean => {
    if (userRole === 'hr' || userRole === 'admin') return true;
    if (userRole === 'manager' && request.event_type === 'day_off') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="mr-2 text-blue-500" size={20} />
            Fila de Aprovações
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="danger">
              {requests.filter(r => getUrgencyLevel(r) === 'high').length} Urgentes
            </Badge>
            <Badge variant="warning">
              {requests.filter(r => getUrgencyLevel(r) === 'medium').length} Moderadas
            </Badge>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p>Nenhuma solicitação pendente</p>
            <p className="text-sm">Todas as solicitações foram processadas! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests
              .sort((a, b) => {
                // Sort by urgency first, then by creation date
                const urgencyA = getUrgencyLevel(a);
                const urgencyB = getUrgencyLevel(b);
                const urgencyOrder = { high: 3, medium: 2, low: 1 };
                
                if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
                  return urgencyOrder[urgencyB] - urgencyOrder[urgencyA];
                }
                
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              })
              .map((request) => {
                const urgency = getUrgencyLevel(request);
                const canApproveThis = canApprove(request);
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border-2 rounded-lg ${
                      urgency === 'high' ? 'border-red-200 bg-red-50' :
                      urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getRequestIcon(request.event_type)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {request.event_type === 'ferias' ? 'Solicitação de Férias' : 'Solicitação de Day Off'}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">{request.requester?.name}</span>
                            <Badge variant={getUrgencyColor(urgency)} size="sm">
                              {getUrgencyLabel(urgency)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {request.days_requested} dia{request.days_requested !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Período:</span>
                        <p className="font-medium">
                          {new Date(request.start_date).toLocaleDateString('pt-BR')} - {new Date(request.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Cargo:</span>
                        <p className="font-medium">{request.requester?.position}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Equipe:</span>
                        <p className="font-medium">{request.requester?.team?.name || 'Sem equipe'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-sm text-gray-600">Motivo:</span>
                      <p className="text-gray-900 mt-1">{request.reason}</p>
                    </div>

                    {canApproveThis && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectionModal(true);
                          }}
                        >
                          <XCircle size={14} className="mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApprovalModal(true);
                          }}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}

                    {!canApproveThis && (
                      <div className="text-center">
                        <Badge variant="info" size="sm">
                          {request.event_type === 'ferias' 
                            ? 'Aguardando aprovação do RH' 
                            : 'Aguardando aprovação do gestor'
                          }
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Aprovar Solicitação"
        size="md"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Aprovar {selectedRequest.event_type === 'ferias' ? 'Férias' : 'Day Off'}
              </h4>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Colaborador:</strong> {selectedRequest.requester?.name}</p>
                <p><strong>Período:</strong> {new Date(selectedRequest.start_date).toLocaleDateString('pt-BR')} - {new Date(selectedRequest.end_date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Dias:</strong> {selectedRequest.days_requested}</p>
                <p><strong>Motivo:</strong> {selectedRequest.reason}</p>
              </div>
            </div>
          )}

          <Textarea
            label="Comentários (Opcional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Adicione comentários sobre a aprovação..."
            rows={3}
          />

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">✅ Ao aprovar:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• O evento será adicionado automaticamente ao calendário</li>
              <li>• O colaborador receberá notificação de aprovação</li>
              <li>• O período ficará bloqueado para outros da equipe</li>
              <li>• A ação será registrada no histórico</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowApprovalModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmar Aprovação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Rejeitar Solicitação"
        size="md"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">
                Rejeitar {selectedRequest.event_type === 'ferias' ? 'Férias' : 'Day Off'}
              </h4>
              <div className="text-sm text-red-800 space-y-1">
                <p><strong>Colaborador:</strong> {selectedRequest.requester?.name}</p>
                <p><strong>Período:</strong> {new Date(selectedRequest.start_date).toLocaleDateString('pt-BR')} - {new Date(selectedRequest.end_date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Motivo:</strong> {selectedRequest.reason}</p>
              </div>
            </div>
          )}

          <Textarea
            label="Motivo da Rejeição *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explique o motivo da rejeição para o colaborador..."
            rows={4}
            required
          />

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Ao rejeitar:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• O colaborador receberá notificação com o motivo</li>
              <li>• A solicitação será marcada como rejeitada</li>
              <li>• O colaborador poderá fazer uma nova solicitação</li>
              <li>• A ação será registrada no histórico</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowRejectionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              <XCircle size={16} className="mr-2" />
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};