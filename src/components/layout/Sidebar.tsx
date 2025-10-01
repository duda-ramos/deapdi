import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  TrendingUp, 
  Target, 
  Users, 
  Heart, 
  Brain,
  Calendar,
  Trophy,
  Award,
  Settings,
  BookOpen,
  BarChart3,
  UserCog,
  FileText,
  Building,
  TestTube
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'profile', label: 'Meu Perfil', icon: <User size={20} />, path: '/profile', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'career', label: 'Trilha de Carreira', icon: <TrendingUp size={20} />, path: '/career', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'competencies', label: 'Competências', icon: <BarChart3 size={20} />, path: '/competencies', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'pdi', label: 'PDI', icon: <Target size={20} />, path: '/pdi', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'groups', label: 'Grupos de Ação', icon: <Users size={20} />, path: '/groups', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'achievements', label: 'Conquistas', icon: <Trophy size={20} />, path: '/achievements', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'learning', label: 'Aprendizado', icon: <BookOpen size={20} />, path: '/learning', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'certificates', label: 'Certificados', icon: <Award size={20} />, path: '/certificates', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'mentorship', label: 'Mentoria', icon: <Users size={20} />, path: '/mentorship', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'mental-health', label: 'Bem-estar', icon: <Brain size={20} />, path: '/mental-health', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'people', label: 'Gestão de Pessoas', icon: <Users size={20} />, path: '/people', roles: ['admin', 'manager'] },
  { id: 'teams', label: 'Gestão de Times', icon: <Building size={20} />, path: '/teams', roles: ['admin'] },
  { id: 'reports', label: 'Relatórios', icon: <FileText size={20} />, path: '/reports', roles: ['admin', 'hr', 'manager'] },
  { id: 'users', label: 'Criar Usuários', icon: <UserCog size={20} />, path: '/users', roles: ['admin', 'hr'] },
  { id: 'hr', label: 'Área de RH', icon: <Heart size={20} />, path: '/hr', roles: ['admin', 'hr'] },
  { id: 'hr-calendar', label: 'Calendário', icon: <Calendar size={20} />, path: '/hr-calendar', roles: ['admin', 'hr'] },
  { id: 'mental-health-admin', label: 'Portal do Psicólogo', icon: <Brain size={20} />, path: '/mental-health/admin', roles: ['hr'] },
  { id: 'career-management', label: 'Gerenciar Trilhas', icon: <TrendingUp size={20} />, path: '/career-management', roles: ['admin'] },
  { id: 'admin', label: 'Administração', icon: <Settings size={20} />, path: '/admin', roles: ['admin'] },
  { id: 'qa', label: 'Garantia de Qualidade', icon: <TestTube size={20} />, path: '/qa', roles: ['admin'] },
];

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, isMobile = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  console.log('📋 Sidebar: Rendering with user:', !!user, 'at path:', location.pathname);

  const filteredItems = sidebarItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <div className={`flex h-full w-full flex-col ${isMobile ? '' : 'px-4 py-6'}`}>
      <div className={`${isMobile ? 'px-1' : 'px-2'} mb-6 flex items-center gap-3`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-ink shadow-soft">
          <Trophy className="text-ink" size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">TalentFlow</p>
          <p className="truncate text-xs text-muted">Desenvolvimento & Gamificação</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Principal">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className="block"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                onNavigate?.();
              }}
            >
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-ink shadow-inner'
                    : 'text-muted hover:bg-slate-100'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  isActive ? 'bg-primary text-ink' : 'bg-slate-100 text-muted'
                }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {!isMobile && (
        <p className="mt-6 px-2 text-xs text-muted">
          © {new Date().getFullYear()} TalentFlow. Todos os direitos reservados.
        </p>
      )}
    </div>
  );
};