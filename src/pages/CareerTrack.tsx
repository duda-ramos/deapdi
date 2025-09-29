import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award, ChevronRight, Star, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { careerTrackService, ProgressBreakdown } from '../services/careerTrack';
import { CareerTrack as CareerTrackType } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const CareerTrack: React.FC = () => {
  const { user } = useAuth();
  const [careerTrack, setCareerTrack] = useState<CareerTrackType | null>(null);
  const [progressBreakdown, setProgressBreakdown] = useState<ProgressBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadCareerTrack();
    }
  }, [user]);

  const loadCareerTrack = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      console.log('🎯 CareerTrack: Loading career track for user:', user.id);
      
      const track = await databaseService.getCareerTrack(user.id);
      
      if (!track) {
        // Create default career track if none exists
        const defaultTrack = await databaseService.createCareerTrack({
          profession: user.position,
          current_stage: user.level,
          progress: 0,
          track_type: 'development',
          profile_id: user.id,
          template_id: null,
          competency_progress: 0,
          pdi_progress: 0
        });
        setCareerTrack(defaultTrack);
      } else {
        setCareerTrack(track);
      }

      if (track || careerTrack) {
        const breakdown = await careerTrackService.calculateProgress(user.id);
        setProgressBreakdown(breakdown);
      }
    } catch (error) {
      console.error('🎯 CareerTrack: Error loading career track:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar trilha de carreira');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      await careerTrackService.updateProgress(user.id);
      await loadCareerTrack(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdating(false);
    }
  };

  const developmentStages = [
    { name: 'Estagiário', level: 1, description: 'Início da jornada profissional' },
    { name: 'Assistente', level: 2, description: 'Desenvolvimento de habilidades básicas' },
    { name: 'Júnior', level: 3, description: 'Autonomia em tarefas simples' },
    { name: 'Pleno', level: 4, description: 'Responsabilidade por projetos completos' }
  ];

  const specializationStages = [
    { name: 'Sênior', level: 5, description: 'Especialista técnico ou líder de equipe' },
    { name: 'Especialista', level: 6, description: 'Referência técnica na área' },
    { name: 'Principal', level: 7, description: 'Liderança estratégica' }
  ];

  const getCurrentStageIndex = (stageName: string, stages: typeof developmentStages) => {
    return stages.findIndex(stage => stage.name === stageName);
  };

  const getProgressPercentage = (progress: number) => {
    return Math.min(Math.max(progress, 0), 100);
  };

  const renderStageCard = (stage: typeof developmentStages[0], isActive: boolean, isCompleted: boolean, progress?: number) => (
    <motion.div
      key={stage.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-lg border-2 transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : isCompleted 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${
          isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
        }`}>
          {stage.name}
        </h3>
        {isCompleted && <Award className="text-green-600" size={20} />}
        {isActive && <Star className="text-blue-600" size={20} />}
      </div>
      <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
      {isActive && progress !== undefined && (
        <div>
          <ProgressBar 
            progress={progress} 
            color="blue" 
            showLabel 
            className="mb-2"
          />
          <p className="text-xs text-blue-600">
            {progress.toFixed(1)}% concluído
          </p>
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return <LoadingScreen message="Carregando trilha de carreira..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trilha de Carreira</h1>
          <p className="text-gray-600 mt-1">Acompanhe sua evolução profissional</p>
        </div>
        <ErrorMessage error={error} onRetry={loadCareerTrack} />
      </div>
    );
  }

  if (!careerTrack) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trilha de Carreira</h1>
          <p className="text-gray-600 mt-1">Sua trilha de carreira ainda não foi configurada</p>
        </div>
        <Card className="p-8 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Trilha não encontrada
          </h3>
          <p className="text-gray-600">
            Entre em contato com o RH para configurar sua trilha de carreira.
          </p>
        </Card>
      </div>
    );
  }

  const currentStageIndex = getCurrentStageIndex(careerTrack.current_stage, developmentStages);
  const isInSpecialization = currentStageIndex === -1;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trilha de Carreira</h1>
          <p className="text-gray-600 mt-1">Acompanhe sua evolução profissional</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="info" size="md">
            {careerTrack.profession}
          </Badge>
          <Button
            variant="secondary"
            onClick={handleUpdateProgress}
            loading={updating}
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar Progresso
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Status Atual</h2>
          <Badge variant={careerTrack.track_type === 'development' ? 'info' : 'success'}>
            {careerTrack.track_type === 'development' ? 'Desenvolvimento' : 'Especialização'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {careerTrack.current_stage}
            </div>
            <div className="text-sm text-gray-600">Estágio Atual</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {getProgressPercentage(careerTrack.progress).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Progresso Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {careerTrack.next_stage || 'Máximo'}
            </div>
            <div className="text-sm text-gray-600">Próximo Estágio</div>
          </div>
        </div>

        {careerTrack.next_stage && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progresso para {careerTrack.next_stage}
              </span>
              <span className="text-sm text-gray-600">
                {getProgressPercentage(careerTrack.progress).toFixed(1)}%
              </span>
            </div>
            <ProgressBar 
              progress={careerTrack.progress} 
              color="blue"
            />
          </div>
        )}
      </Card>

      {/* Progress Breakdown */}
      {progressBreakdown && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Info className="mr-2" size={20} />
            Detalhamento do Progresso
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competency Progress */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Competências (70% do progresso)
              </h4>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progresso das Competências</span>
                  <span>{progressBreakdown.competencyProgress.toFixed(1)}%</span>
                </div>
                <ProgressBar 
                  progress={progressBreakdown.competencyProgress} 
                  color="blue"
                />
              </div>
              
              <div className="space-y-2">
                {progressBreakdown.competencyDetails.map((comp) => (
                  <div key={comp.name} className="flex items-center justify-between text-sm">
                    <span className={comp.achieved ? 'text-green-700' : 'text-gray-600'}>
                      {comp.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {comp.currentLevel}/{comp.requiredLevel}
                      </span>
                      {comp.achieved ? (
                        <Badge variant="success" size="sm">✓</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Pendente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PDI Progress */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                PDIs (30% do progresso)
              </h4>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progresso dos PDIs</span>
                  <span>{progressBreakdown.pdiProgress.toFixed(1)}%</span>
                </div>
                <ProgressBar 
                  progress={progressBreakdown.pdiProgress} 
                  color="green"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PDIs Concluídos</span>
                  <span>{progressBreakdown.pdiDetails.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total de PDIs</span>
                  <span>{progressBreakdown.pdiDetails.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de Conclusão</span>
                  <span>{progressBreakdown.pdiDetails.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advancement Status */}
          {progressBreakdown.canAdvance ? (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-800">
                <Award size={20} />
                <span className="font-medium">
                  Parabéns! Você está pronto para avançar para {progressBreakdown.nextStage}!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Entre em contato com seu gestor para formalizar a progressão.
              </p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <Target size={20} />
                <span className="font-medium">
                  Continue desenvolvendo suas competências para avançar!
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Você precisa atingir 80% de progresso para avançar para o próximo estágio.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Development Track */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="mr-2" size={20} />
          Trilha de Desenvolvimento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {developmentStages.map((stage) => {
            const isCompleted = currentStageIndex > developmentStages.indexOf(stage) || isInSpecialization;
            const isActive = currentStageIndex === developmentStages.indexOf(stage) && !isInSpecialization;
            const progress = isActive ? careerTrack.progress : undefined;
            
            return renderStageCard(stage, isActive, isCompleted, progress);
          })}
        </div>
      </Card>

      {/* Specialization Track */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="mr-2" size={20} />
          Trilha de Especialização
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {specializationStages.map((stage) => {
            const specIndex = getCurrentStageIndex(careerTrack.current_stage, specializationStages);
            const isCompleted = specIndex > specializationStages.indexOf(stage) && isInSpecialization;
            const isActive = specIndex === specializationStages.indexOf(stage) && isInSpecialization;
            const progress = isActive ? careerTrack.progress : undefined;
            
            return renderStageCard(stage, isActive, isCompleted, progress);
          })}
        </div>
      </Card>

      {/* Next Steps */}
      {careerTrack.next_stage && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Próximos Passos</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ChevronRight className="text-blue-600 mr-2" size={20} />
              <span className="font-medium text-blue-900">
                Para avançar para {careerTrack.next_stage}:
              </span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 ml-6">
              <li>• Complete suas competências técnicas (80% necessário)</li>
              <li>• Finalize seus PDIs ativos</li>
              <li>• Participe de grupos de ação</li>
              <li>• Mantenha avaliações consistentes</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CareerTrack;