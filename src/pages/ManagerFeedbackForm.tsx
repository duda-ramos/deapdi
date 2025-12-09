import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  User, 
  Star,
  MessageSquare,
  Target,
  TrendingUp,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { getAvatarUrl, handleImageError, DEFAULT_AVATAR_PLACEHOLDER } from '../utils/images';

interface Subordinate {
  id: string;
  name: string;
  position: string;
  avatar_url?: string;
}

interface FeedbackResponse {
  subordinate_id: string;
  subordinate_name: string;
  ratings: {
    performance: number;
    communication: number;
    teamwork: number;
    leadership: number;
    initiative: number;
  };
  strengths: string;
  areas_for_improvement: string;
  goals_achieved: string;
  goals_next_period: string;
  additional_comments: string;
  overall_rating: number;
  submitted_at?: string;
}

const ManagerFeedbackForm: React.FC = () => {
  const { user } = useAuth();
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [responses, setResponses] = useState<Map<string, FeedbackResponse>>(new Map());
  const [currentSubordinate, setCurrentSubordinate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user && user.role === 'manager') {
      loadSubordinates();
    }
  }, [user]);

  const loadSubordinates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Mock data - in real implementation, this would come from API
      const mockSubordinates: Subordinate[] = [
        {
          id: '1',
          name: 'João Silva',
          position: 'Desenvolvedor Pleno',
          avatar_url: undefined
        },
        {
          id: '2',
          name: 'Maria Santos',
          position: 'Designer UX/UI',
          avatar_url: undefined
        },
        {
          id: '3',
          name: 'Pedro Costa',
          position: 'Analista de Qualidade',
          avatar_url: undefined
        }
      ];

      setSubordinates(mockSubordinates);
      
      if (mockSubordinates.length > 0) {
        setCurrentSubordinate(mockSubordinates[0].id);
      }
    } catch (error) {
      console.error('Error loading subordinates:', error);
      setError('Erro ao carregar subordinados');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentResponse = (): FeedbackResponse => {
    const subordinate = subordinates.find(s => s.id === currentSubordinate);
    if (!subordinate) {
      return {
        subordinate_id: currentSubordinate,
        subordinate_name: '',
        ratings: {
          performance: 0,
          communication: 0,
          teamwork: 0,
          leadership: 0,
          initiative: 0
        },
        strengths: '',
        areas_for_improvement: '',
        goals_achieved: '',
        goals_next_period: '',
        additional_comments: '',
        overall_rating: 0
      };
    }

    return responses.get(currentSubordinate) || {
      subordinate_id: currentSubordinate,
      subordinate_name: subordinate.name,
      ratings: {
        performance: 0,
        communication: 0,
        teamwork: 0,
        leadership: 0,
        initiative: 0
      },
      strengths: '',
      areas_for_improvement: '',
      goals_achieved: '',
      goals_next_period: '',
      additional_comments: '',
      overall_rating: 0
    };
  };

  const updateResponse = (updates: Partial<FeedbackResponse>) => {
    const current = getCurrentResponse();
    const updated = { ...current, ...updates };
    
    // Calculate overall rating
    const ratings = updated.ratings;
    const averageRating = (ratings.performance + ratings.communication + ratings.teamwork + ratings.leadership + ratings.initiative) / 5;
    updated.overall_rating = Math.round(averageRating * 10) / 10;

    setResponses(new Map(responses.set(currentSubordinate, updated)));
  };

  const handleRatingChange = (category: keyof FeedbackResponse['ratings'], value: number) => {
    const current = getCurrentResponse();
    updateResponse({
      ratings: {
        ...current.ratings,
        [category]: value
      }
    });
  };

  const handleTextChange = (field: keyof Omit<FeedbackResponse, 'subordinate_id' | 'subordinate_name' | 'ratings' | 'overall_rating' | 'submitted_at'>, value: string) => {
    updateResponse({ [field]: value });
  };

  const saveResponse = async () => {
    try {
      setSaving(true);
      
      // In real implementation, this would save to the database
      const current = getCurrentResponse();
      const updated = { ...current, submitted_at: new Date().toISOString() };
      
      setResponses(new Map(responses.set(currentSubordinate, updated)));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error saving response:', error);
      setError('Erro ao salvar resposta');
    } finally {
      setSaving(false);
    }
  };

  const getCompletionStatus = (subordinateId: string) => {
    const response = responses.get(subordinateId);
    if (!response) return { completed: false, percentage: 0 };

    const fields = [
      response.ratings.performance,
      response.ratings.communication,
      response.ratings.teamwork,
      response.ratings.leadership,
      response.ratings.initiative,
      response.strengths,
      response.areas_for_improvement,
      response.goals_achieved,
      response.goals_next_period
    ];

    const completedFields = fields.filter(field => field && field !== 0 && field !== '').length;
    const percentage = Math.round((completedFields / fields.length) * 100);

    return {
      completed: percentage === 100,
      percentage
    };
  };

  const getOverallProgress = () => {
    if (subordinates.length === 0) return 0;
    
    const totalProgress = subordinates.reduce((sum, sub) => {
      const status = getCompletionStatus(sub.id);
      return sum + status.percentage;
    }, 0);

    return Math.round(totalProgress / subordinates.length);
  };

  if (!user || user.role !== 'manager') {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas gestores podem acessar este formulário.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando formulário de feedback..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback do Gestor</h1>
          <p className="text-gray-600 mt-1">Avaliação individual dos subordinados</p>
        </div>
        <ErrorMessage error={error} onRetry={loadSubordinates} />
      </div>
    );
  }

  const currentResponse = getCurrentResponse();
  const currentSubordinateData = subordinates.find(s => s.id === currentSubordinate);
  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="mr-3 text-blue-500" size={28} />
            Feedback do Gestor
          </h1>
          <p className="text-gray-600 mt-1">Avaliação individual dos subordinados</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="info" className="flex items-center space-x-1">
            <TrendingUp size={14} />
            <span>{overallProgress}% Concluído</span>
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Progresso Geral</h3>
          <span className="text-sm text-gray-600">
            {subordinates.filter(s => getCompletionStatus(s.id).completed).length} de {subordinates.length} concluídos
          </span>
        </div>
        <ProgressBar progress={overallProgress} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subordinates.map((subordinate) => {
            const status = getCompletionStatus(subordinate.id);
            return (
              <div
                key={subordinate.id}
                onClick={() => setCurrentSubordinate(subordinate.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  currentSubordinate === subordinate.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={getAvatarUrl(subordinate.avatar_url, subordinate.name)}
                    alt={subordinate.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => handleImageError(e, subordinate.name)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{subordinate.name}</p>
                    <p className="text-sm text-gray-500 truncate">{subordinate.position}</p>
                  </div>
                  <div className="text-right">
                    {status.completed ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <div className="text-sm text-gray-600">{status.percentage}%</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Current Subordinate Form */}
      {currentSubordinateData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={getAvatarUrl(currentSubordinateData.avatar_url, currentSubordinateData.name)}
                alt={currentSubordinateData.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => handleImageError(e, currentSubordinateData.name)}
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{currentSubordinateData.name}</h3>
                <p className="text-gray-600">{currentSubordinateData.position}</p>
              </div>
            </div>
            <Badge variant={getCompletionStatus(currentSubordinate).completed ? 'success' : 'warning'}>
              {getCompletionStatus(currentSubordinate).completed ? 'Concluído' : 'Em Andamento'}
            </Badge>
          </div>

          <form className="space-y-6">
            {/* Ratings Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Avaliações</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'performance', label: 'Performance', icon: <Target size={20} /> },
                  { key: 'communication', label: 'Comunicação', icon: <MessageSquare size={20} /> },
                  { key: 'teamwork', label: 'Trabalho em Equipe', icon: <Users size={20} /> },
                  { key: 'leadership', label: 'Liderança', icon: <TrendingUp size={20} /> },
                  { key: 'initiative', label: 'Iniciativa', icon: <Star size={20} /> }
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {icon}
                      <label className="font-medium text-gray-700">{label}</label>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(key as keyof FeedbackResponse['ratings'], rating)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            currentResponse.ratings[key as keyof FeedbackResponse['ratings']] >= rating
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Star size={16} fill="currentColor" />
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentResponse.ratings[key as keyof FeedbackResponse['ratings']] === 0 
                        ? 'Não avaliado' 
                        : `${currentResponse.ratings[key as keyof FeedbackResponse['ratings']]}/5`
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Rating */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Avaliação Geral</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {currentResponse.overall_rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">/ 5.0</span>
                </div>
              </div>
              <ProgressBar 
                progress={(currentResponse.overall_rating / 5) * 100} 
                className="mt-2"
              />
            </div>

            {/* Text Responses */}
            <div className="space-y-4">
              <Textarea
                label="Pontos Fortes"
                value={currentResponse.strengths}
                onChange={(e) => handleTextChange('strengths', e.target.value)}
                placeholder="Descreva os principais pontos fortes do colaborador..."
                rows={3}
              />

              <Textarea
                label="Áreas para Melhoria"
                value={currentResponse.areas_for_improvement}
                onChange={(e) => handleTextChange('areas_for_improvement', e.target.value)}
                placeholder="Identifique áreas onde o colaborador pode melhorar..."
                rows={3}
              />

              <Textarea
                label="Metas Alcançadas"
                value={currentResponse.goals_achieved}
                onChange={(e) => handleTextChange('goals_achieved', e.target.value)}
                placeholder="Descreva as metas que foram alcançadas no período..."
                rows={3}
              />

              <Textarea
                label="Metas para o Próximo Período"
                value={currentResponse.goals_next_period}
                onChange={(e) => handleTextChange('goals_next_period', e.target.value)}
                placeholder="Defina as metas para o próximo período..."
                rows={3}
              />

              <Textarea
                label="Comentários Adicionais"
                value={currentResponse.additional_comments}
                onChange={(e) => handleTextChange('additional_comments', e.target.value)}
                placeholder="Outros comentários relevantes..."
                rows={3}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={saveResponse}
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ManagerFeedbackForm;