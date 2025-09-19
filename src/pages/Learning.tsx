import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, Star, Award, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'soft-skills' | 'leadership' | 'compliance';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  instructor: string;
  rating: number;
  enrolledCount: number;
  thumbnail: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  points: number;
  competencies: string[];
}

const Learning: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Mock courses data
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'React Avançado: Hooks e Context API',
      description: 'Aprenda os conceitos avançados do React, incluindo hooks customizados e gerenciamento de estado.',
      category: 'technical',
      level: 'advanced',
      duration: 180,
      instructor: 'Ana Silva',
      rating: 4.8,
      enrolledCount: 234,
      thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?w=300&h=200&fit=crop',
      status: 'in-progress',
      progress: 65,
      points: 150,
      competencies: ['React', 'JavaScript', 'Frontend Development']
    },
    {
      id: '2',
      title: 'Liderança e Gestão de Equipes',
      description: 'Desenvolva habilidades essenciais para liderar equipes de alta performance.',
      category: 'leadership',
      level: 'intermediate',
      duration: 120,
      instructor: 'Carlos Mendes',
      rating: 4.9,
      enrolledCount: 189,
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?w=300&h=200&fit=crop',
      status: 'completed',
      progress: 100,
      points: 200,
      competencies: ['Liderança', 'Gestão de Pessoas', 'Comunicação']
    },
    {
      id: '3',
      title: 'Comunicação Eficaz no Ambiente Corporativo',
      description: 'Melhore suas habilidades de comunicação verbal e escrita no contexto profissional.',
      category: 'soft-skills',
      level: 'beginner',
      duration: 90,
      instructor: 'Maria Santos',
      rating: 4.7,
      enrolledCount: 456,
      thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?w=300&h=200&fit=crop',
      status: 'not-started',
      progress: 0,
      points: 100,
      competencies: ['Comunicação', 'Apresentação', 'Relacionamento Interpessoal']
    },
    {
      id: '4',
      title: 'TypeScript para Desenvolvedores',
      description: 'Domine o TypeScript e melhore a qualidade do seu código JavaScript.',
      category: 'technical',
      level: 'intermediate',
      duration: 150,
      instructor: 'João Oliveira',
      rating: 4.6,
      enrolledCount: 312,
      thumbnail: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?w=300&h=200&fit=crop',
      status: 'not-started',
      progress: 0,
      points: 120,
      competencies: ['TypeScript', 'JavaScript', 'Desenvolvimento Web']
    },
    {
      id: '5',
      title: 'LGPD e Proteção de Dados',
      description: 'Entenda as principais diretrizes da LGPD e como aplicá-las no dia a dia.',
      category: 'compliance',
      level: 'beginner',
      duration: 60,
      instructor: 'Dra. Patricia Lima',
      rating: 4.5,
      enrolledCount: 678,
      thumbnail: 'https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?w=300&h=200&fit=crop',
      status: 'not-started',
      progress: 0,
      points: 80,
      competencies: ['Compliance', 'Proteção de Dados', 'Legislação']
    },
    {
      id: '6',
      title: 'Metodologias Ágeis: Scrum e Kanban',
      description: 'Aprenda as principais metodologias ágeis e como implementá-las em projetos.',
      category: 'technical',
      level: 'intermediate',
      duration: 135,
      instructor: 'Roberto Costa',
      rating: 4.8,
      enrolledCount: 289,
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?w=300&h=200&fit=crop',
      status: 'not-started',
      progress: 0,
      points: 130,
      competencies: ['Scrum', 'Kanban', 'Gestão de Projetos']
    }
  ];

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'technical', label: 'Técnico' },
    { value: 'soft-skills', label: 'Soft Skills' },
    { value: 'leadership', label: 'Liderança' },
    { value: 'compliance', label: 'Compliance' }
  ];

  const levels = [
    { value: 'all', label: 'Todos os Níveis' },
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setCourses(mockCourses);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getCategoryColor = (category: Course['category']) => {
    switch (category) {
      case 'technical': return 'info';
      case 'soft-skills': return 'success';
      case 'leadership': return 'warning';
      case 'compliance': return 'danger';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: Course['category']) => {
    switch (category) {
      case 'technical': return 'Técnico';
      case 'soft-skills': return 'Soft Skills';
      case 'leadership': return 'Liderança';
      case 'compliance': return 'Compliance';
      default: return category;
    }
  };

  const getLevelLabel = (level: Course['level']) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return level;
    }
  };

  const getStatusIcon = (status: Course['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress': return <Clock size={16} className="text-blue-500" />;
      default: return <Play size={16} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Course['status']) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em Progresso';
      default: return 'Iniciar';
    }
  };

  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const inProgressCourses = courses.filter(c => c.status === 'in-progress').length;
  const totalPoints = courses.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.points, 0);

  if (loading) {
    return <LoadingScreen message="Carregando cursos..." />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprendizado</h1>
          <p className="text-gray-600 mt-1">Desenvolva suas habilidades com nossos cursos</p>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{completedCourses}</div>
              <div className="text-sm text-gray-600">Concluídos</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{inProgressCourses}</div>
              <div className="text-sm text-gray-600">Em Progresso</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{totalPoints}</div>
              <div className="text-sm text-gray-600">Pontos Ganhos</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 md:p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{courses.length}</div>
              <div className="text-sm text-gray-600">Disponíveis</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cursos..."
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
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            options={levels}
          />
          <Button variant="secondary" className="flex items-center">
            <Filter size={16} className="mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum curso encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termos de busca.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredCourses.indexOf(course) * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant={getCategoryColor(course.category)}>
                      {getCategoryLabel(course.category)}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="default">
                      {getLevelLabel(course.level)}
                    </Badge>
                  </div>
                  {course.status === 'completed' && (
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-green-500 text-white p-2 rounded-full">
                        <CheckCircle size={16} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Instrutor: {course.instructor}</span>
                      <div className="flex items-center space-x-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span>{course.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{course.duration} min</span>
                      <span>{course.enrolledCount} inscritos</span>
                    </div>

                    {course.status === 'in-progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progresso</span>
                          <span>{course.progress}%</span>
                        </div>
                        <ProgressBar progress={course.progress} color="blue" />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.competencies.slice(0, 3).map((comp, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {comp}
                        </Badge>
                      ))}
                      {course.competencies.length > 3 && (
                        <Badge variant="default" size="sm">
                          +{course.competencies.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">+{course.points}</span>
                        <span className="text-gray-500"> pontos</span>
                      </div>
                      <Button size="sm" className="flex items-center space-x-2">
                        {getStatusIcon(course.status)}
                        <span>{getStatusLabel(course.status)}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recommended Courses */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendados para Você</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses
            .filter(c => c.status === 'not-started')
            .slice(0, 2)
            .map((course) => (
              <div key={course.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-blue-50 rounded-lg">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.duration} min • {course.instructor}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getCategoryColor(course.category)} size="sm">
                      {getCategoryLabel(course.category)}
                    </Badge>
                    <span className="text-sm text-blue-600">+{course.points} pontos</span>
                  </div>
                </div>
                <Button size="sm">
                  Iniciar
                </Button>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default Learning;