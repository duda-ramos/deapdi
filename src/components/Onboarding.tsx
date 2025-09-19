import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Heart, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Building,
  Target,
  Brain,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';

interface SkillInputProps {
  type: 'hard_skills' | 'soft_skills' | 'certifications' | 'development_interests';
  label: string;
  suggestions: string[];
  formData: OnboardingData;
  errors: Record<string, string>;
  addSkill: (type: 'hard_skills' | 'soft_skills' | 'certifications' | 'development_interests', skill: string) => void;
  removeSkill: (type: 'hard_skills' | 'soft_skills' | 'certifications' | 'development_interests', index: number) => void;
}

const SkillInput: React.FC<SkillInputProps> = ({ type, label, suggestions, formData, errors, addSkill, removeSkill }) => {
  const [inputValue, setInputValue] = useState('');
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Digite ${label.toLowerCase()}`}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(type, inputValue);
                setInputValue('');
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              addSkill(type, inputValue);
              setInputValue('');
            }}
            disabled={!inputValue.trim()}
          >
            Adicionar
          </Button>
        </div>
        
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                addSkill(type, suggestion);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={formData[type].includes(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        {/* Selected skills */}
        <div className="flex flex-wrap gap-2">
          {formData[type].map((skill, index) => (
            <Badge key={index} variant="info" className="flex items-center space-x-1">
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(type, index)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
      {errors[type] && (
        <p className="text-sm text-red-600 mt-1">{errors[type]}</p>
      )}
    </div>
  );
};

interface OnboardingData {
  // Step 1 - Personal Info
  name: string;
  birth_date: string;
  phone: string;
  location: string;
  avatar_url: string;
  bio: string;

  // Step 2 - Professional Info
  position: string;
  level: string;
  team_id: string;
  admission_date: string;
  manager_id: string;
  area: string;

  // Step 3 - Education & Skills
  formation: string;
  certifications: string[];
  hard_skills: string[];
  soft_skills: string[];
  languages: Record<string, string>;

  // Step 4 - Mental Health
  mental_health_consent: boolean;
  preferred_session_type: string;
  emergency_contact: string;

  // Step 5 - Preferences
  career_objectives: string;
  development_interests: string[];
  mentorship_availability: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

const steps = [
  {
    id: 1,
    title: 'Informações Pessoais',
    description: 'Conte-nos um pouco sobre você',
    icon: <User size={24} />
  },
  {
    id: 2,
    title: 'Informações Profissionais',
    description: 'Sua posição e estrutura organizacional',
    icon: <Briefcase size={24} />
  },
  {
    id: 3,
    title: 'Formação e Competências',
    description: 'Suas qualificações e habilidades',
    icon: <GraduationCap size={24} />
  },
  {
    id: 4,
    title: 'Bem-estar e Saúde Mental',
    description: 'Configurações de acompanhamento psicológico',
    icon: <Heart size={24} />
  },
  {
    id: 5,
    title: 'Preferências e Configurações',
    description: 'Finalize sua configuração',
    icon: <Settings size={24} />
  }
];

export const Onboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [formData, setFormData] = useState<OnboardingData>({
    // Step 1
    name: user?.name || '',
    birth_date: '',
    phone: '',
    location: '',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',

    // Step 2
    position: user?.position || '',
    level: user?.level || '',
    team_id: user?.team_id || '',
    admission_date: '',
    manager_id: user?.manager_id || '',
    area: '',

    // Step 3
    formation: user?.formation || '',
    certifications: [],
    hard_skills: [],
    soft_skills: [],
    languages: {},

    // Step 4
    mental_health_consent: false,
    preferred_session_type: 'presencial',
    emergency_contact: '',

    // Step 5
    career_objectives: '',
    development_interests: [],
    mentorship_availability: false,
    terms_accepted: false,
    privacy_accepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSelectOptions();
    loadProgress();
  }, []);

  const loadSelectOptions = async () => {
    try {
      const [teamsData, managersData] = await Promise.all([
        databaseService.getTeams(),
        databaseService.getProfiles({ role: 'manager' })
      ]);
      setTeams(teamsData || []);
      setManagers(managersData || []);
    } catch (error) {
      console.error('Error loading select options:', error);
    }
  };

  const loadProgress = async () => {
    if (!user?.onboarding_progress) return;
    
    try {
      const progress = typeof user.onboarding_progress === 'string' 
        ? JSON.parse(user.onboarding_progress)
        : user.onboarding_progress;
      
      setFormData(prev => ({ ...prev, ...progress }));
      setCurrentStep(progress.currentStep || 1);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!user) return;
    
    try {
      await databaseService.updateProfile(user.id, {
        onboarding_progress: JSON.stringify({ ...formData, currentStep })
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.birth_date) newErrors.birth_date = 'Data de nascimento é obrigatória';
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
        if (!formData.location.trim()) newErrors.location = 'Localização é obrigatória';
        break;

      case 2:
        if (!formData.position.trim()) newErrors.position = 'Cargo é obrigatório';
        if (!formData.level) newErrors.level = 'Nível é obrigatório';
        if (!formData.admission_date) newErrors.admission_date = 'Data de admissão é obrigatória';
        if (!formData.area.trim()) newErrors.area = 'Área de atuação é obrigatória';
        break;

      case 3:
        if (!formData.formation.trim()) newErrors.formation = 'Formação é obrigatória';
        if (formData.hard_skills.length < 3) newErrors.hard_skills = 'Selecione pelo menos 3 hard skills';
        if (formData.soft_skills.length < 3) newErrors.soft_skills = 'Selecione pelo menos 3 soft skills';
        break;

      case 4:
        if (formData.mental_health_consent && !formData.emergency_contact.trim()) {
          newErrors.emergency_contact = 'Contato de emergência é obrigatório quando consentir acompanhamento';
        }
        break;

      case 5:
        if (!formData.career_objectives.trim()) newErrors.career_objectives = 'Objetivos de carreira são obrigatórios';
        if (!formData.terms_accepted) newErrors.terms_accepted = 'Aceite dos termos é obrigatório';
        if (!formData.privacy_accepted) newErrors.privacy_accepted = 'Aceite da política de privacidade é obrigatório';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    await saveProgress();
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrevious = async () => {
    await saveProgress();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Update profile with all onboarding data
      await databaseService.updateProfile(user.id, {
        ...formData,
        is_onboarded: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_progress: null
      });

      // Create initial career track if needed
      const existingTrack = await databaseService.getCareerTrack(user.id);
      if (!existingTrack) {
        await databaseService.createCareerTrack({
          profession: formData.position,
          current_stage: formData.level,
          progress: 0,
          track_type: 'development',
          profile_id: user.id
        });
      }

      // Create welcome notification
      await databaseService.createNotification({
        profile_id: user.id,
        title: '🎉 Bem-vindo ao TalentFlow!',
        message: 'Seu perfil foi configurado com sucesso. Explore as funcionalidades e comece sua jornada de desenvolvimento!',
        type: 'success',
        action_url: '/dashboard'
      });

      await refreshUser();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (type: 'hard_skills' | 'soft_skills' | 'certifications' | 'development_interests', skill: string) => {
    if (!skill.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], skill.trim()]
    }));
  };

  const removeSkill = (type: 'hard_skills' | 'soft_skills' | 'certifications' | 'development_interests', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addLanguage = (language: string, level: string) => {
    if (!language.trim() || !level) return;
    
    setFormData(prev => ({
      ...prev,
      languages: { ...prev.languages, [language]: level }
    }));
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: Object.fromEntries(
        Object.entries(prev.languages).filter(([key]) => key !== language)
      )
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações Pessoais</h2>
              <p className="text-gray-600">Vamos começar conhecendo você melhor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome Completo *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                placeholder="Seu nome completo"
              />
              
              <Input
                label="Data de Nascimento *"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                error={errors.birth_date}
              />
              
              <Input
                label="Telefone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                placeholder="(11) 99999-9999"
              />
              
              <Input
                label="Localização/Cidade *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={errors.location}
                placeholder="São Paulo, SP"
              />
            </div>

            <Input
              label="URL da Foto de Perfil"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://exemplo.com/foto.jpg"
              helperText="Cole o link de uma foto sua ou deixe em branco para usar o padrão"
              sanitize={false}
            />

            <Textarea
              label="Bio Profissional"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Conte um pouco sobre sua trajetória profissional, experiências e interesses..."
              rows={4}
              sanitize={false}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações Profissionais</h2>
              <p className="text-gray-600">Sua posição na empresa e estrutura organizacional</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Cargo/Posição *"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                error={errors.position}
                placeholder="Ex: Desenvolvedor Frontend"
              />
              
              <Select
                label="Nível *"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                error={errors.level}
                options={[
                  { value: 'Estagiário', label: 'Estagiário' },
                  { value: 'Assistente', label: 'Assistente' },
                  { value: 'Júnior', label: 'Júnior' },
                  { value: 'Pleno', label: 'Pleno' },
                  { value: 'Sênior', label: 'Sênior' },
                  { value: 'Especialista', label: 'Especialista' },
                  { value: 'Principal', label: 'Principal' }
                ]}
                placeholder="Selecione seu nível"
              />
              
              <Select
                label="Time/Departamento"
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                options={teams.map(team => ({ value: team.id, label: team.name }))}
                placeholder="Selecione seu time"
              />
              
              <Input
                label="Data de Admissão *"
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                error={errors.admission_date}
              />
              
              <Select
                label="Gestor Direto"
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                options={managers.map(manager => ({ value: manager.id, label: manager.name }))}
                placeholder="Selecione seu gestor"
              />
              
              <Input
                label="Área de Atuação *"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                error={errors.area}
                placeholder="Ex: Tecnologia, Marketing, Vendas"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="text-purple-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Formação e Competências</h2>
              <p className="text-gray-600">Suas qualificações e habilidades técnicas</p>
            </div>

            <Textarea
              label="Formação Acadêmica *"
              value={formData.formation}
              onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
              error={errors.formation}
              placeholder="Graduação, pós-graduação, cursos técnicos..."
              rows={3}
              sanitize={false}
            />

            <SkillInput
              type="certifications"
              label="Certificações"
              suggestions={['AWS Certified', 'Google Cloud', 'Microsoft Azure', 'Scrum Master', 'PMP', 'ITIL']}
              formData={formData}
              errors={errors}
              addSkill={addSkill}
              removeSkill={removeSkill}
            />

            <SkillInput
              type="hard_skills"
              label="Hard Skills (mínimo 3) *"
              suggestions={['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'Docker', 'AWS', 'Git']}
              formData={formData}
              errors={errors}
              addSkill={addSkill}
              removeSkill={removeSkill}
            />

            <SkillInput
              type="soft_skills"
              label="Soft Skills (mínimo 3) *"
              suggestions={['Liderança', 'Comunicação', 'Trabalho em Equipe', 'Resolução de Problemas', 'Criatividade', 'Adaptabilidade']}
              formData={formData}
              errors={errors}
              addSkill={addSkill}
              removeSkill={removeSkill}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idiomas</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Idioma"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const language = (e.target as HTMLInputElement).value;
                        const levelSelect = e.currentTarget.parentElement?.nextElementSibling as HTMLSelectElement;
                        if (language && levelSelect?.value) {
                          addLanguage(language, levelSelect.value);
                          (e.target as HTMLInputElement).value = '';
                          levelSelect.value = '';
                        }
                      }
                    }}
                  />
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Nível</option>
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Fluente">Fluente</option>
                    <option value="Nativo">Nativo</option>
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.languages).map(([language, level]) => (
                    <Badge key={language} variant="success" className="flex items-center space-x-1">
                      <span>{language} - {level}</span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-pink-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-estar e Saúde Mental</h2>
              <p className="text-gray-600">Configurações para seu acompanhamento psicológico</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Shield className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Programa de Bem-estar Psicológico</h3>
                  <p className="text-blue-800 text-sm mb-4">
                    Nossa empresa oferece acompanhamento psicológico gratuito e confidencial para todos os colaboradores.
                    Sua participação é 100% voluntária e seus dados são protegidos por sigilo profissional.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="mental_health_consent"
                        checked={formData.mental_health_consent}
                        onChange={(e) => setFormData({ ...formData, mental_health_consent: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="mental_health_consent" className="text-sm text-blue-900">
                        Desejo participar do programa de bem-estar psicológico
                      </label>
                    </div>

                    {formData.mental_health_consent && (
                      <div className="space-y-4 mt-4 pl-6 border-l-2 border-blue-300">
                        <Select
                          label="Preferência de Modalidade"
                          value={formData.preferred_session_type}
                          onChange={(e) => setFormData({ ...formData, preferred_session_type: e.target.value })}
                          options={[
                            { value: 'presencial', label: 'Presencial - No escritório' },
                            { value: 'online', label: 'Online - Videochamada' },
                            { value: 'ambos', label: 'Ambos - Sem preferência' }
                          ]}
                        />

                        <Input
                          label="Contato de Emergência *"
                          value={formData.emergency_contact}
                          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                          error={errors.emergency_contact}
                          placeholder="Nome e telefone de contato de emergência"
                          sanitize={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">🔒 Garantias de Privacidade</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Todos os dados são estritamente confidenciais</li>
                <li>• Apenas psicólogos autorizados têm acesso</li>
                <li>• Gestores NÃO têm acesso aos seus dados</li>
                <li>• Você pode revogar consentimento a qualquer momento</li>
                <li>• Participação não afeta avaliações de performance</li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="text-orange-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferências e Configurações</h2>
              <p className="text-gray-600">Finalize sua configuração inicial</p>
            </div>

            <Textarea
              label="Objetivos de Carreira *"
              value={formData.career_objectives}
              onChange={(e) => setFormData({ ...formData, career_objectives: e.target.value })}
              error={errors.career_objectives}
              placeholder="Descreva seus objetivos profissionais e onde gostaria de estar em 2-3 anos..."
              rows={4}
              sanitize={false}
            />

            <SkillInput
              type="development_interests"
              label="Áreas de Interesse para Desenvolvimento"
              suggestions={['Liderança', 'Gestão de Projetos', 'Tecnologia', 'Vendas', 'Marketing', 'Finanças', 'RH']}
              formData={formData}
              errors={errors}
              addSkill={addSkill}
              removeSkill={removeSkill}
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mentorship_availability"
                  checked={formData.mentorship_availability}
                  onChange={(e) => setFormData({ ...formData, mentorship_availability: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="mentorship_availability" className="text-sm text-gray-700">
                  Estou disponível para ser mentor de outros colaboradores
                </label>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-3">📋 Termos e Políticas</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms_accepted"
                      checked={formData.terms_accepted}
                      onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                      className="rounded mt-1"
                    />
                    <label htmlFor="terms_accepted" className="text-sm text-yellow-900">
                      Li e aceito os <button type="button" className="text-yellow-700 underline">Termos de Uso</button> da plataforma *
                    </label>
                  </div>
                  {errors.terms_accepted && (
                    <p className="text-sm text-red-600">{errors.terms_accepted}</p>
                  )}

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="privacy_accepted"
                      checked={formData.privacy_accepted}
                      onChange={(e) => setFormData({ ...formData, privacy_accepted: e.target.checked })}
                      className="rounded mt-1"
                    />
                    <label htmlFor="privacy_accepted" className="text-sm text-yellow-900">
                      Li e aceito a <button type="button" className="text-yellow-700 underline">Política de Privacidade</button> *
                    </label>
                  </div>
                  {errors.privacy_accepted && (
                    <p className="text-sm text-red-600">{errors.privacy_accepted}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Progress Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração Inicial</h1>
            <p className="text-gray-600">Complete seu perfil para começar a usar o TalentFlow</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.id ? <Check size={20} /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Info */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep - 1]?.title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1]?.description}
            </p>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                Passo {currentStep} de {steps.length}
              </span>
            </div>
          </div>

          {/* Form Content */}
          <Card className="p-8 mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft size={16} className="mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              loading={loading}
            >
              {currentStep === steps.length ? (
                <>
                  <Check size={16} className="mr-2" />
                  Finalizar Configuração
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};