import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Star, 
  Award, 
  Filter, 
  Search,
  Download,
  Eye,
  PlayCircle,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAchievements } from '../contexts/AchievementContext';
import { courseService, CourseWithProgress, CourseModule, CourseEnrollment } from '../services/courses';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

const Learning: React.FC = () => {
  const { user } = useAuth();
  const { checkAchievements } = useAchievements();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);

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
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get real courses from database
      const coursesData = await courseService.getCourses();
      
      // Get user enrollments
      const enrollments = await courseService.getUserEnrollments(user.id);
      const enrollmentMap = new Map(enrollments.map(e => [e.course_id, e]));
      
      // Combine courses with enrollment data
      const coursesWithProgress = await Promise.all(
        coursesData.map(async (course) => {
          const enrollment = enrollmentMap.get(course.id);
          const modules = await courseService.getCourseModules(course.id);
          
          let completed_modules = 0;
          if (enrollment) {
            const progress = await courseService.getModuleProgress(enrollment.id);
            completed_modules = progress.length;
          }

          return {
            ...course,
            enrollment,
            modules,
            completed_modules,
            total_modules: modules.length
          };
        })
      );
      
      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      // Fallback to empty array if courses table doesn't exist
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetails = async (course: CourseWithProgress) => {
    try {
      setSelectedCourse(course);
      
      if (course.enrollment) {
        const progress = await courseService.getModuleProgress(course.enrollment.id);
        setModuleProgress(progress);
      } else {
        setModuleProgress([]);
      }
      
      setShowCourseModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do curso:', error);
    }
  };

  const handleStartCourse = async (courseId: string) => {
    if (!user) return;

    try {
      await courseService.startCourse(courseId, user.id);
      await loadCourses();
    } catch (error) {
      console.error('Erro ao iniciar curso:', error);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    if (!selectedCourse?.enrollment) return;

    try {
      await courseService.completeModule(selectedCourse.enrollment.id, moduleId, 15);
      
      // Reload course details
      await loadCourseDetails(selectedCourse);
      await loadCourses();
      
      // Check for achievements
      setTimeout(() => {
        checkAchievements();
      }, 1000);
      
      // Check for career progression after course module completion
      setTimeout(async () => {
        try {
          const { careerTrackService } = await import('../services/careerTrack');
          await careerTrackService.checkProgression(user.id);
        } catch (error) {
          console.error('Error checking career progression:', error);
        }
      }, 1500);
    } catch (error) {
      console.error('Erro ao completar módulo:', error);
    }
  };

  const handleDownloadCertificate = async (enrollmentId: string) => {
    try {
      const certificateId = await courseService.generateCertificate(enrollmentId);
      const pdfUrl = await courseService.generateCertificatePDF(certificateId);
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `certificado-${certificateId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'info';
      case 'soft-skills': return 'success';
      case 'leadership': return 'warning';
      case 'compliance': return 'danger';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'Técnico';
      case 'soft-skills': return 'Soft Skills';
      case 'leadership': return 'Liderança';
      case 'compliance': return 'Compliance';
      default: return category;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return level;
    }
  };

  const getStatusIcon = (course: CourseWithProgress) => {
    if (!course.enrollment) return <Play size={16} className="text-gray-500" />;
    
    switch (course.enrollment.status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress': return <Clock size={16} className="text-blue-500" />;
      default: return <Play size={16} className="text-gray-500" />;
    }
  };

  const getStatusLabel = (course: CourseWithProgress) => {
    if (!course.enrollment) return 'Iniciar';
    
    switch (course.enrollment.status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Continuar';
      default: return 'Iniciar';
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    return moduleProgress.some(p => p.module_id === moduleId);
  };

  const completedCourses = courses.filter(c => c.enrollment?.status === 'completed').length;
  const inProgressCourses = courses.filter(c => c.enrollment?.status === 'in-progress').length;
  const totalPoints = courses
    .filter(c => c.enrollment?.status === 'completed')
    .reduce((sum, c) => sum + c.points, 0);

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
            Explore nossos cursos para começar sua jornada!
          </h3>
          <p className="text-gray-600">
            Nossa biblioteca de cursos está sendo preparada. Em breve você terá acesso a conteúdos incríveis para seu desenvolvimento.
          </p>
          <div className="mt-6">
            <Button onClick={() => window.location.href = '/competencies'}>
              <BarChart3 size={16} className="mr-2" />
              Avaliar Competências Primeiro
            </Button>
          </div>
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
                    src={course.thumbnail_url || `https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?w=300&h=200&fit=crop`}
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
                  {course.enrollment?.status === 'completed' && (
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
                        <span>4.8</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{course.duration_minutes} min</span>
                      <span>{course.total_modules} módulos</span>
                    </div>

                    {course.enrollment && course.enrollment.status !== 'enrolled' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progresso</span>
                          <span>{course.enrollment.progress_percentage.toFixed(0)}%</span>
                        </div>
                        <ProgressBar 
                          progress={course.enrollment.progress_percentage} 
                          color="blue" 
                        />
                        <div className="text-xs text-gray-500">
                          {course.completed_modules}/{course.total_modules} módulos concluídos
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">+{course.points}</span>
                        <span className="text-gray-500"> pontos</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex items-center space-x-2"
                          onClick={() => loadCourseDetails(course)}
                        >
                          <Eye size={14} />
                          <span>Detalhes</span>
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex items-center space-x-2"
                          onClick={() => handleStartCourse(course.id)}
                          disabled={course.enrollment?.status === 'completed'}
                        >
                          {getStatusIcon(course)}
                          <span>{getStatusLabel(course)}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Course Details Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title={selectedCourse?.title || ''}
        size="xl"
      >
        {selectedCourse && (
          <div className="space-y-6">
            {/* Course Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedCourse.thumbnail_url || `https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?w=400&h=250&fit=crop`}
                  alt={selectedCourse.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedCourse.title}
                  </h3>
                  <p className="text-gray-600">{selectedCourse.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Instrutor:</span>
                    <p className="font-medium">{selectedCourse.instructor}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duração:</span>
                    <p className="font-medium">{selectedCourse.duration_minutes} min</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Nível:</span>
                    <p className="font-medium">{getLevelLabel(selectedCourse.level)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pontos:</span>
                    <p className="font-medium text-blue-600">+{selectedCourse.points}</p>
                  </div>
                </div>

                {selectedCourse.enrollment && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Seu Progresso</h4>
                    <ProgressBar 
                      progress={selectedCourse.enrollment.progress_percentage} 
                      color="blue"
                      showLabel
                    />
                    <p className="text-sm text-blue-800 mt-2">
                      {selectedCourse.completed_modules}/{selectedCourse.total_modules} módulos concluídos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Course Modules */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Módulos do Curso</h4>
              <div className="space-y-3">
                {selectedCourse.modules?.map((module, index) => {
                  const isCompleted = isModuleCompleted(module.id);
                  const canAccess = !selectedCourse.enrollment || 
                                   selectedCourse.enrollment.status !== 'enrolled' ||
                                   index === 0 ||
                                   isModuleCompleted(selectedCourse.modules![index - 1]?.id);

                  return (
                    <div
                      key={module.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isCompleted 
                          ? 'border-green-200 bg-green-50' 
                          : canAccess 
                            ? 'border-blue-200 bg-blue-50 hover:border-blue-300' 
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : canAccess 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={16} />
                          ) : canAccess ? (
                            <PlayCircle size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {module.order_index}. {module.title}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {module.description} • {module.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isCompleted ? (
                          <Badge variant="success">Concluído</Badge>
                        ) : canAccess ? (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteModule(module.id)}
                          >
                            {selectedCourse.enrollment?.status === 'in-progress' ? 'Completar' : 'Iniciar'}
                          </Button>
                        ) : (
                          <Badge variant="default">Bloqueado</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {selectedCourse.enrollment?.status === 'completed' && (
                  <Button 
                    variant="success"
                    onClick={() => handleDownloadCertificate(selectedCourse.enrollment!.id)}
                  >
                    <Download size={16} className="mr-2" />
                    Baixar Certificado
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                {!selectedCourse.enrollment && (
                  <Button onClick={() => handleStartCourse(selectedCourse.id)}>
                    <Play size={16} className="mr-2" />
                    Iniciar Curso
                  </Button>
                )}
                {selectedCourse.enrollment?.status === 'in-progress' && (
                  <Button>
                    <PlayCircle size={16} className="mr-2" />
                    Continuar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Recommended Courses */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendados para Você</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses
            .filter(c => !c.enrollment)
            .slice(0, 2)
            .map((course) => (
              <div key={course.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-blue-50 rounded-lg">
                <img
                  src={course.thumbnail_url || `https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?w=64&h=64&fit=crop`}
                  alt={course.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.duration_minutes} min • {course.instructor}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getCategoryColor(course.category)} size="sm">
                      {getCategoryLabel(course.category)}
                    </Badge>
                    <span className="text-sm text-blue-600">+{course.points} pontos</span>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleStartCourse(course.id)}
                >
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