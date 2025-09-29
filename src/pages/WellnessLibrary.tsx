import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Headphones, Activity, Heart, Search, Filter, Star, Eye, Plus, CreditCard as Edit, Trash2, Upload, Download, Tag, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mentalHealthService, WellnessResource, ResourceFavorite } from '../services/mentalHealth';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

const WellnessLibrary: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filteredResources, setFilteredResources] = useState<WellnessResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<WellnessResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resource_type: 'article' as WellnessResource['resource_type'],
    category: 'general',
    content_url: '',
    content_text: '',
    tags: [] as string[],
    target_audience: [] as string[]
  });

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'anxiety', label: 'Ansiedade' },
    { value: 'stress', label: 'Estresse' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'sleep', label: 'Sono' },
    { value: 'productivity', label: 'Produtividade' },
    { value: 'relationships', label: 'Relacionamentos' },
    { value: 'general', label: 'Geral' }
  ];

  const contentTypes = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'article', label: 'Artigos' },
    { value: 'video', label: 'Vídeos' },
    { value: 'audio', label: 'Áudios' },
    { value: 'exercise', label: 'Exercícios' }
  ];

  const availableTags = [
    'ansiedade', 'estresse', 'sono', 'mindfulness', 'relacionamentos',
    'produtividade', 'foco', 'respiracao', 'meditacao', 'relaxamento',
    'autoestima', 'comunicacao', 'lideranca', 'burnout', 'equilibrio'
  ];

  const targetAudiences = [
    'todos', 'gestores', 'colaboradores', 'rh', 'novos_funcionarios'
  ];

  useEffect(() => {
    if (user) {
      loadResources();
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory, selectedType, showFavoritesOnly, favorites]);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await mentalHealthService.getWellnessResources();
      setResources(data || []);
    } catch (error) {
      console.error('Error loading wellness resources:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const favoriteResources = await mentalHealthService.getFavoriteResources(user.id);
      setFavorites(favoriteResources.map(f => f.resource.id));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.resource_type === selectedType);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(resource => favorites.includes(resource.id));
    }

    setFilteredResources(filtered);
  };

  const handleViewResource = async (resource: WellnessResource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
    
    if (user) {
      await mentalHealthService.viewResource(resource.id, user.id);
      // Update view count locally
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, view_count: r.view_count + 1 }
          : r
      ));
    }
  };

  const handleToggleFavorite = async (resourceId: string) => {
    if (!user) return;

    try {
      if (favorites.includes(resourceId)) {
        await mentalHealthService.removeFromFavorites(user.id, resourceId);
        setFavorites(prev => prev.filter(id => id !== resourceId));
      } else {
        await mentalHealthService.addToFavorites(user.id, resourceId);
        setFavorites(prev => [...prev, resourceId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mentalHealthService.createWellnessResource({
        ...resourceForm,
        created_by: user.id,
        active: true
      });

      setShowCreateModal(false);
      setResourceForm({
        title: '',
        description: '',
        resource_type: 'article',
        category: 'general',
        content_url: '',
        content_text: '',
        tags: [],
        target_audience: []
      });
      loadResources();
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const addTag = (tag: string) => {
    if (!resourceForm.tags.includes(tag)) {
      setResourceForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setResourceForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
      case 'general': return 'Geral';
      default: return category;
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando biblioteca de bem-estar..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Bem-estar</h1>
          <p className="text-gray-600 mt-1">Recursos para seu desenvolvimento pessoal e bem-estar</p>
        </div>
        <ErrorMessage error={error} onRetry={loadResources} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="mr-3 text-pink-500" size={28} />
            Biblioteca de Bem-estar
          </h1>
          <p className="text-gray-600 mt-1">Recursos para seu desenvolvimento pessoal e bem-estar</p>
        </div>
        {user?.role === 'hr' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" />
            Novo Recurso
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{resources.length}</div>
              <div className="text-sm text-gray-600">Total de Recursos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.resource_type === 'article').length}
              </div>
              <div className="text-sm text-gray-600">Artigos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {resources.filter(r => r.resource_type === 'exercise').length}
              </div>
              <div className="text-sm text-gray-600">Exercícios</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
              <div className="text-sm text-gray-600">Favoritos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <Button
            variant={showFavoritesOnly ? 'primary' : 'secondary'}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="flex items-center"
          >
            <Star size={16} className="mr-2" />
            {showFavoritesOnly ? 'Todos' : 'Favoritos'}
          </Button>
          <Button variant="secondary" className="flex items-center">
            <Filter size={16} className="mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showFavoritesOnly ? 'Nenhum favorito encontrado' : 'Nenhum recurso encontrado'}
          </h3>
          <p className="text-gray-600">
            {showFavoritesOnly 
              ? 'Adicione recursos aos favoritos para vê-los aqui.'
              : 'Tente ajustar os filtros ou termos de busca.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredResources.indexOf(resource) * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getContentIcon(resource.resource_type)}
                      <Badge variant={getCategoryColor(resource.category)} size="sm">
                        {getCategoryLabel(resource.category)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleFavorite(resource.id)}
                        className={`p-1 rounded ${
                          favorites.includes(resource.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Star size={16} fill={favorites.includes(resource.id) ? 'currentColor' : 'none'} />
                      </button>
                      <Badge variant="default" size="sm">
                        {getContentTypeLabel(resource.resource_type)}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {resource.description}
                  </p>

                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="default" size="sm">
                          +{resource.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Eye size={14} />
                      <span>{resource.view_count} visualizações</span>
                    </div>
                    <div className="flex space-x-2">
                      {user?.role === 'hr' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedResource(resource);
                            setResourceForm({
                              title: resource.title,
                              description: resource.description,
                              resource_type: resource.resource_type,
                              category: resource.category,
                              content_url: resource.content_url || '',
                              content_text: resource.content_text || '',
                              tags: resource.tags,
                              target_audience: resource.target_audience
                            });
                            setShowCreateModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleViewResource(resource)}
                      >
                        <Eye size={14} className="mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
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
              {getContentIcon(selectedResource.resource_type)}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedResource.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getCategoryColor(selectedResource.category)}>
                    {getCategoryLabel(selectedResource.category)}
                  </Badge>
                  <Badge variant="default">
                    {getContentTypeLabel(selectedResource.resource_type)}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Eye size={14} />
                    <span>{selectedResource.view_count} visualizações</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleFavorite(selectedResource.id)}
                className={`p-2 rounded-lg ${
                  favorites.includes(selectedResource.id)
                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <Star size={20} fill={favorites.includes(selectedResource.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              {selectedResource.description}
            </p>

            {selectedResource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedResource.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {selectedResource.content_text && (
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedResource.content_text
                      .replace(/\n/g, '<br>')
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-md font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }}
                />
              </div>
            )}

            {selectedResource.content_url && (
              <div className="mt-4">
                <Button
                  onClick={() => window.open(selectedResource.content_url, '_blank')}
                  className="w-full"
                >
                  <Play size={16} className="mr-2" />
                  Acessar Conteúdo Original
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Resource Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={selectedResource ? 'Editar Recurso' : 'Criar Novo Recurso'}
        size="xl"
      >
        <form onSubmit={handleCreateResource} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Título"
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              placeholder="Ex: Técnicas de Respiração para Ansiedade"
              required
            />
            <Select
              label="Tipo de Conteúdo"
              value={resourceForm.resource_type}
              onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value as any })}
              options={contentTypes.filter(t => t.value !== 'all')}
              required
            />
          </div>

          <Textarea
            label="Descrição"
            value={resourceForm.description}
            onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
            placeholder="Descreva brevemente o conteúdo e seus benefícios..."
            rows={3}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={resourceForm.category}
              onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
              options={categories.filter(c => c.value !== 'all')}
              required
            />
            <Input
              label="URL do Conteúdo (Opcional)"
              value={resourceForm.content_url}
              onChange={(e) => setResourceForm({ ...resourceForm, content_url: e.target.value })}
              placeholder="https://exemplo.com/video"
            />
          </div>

          <Textarea
            label="Conteúdo de Texto"
            value={resourceForm.content_text}
            onChange={(e) => setResourceForm({ ...resourceForm, content_text: e.target.value })}
            placeholder="Cole ou digite o conteúdo completo aqui..."
            rows={8}
            helperText="Use ## para títulos e ### para subtítulos. Use **texto** para negrito."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (clique para adicionar)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  disabled={resourceForm.tags.includes(tag)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    resourceForm.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {resourceForm.tags.map((tag) => (
                <Badge key={tag} variant="info" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Público-alvo
            </label>
            <div className="flex flex-wrap gap-2">
              {targetAudiences.map((audience) => (
                <button
                  key={audience}
                  type="button"
                  onClick={() => {
                    if (resourceForm.target_audience.includes(audience)) {
                      setResourceForm(prev => ({
                        ...prev,
                        target_audience: prev.target_audience.filter(a => a !== audience)
                      }));
                    } else {
                      setResourceForm(prev => ({
                        ...prev,
                        target_audience: [...prev.target_audience, audience]
                      }));
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    resourceForm.target_audience.includes(audience)
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {audience.replace('_', ' ')}
                </button>
              ))}
            </div>
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
              {selectedResource ? 'Atualizar' : 'Criar'} Recurso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WellnessLibrary;