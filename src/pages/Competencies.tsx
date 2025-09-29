import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, User, Users, Save, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { databaseService } from '../services/database';
import { Competency } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Competencies: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMode, setEditingMode] = useState<'self' | 'manager' | 'view'>('view');

  useEffect(() => {
    if (user) {
      loadCompetencies();
    }
  }, [user]);

  const loadCompetencies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await databaseService.getCompetencies(user.id);
      setCompetencies(data || []);
    } catch (error) {
      console.error('Erro ao carregar competências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (competencyId: string, rating: number, type: 'self' | 'manager') => {
    setCompetencies(prev => prev.map(comp => 
      comp.id === competencyId 
        ? { 
            ...comp, 
            [type === 'self' ? 'self_rating' : 'manager_rating']: rating 
          }
        : comp
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = competencies.map(comp => ({
        id: comp.id,
        self_rating: comp.self_rating,
        manager_rating: comp.manager_rating
      }));

      for (const update of updates) {
        await databaseService.updateCompetency(update.id, {
          self_rating: update.self_rating,
          manager_rating: update.manager_rating
        });
      }

      setEditingMode('view');
      
      // Check for new achievements after competency updates
      setTimeout(() => {
        checkAchievements();
      }, 1000);
      
      // Check for career progression after competency updates
      setTimeout(async () => {
        try {
          const { careerTrackService } = await import('../services/careerTrack');
          await careerTrackService.checkProgression(user.id);
        } catch (error) {
          console.error('Error checking career progression:', error);
        }
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar competências:', error);
    } finally {
      setSaving(false);
    }
  };

  const getRadarData = () => {
    return competencies.map(comp => ({
      name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
      fullName: comp.name,
      selfRating: comp.self_rating || 0,
      managerRating: comp.manager_rating || 0,
      target: comp.target_level
    }));
  };

  const getBarData = () => {
    return competencies.map(comp => ({
      name: comp.name.length > 20 ? comp.name.substring(0, 20) + '...' : comp.name,
      'Autoavaliação': comp.self_rating || 0,
      'Avaliação do Gestor': comp.manager_rating || 0,
      'Meta': comp.target_level
    }));
  };

  const getDivergenceData = () => {
    return competencies
      .filter(comp => comp.self_rating && comp.manager_rating)
      .map(comp => ({
        name: comp.name,
        divergence: Math.abs((comp.self_rating || 0) - (comp.manager_rating || 0)),
        selfRating: comp.self_rating,
        managerRating: comp.manager_rating
      }))
      .sort((a, b) => b.divergence - a.divergence);
  };

  const renderRatingStars = (competency: Competency, type: 'self' | 'manager') => {
    const rating = type === 'self' ? competency.self_rating : competency.manager_rating;
    const canEdit = editingMode === type;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => canEdit && handleRatingChange(competency.id, star, type)}
            disabled={!canEdit}
            className={`w-6 h-6 ${
              star <= (rating || 0)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } ${canEdit ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating || 0}/5
        </span>
      </div>
    );
  };

  const canEditManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'hr';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competências</h1>
          <p className="text-gray-600 mt-1">Avalie e acompanhe o desenvolvimento de habilidades</p>
        </div>
        <div className="flex space-x-2">
          {editingMode === 'view' && (
            <>
              <Button
                variant="secondary"
                onClick={() => setEditingMode('self')}
              >
                <User size={16} className="mr-2" />
                Autoavaliação
              </Button>
              {canEditManager && (
                <Button
                  variant="secondary"
                  onClick={() => setEditingMode('manager')}
                >
                  <Users size={16} className="mr-2" />
                  Avaliação Gestor
                </Button>
              )}
            </>
          )}
          {editingMode !== 'view' && (
            <>
              <Button onClick={handleSave} loading={saving}>
                <Save size={16} className="mr-2" />
                Salvar
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditingMode('view')}
              >
                <Eye size={16} className="mr-2" />
                Visualizar
              </Button>
            </>
          )}
        </div>
      </div>

      {competencies.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma competência encontrada
          </h3>
          <p className="text-gray-600">
            Entre em contato com o RH para configurar suas competências.
          </p>
        </Card>
      ) : (
        <>
          {/* Competencies List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Lista de Competências</h3>
            <div className="space-y-4">
              {competencies.map((competency) => (
                <motion.div
                  key={competency.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{competency.name}</h4>
                      <Badge variant={competency.type === 'hard' ? 'info' : 'success'}>
                        {competency.type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                      </Badge>
                      <Badge variant="default">
                        {competency.stage}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Meta: {competency.target_level}/5
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Autoavaliação
                      </label>
                      {renderRatingStars(competency, 'self')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avaliação do Gestor
                      </label>
                      {renderRatingStars(competency, 'manager')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Visão Geral - Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar
                    name="Autoavaliação"
                    dataKey="selfRating"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Avaliação Gestor"
                    dataKey="managerRating"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Meta"
                    dataKey="target"
                    stroke="#F59E0B"
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            {/* Bar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comparativo por Competência</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBarData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Autoavaliação" fill="#3B82F6" />
                  <Bar dataKey="Avaliação do Gestor" fill="#10B981" />
                  <Bar dataKey="Meta" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Divergence Analysis */}
          {getDivergenceData().length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Análise de Divergências</h3>
              <div className="space-y-3">
                {getDivergenceData().slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Autoavaliação: {item.selfRating}/5</span>
                        <span>Gestor: {item.managerRating}/5</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        item.divergence >= 2 ? 'text-red-600' :
                        item.divergence >= 1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.divergence.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">divergência</div>
                    </div>
                  </div>
                ))}
              </div>
              {getDivergenceData().length > 5 && (
                <div className="text-center mt-4">
                  <Button variant="ghost" size="sm">
                    Ver todas as divergências
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Competencies;