import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Headphones, 
  Activity, 
  Eye, 
  Clock,
  Star,
  Filter,
  Search
} from 'lucide-react';
import { mentalHealthService, WellnessResource } from '../../services/mentalHealth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface WellnessResourcesProps {
  employeeId: string;
}

export const WellnessResources: React.FC<WellnessResourcesProps> = ({ employeeId }) => {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<WellnessResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<WellnessResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'anxiety', label: 'Ansiedade' },
    { value: 'stress', label: 'Estresse' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'sleep', label: 'Sono' },
    { value: 'productivity', label: 'Produtividade' },
    { value: 'relationships', label: 'Relacionamentos' }
  ];

  const contentTypes = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'article', label: 'Artigos' },
    { value: 'video', label: 'Vídeos' },
    { value: 'audio', label: 'Áudios' },
    { value: 'exercise', label: 'Exercícios' }
  ];

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory, selectedType]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await mentalHealthService.getWellnessResources();
      setResources(data || []);
    } catch (error) {
      console.error('Error loading wellness resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.content_type === selectedType);
    }

    setFilteredResources(filtered);
  };

  const handleViewResource = async (resource: WellnessResource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
    
    // Record the view
    await mentalHealthService.viewResource(resource.id, employeeId);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen size={20} className="text-blue-500" />;
      case 'video': return <Play size={20} className="text-red-500" />;
      case 'audio': return <Headphones size={20} className="text-purple-500" />;
      case 'exercise': return <Activity size={20} className="text-green-500" />;
      default: return <BookOpen size={20} className="text-gray-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Artigo';
      case 'video': return 'Vídeo';
      case 'audio': return 'Áudio';
      case 'exercise': return 'Exercício';
      default: return type;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'anxiety': return 'warning';
      case 'stress': return 'danger';
      case 'mindfulness': return 'success';
      case 'sleep': return 'info';
      case 'productivity': return 'default';
      case 'relationships': return 'info';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anxiety': return 'Ansiedade';
      case 'stress': return 'Estresse';
      case 'mindfulness': return 'Mindfulness';
      case 'sleep': return 'Sono';
      case 'productivity': return 'Produtividade';
      case 'relationships': return 'Relacionamentos';
      default: return category;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando recursos...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories}
          />
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={contentTypes}
          />
          <Button variant="secondary" className="flex items-center">
            <Filter size={16} className="mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredResources.indexOf(resource) * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getContentIcon(resource.content_type)}
                    <Badge variant={getCategoryColor(resource.category)} size="sm">
                      {getCategoryLabel(resource.category)}
                    </Badge>
                  </div>
                  <Badge variant="default" size="sm">
                    {getContentTypeLabel(resource.content_type)}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Criado em {new Date(resource.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleViewResource(resource)}
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Recurso
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum recurso encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termos de busca.
          </p>
        </Card>
      )}

      {/* Resource View Modal */}
      <Modal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        title={selectedResource?.title || ''}
        size="xl"
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              {getContentIcon(selectedResource.content_type)}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedResource.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getCategoryColor(selectedResource.category)}>
                    {getCategoryLabel(selectedResource.category)}
                  </Badge>
                  <Badge variant="default">
                    {getContentTypeLabel(selectedResource.content_type)}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              {selectedResource.description}
            </p>

            {selectedResource.content_url && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-center">
                  {selectedResource.resource_type === 'video' && <Play size={48} className="mx-auto mb-2 text-blue-500" />}
                  {selectedResource.resource_type === 'audio' && <Headphones size={48} className="mx-auto mb-2 text-purple-500" />}
                  {selectedResource.resource_type === 'article' && <BookOpen size={48} className="mx-auto mb-2 text-green-500" />}
                  {selectedResource.resource_type === 'pdf' && <FileText size={48} className="mx-auto mb-2 text-red-500" />}
                  
                  <p className="text-gray-600 mb-2">
                    {selectedResource.resource_type === 'video' ? 'Conteúdo em Vídeo' :
                     selectedResource.resource_type === 'audio' ? 'Conteúdo em Áudio' :
                     selectedResource.resource_type === 'article' ? 'Artigo' :
                     selectedResource.resource_type === 'pdf' ? 'Documento PDF' : 'Conteúdo Externo'}
                  </p>
                  <Button
                    onClick={() => window.open(selectedResource.content_url, '_blank')}
                  >
                    Acessar Conteúdo
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Criado em {new Date(selectedResource.created_at).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: selectedResource.title,
                        text: selectedResource.description,
                        url: window.location.href
                      });
                    }
                  }}
                >
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};