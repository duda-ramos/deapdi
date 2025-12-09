import React, { useState } from 'react';
import { DollarSign, Calendar, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { databaseService } from '../../services/database';
import { Profile } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { getAvatarUrl, handleImageError } from '../../utils/images';

interface AddSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  selectedProfileId?: string;
  onSuccess: () => void;
}

export const AddSalaryModal: React.FC<AddSalaryModalProps> = ({
  isOpen,
  onClose,
  profiles,
  selectedProfileId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    profile_id: selectedProfileId || '',
    amount: '',
    position: '',
    effective_date: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (selectedProfileId) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      setFormData(prev => ({
        ...prev,
        profile_id: selectedProfileId,
        position: profile?.position || ''
      }));
    }
  }, [selectedProfileId, profiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.profile_id) {
      setError('Selecione um colaborador');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    if (!formData.position.trim()) {
      setError('Cargo é obrigatório');
      return;
    }

    if (!formData.effective_date) {
      setError('Data efetiva é obrigatória');
      return;
    }

    try {
      setLoading(true);

      await databaseService.addSalaryEntry({
        profile_id: formData.profile_id,
        amount: parseFloat(formData.amount),
        position: formData.position.trim(),
        reason: formData.reason.trim() || 'Ajuste salarial',
        effective_date: formData.effective_date
      });

      // Reset form
      setFormData({
        profile_id: '',
        amount: '',
        position: '',
        effective_date: '',
        reason: ''
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding salary entry:', error);
      setError(error instanceof Error ? error.message : 'Erro ao adicionar histórico salarial');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      profile_id: '',
      amount: '',
      position: '',
      effective_date: '',
      reason: ''
    });
    setError('');
    onClose();
  };

  const profileOptions = profiles.map(profile => ({
    value: profile.id,
    label: `${profile.name} - ${profile.position}`
  }));

  const selectedProfile = profiles.find(p => p.id === formData.profile_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Histórico Salarial"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={16} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Colaborador */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <Briefcase className="mr-2" size={16} />
            Colaborador
          </h4>
          <Select
            label="Selecionar Colaborador"
            value={formData.profile_id}
            onChange={(e) => {
              const profile = profiles.find(p => p.id === e.target.value);
              setFormData({
                ...formData,
                profile_id: e.target.value,
                position: profile?.position || ''
              });
            }}
            options={profileOptions}
            placeholder="Escolha o colaborador"
            required
            disabled={!!selectedProfileId}
          />
          
          {selectedProfile && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <img
                  src={getAvatarUrl(selectedProfile.avatar_url, selectedProfile.name)}
                  alt={selectedProfile.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => handleImageError(e, selectedProfile.name)}
                />
                <div>
                  <p className="font-medium text-gray-900">{selectedProfile.name}</p>
                  <p className="text-sm text-gray-600">{selectedProfile.email}</p>
                  <p className="text-sm text-gray-600">Nível: {selectedProfile.level}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informações Salariais */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <DollarSign className="mr-2" size={16} />
            Informações Salariais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Ex: 5000.00"
              required
            />

            <Input
              label="Data Efetiva"
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              helperText="Selecione o primeiro dia do mês para representar mês/ano"
              required
            />
          </div>

          <Input
            label="Cargo na Data do Ajuste"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Ex: Desenvolvedor Sênior"
            required
          />
        </div>

        {/* Motivo do Ajuste */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
            <FileText className="mr-2" size={16} />
            Detalhes do Ajuste
          </h4>
          <Textarea
            label="Motivo do Ajuste (Opcional)"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Ex: Promoção por mérito, Ajuste de mercado, Mudança de cargo..."
            rows={3}
          />
        </div>

        {/* Informações Importantes */}
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">ℹ️ Informações Importantes</h4>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• O histórico salarial é confidencial e visível apenas para RH/Admin</li>
            <li>• O colaborador poderá ver seu próprio histórico no perfil</li>
            <li>• Use o primeiro dia do mês para representar o período (ex: 01/01/2024)</li>
            <li>• O motivo do ajuste ajuda no controle e auditoria</li>
            <li>• Esta ação será registrada nos logs do sistema</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <DollarSign size={16} className="mr-2" />
            Adicionar ao Histórico
          </Button>
        </div>
      </form>
    </Modal>
  );
};