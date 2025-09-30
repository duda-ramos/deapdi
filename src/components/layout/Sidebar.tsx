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
  { id: 'hr-calendar', label: 'Calendário RH', icon: <Calendar size={20} />, path: '/hr-calendar', roles: ['admin', 'hr'] },
  { id: 'mental-health-admin', label: 'Saúde Mental (Admin)', icon: <Brain size={20} />, path: '/mental-health/admin', roles: ['hr'] },
  { id: 'career-management', label: 'Gerenciar Trilhas', icon: <TrendingUp size={20} />, path: '/career-management', roles: ['admin'] },
  { id: 'admin', label: 'Administração', icon: <Settings size={20} />, path: '/admin', roles: ['admin'] },
  { id: 'qa', label: 'Garantia de Qualidade', icon: <TestTube size={20} />, path: '/qa', roles: ['admin'] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  console.log('📋 Sidebar: Rendering with user:', !!user, 'at path:', location.pathname);

  const filteredItems = sidebarItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="bg-white border-r border-gray-200 h-full w-64 p-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
          <Trophy className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">TalentFlow</h1>
          <p className="text-xs text-gray-500">Desenvolvimento & Gamificação</p>
        </div>
      </div>

      <nav className="space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.id} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

    </div>
  );
};