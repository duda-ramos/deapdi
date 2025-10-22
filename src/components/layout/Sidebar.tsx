import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  TestTube,
  ClipboardList,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
  subItems?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'profile', label: 'Meu Perfil', icon: <User size={20} />, path: '/profile', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'career', label: 'Trilha de Carreira', icon: <TrendingUp size={20} />, path: '/career', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'competencies', label: 'Competências', icon: <BarChart3 size={20} />, path: '/competencies', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'pdi', label: 'PDI', icon: <Target size={20} />, path: '/pdi', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'groups', label: 'Grupos de Ação', icon: <Users size={20} />, path: '/groups', roles: ['admin', 'hr', 'manager', 'employee'] },
  { id: 'mentorship', label: 'Mentoria', icon: <Users size={20} />, path: '/mentorship', roles: ['admin', 'hr', 'manager', 'employee'] },
  { 
    id: 'mental-health', 
    label: 'Bem-estar', 
    icon: <Brain size={20} />, 
    path: '/mental-health', 
    roles: ['admin', 'manager', 'employee'],
    subItems: [
      { id: 'mental-health-record', label: 'Registro Psicológico', icon: <FileText size={16} />, path: '/mental-health/record', roles: ['admin', 'manager', 'employee'] },
      { id: 'mental-health-analytics', label: 'Análises', icon: <BarChart3 size={16} />, path: '/mental-health/analytics', roles: ['admin', 'manager', 'employee'] },
      { id: 'mental-health-forms', label: 'Formulários', icon: <ClipboardList size={16} />, path: '/mental-health/forms', roles: ['admin', 'manager', 'employee'] },
      { id: 'mental-health-tasks', label: 'Tarefas', icon: <CheckSquare size={16} />, path: '/mental-health/tasks', roles: ['admin', 'manager', 'employee'] }
    ]
  },
  { 
    id: 'wellness-admin', 
    label: 'Bem-estar', 
    icon: <Brain size={20} />, 
    path: '/wellness-admin', 
    roles: ['admin']
  },
  { 
    id: 'management', 
    label: 'Gestão', 
    icon: <Settings size={20} />, 
    path: '/management', 
    roles: ['admin', 'hr', 'manager'],
    subItems: [
      { id: 'people-management', label: 'Gestão de Pessoas', icon: <Users size={16} />, path: '/people', roles: ['admin', 'hr'] },
      { id: 'teams-management', label: 'Gestão de Times', icon: <Building size={16} />, path: '/teams', roles: ['admin', 'hr'] },
      { id: 'career-management', label: 'Gestão de Trilhas', icon: <TrendingUp size={16} />, path: '/career-management', roles: ['admin', 'hr'] },
      { id: 'evaluations-management', label: 'Gestão de Avaliações', icon: <ClipboardList size={16} />, path: '/evaluations', roles: ['admin', 'hr'] },
      { id: 'manager-feedback', label: 'Feedback do Gestor', icon: <MessageSquare size={16} />, path: '/manager-feedback', roles: ['manager'] }
    ]
  },
  { id: 'mental-health-admin', label: 'Portal do Psicólogo', icon: <Brain size={20} />, path: '/mental-health/admin', roles: ['hr'] },
  { id: 'reports', label: 'Relatórios', icon: <FileText size={20} />, path: '/reports', roles: ['admin', 'hr', 'manager'] },
  { id: 'users', label: 'Criar Usuários', icon: <UserCog size={20} />, path: '/users', roles: ['admin', 'hr'] },
  { id: 'hr', label: 'Área de RH', icon: <Heart size={20} />, path: '/hr', roles: ['admin', 'hr'] },
  { id: 'hr-calendar', label: 'Calendário', icon: <Calendar size={20} />, path: '/hr-calendar', roles: ['admin', 'hr'] },
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredItems = sidebarItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const isItemActive = (item: SidebarItem) => {
    if (location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className={`flex h-full min-h-0 w-full flex-col ${isMobile ? '' : 'px-4 pb-6'}`}>
      <div className={`${isMobile ? 'px-1' : 'px-2'} mb-6 flex shrink-0 items-center gap-3 pt-6`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-ink shadow-soft">
          <Trophy className="text-ink" size={22} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">TalentFlow</p>
          <p className="truncate text-xs text-muted">Desenvolvimento & Gamificação</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Principal">
        {filteredItems.map((item) => {
          const isActive = isItemActive(item);
          const isExpanded = expandedItems.includes(item.id);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.id}>
              {hasSubItems ? (
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-ink shadow-inner'
                      : 'text-muted hover:bg-slate-100'
                  }`}
                >
                  <Link
                    to={item.path}
                    className="flex flex-1 items-center gap-3 text-current no-underline"
                    onClick={() => onNavigate?.()}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        isActive ? 'bg-primary text-ink' : 'bg-slate-100 text-muted'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleExpanded(item.id);
                    }}
                    aria-label={isExpanded ? 'Recolher subitens' : 'Expandir subitens'}
                    aria-expanded={isExpanded}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-current hover:bg-slate-200 focus:outline-none"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={16} />
                    </motion.div>
                  </button>
                </motion.div>
              ) : (
                <Link
                  to={item.path}
                  className="block"
                  onClick={() => onNavigate?.()}
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
              )}

              {/* Sub-items */}
              <AnimatePresence>
                {hasSubItems && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            className="block"
                            onClick={() => onNavigate?.()}
                          >
                            <motion.div
                              whileHover={{ x: 4 }}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                isSubActive
                                  ? 'bg-primary/10 text-ink'
                                  : 'text-muted hover:bg-slate-50'
                              }`}
                            >
                              <span className={`flex h-6 w-6 items-center justify-center rounded-md ${
                                isSubActive ? 'bg-primary/20 text-ink' : 'bg-slate-100 text-muted'
                              }`}
                              >
                                {subItem.icon}
                              </span>
                              <span className="truncate">{subItem.label}</span>
                            </motion.div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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