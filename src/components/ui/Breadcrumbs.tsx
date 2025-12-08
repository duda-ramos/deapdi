import React, { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';

export interface BreadcrumbItem {
  /** Label a ser exibido */
  label: string;
  /** Caminho/URL (opcional, se não tiver é o item atual) */
  href?: string;
  /** Ícone opcional */
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  /** Items do breadcrumb (se não fornecido, usa rota automática) */
  items?: BreadcrumbItem[];
  /** Classe CSS adicional */
  className?: string;
  /** Máximo de items visíveis em mobile (padrão: 2) */
  mobileMaxItems?: number;
  /** Se deve mostrar ícone de home no primeiro item */
  showHomeIcon?: boolean;
  /** Separador customizado */
  separator?: React.ReactNode;
}

// Mapeamento de rotas para labels amigáveis
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  pdi: 'PDI',
  competencies: 'Competências',
  mentorship: 'Mentoria',
  wellness: 'Bem-estar',
  'mental-health': 'Saúde Mental',
  calendar: 'Calendário',
  profile: 'Perfil',
  administration: 'Administração',
  'user-management': 'Gestão de Usuários',
  'team-management': 'Gestão de Equipes',
  'career-track': 'Trilha de Carreira',
  'hr-area': 'Área de RH',
  'hr-calendar': 'Calendário RH',
  'action-groups': 'Grupos de Ações',
  'quality-assurance': 'Garantia de Qualidade',
  'people-management': 'Gestão de Pessoas',
  'analytics': 'Analytics',
  'evaluations': 'Avaliações',
  'wellness-admin': 'Admin Bem-estar',
  'wellness-library': 'Biblioteca de Bem-estar',
  'psychological-record': 'Prontuário Psicológico',
  // Sub-rotas
  new: 'Novo',
  edit: 'Editar',
  details: 'Detalhes',
  settings: 'Configurações',
  schedule: 'Agendar',
  history: 'Histórico',
  reports: 'Relatórios',
  checkin: 'Check-in',
  resources: 'Recursos',
};

// Hierarquia de rotas para breadcrumbs automáticos
const routeHierarchy: Record<string, string[]> = {
  'pdi': ['dashboard'],
  'pdi/:id': ['dashboard', 'pdi'],
  'pdi/:id/competency/:competencyId': ['dashboard', 'pdi', 'pdi/:id'],
  'competencies': ['dashboard'],
  'competencies/:id': ['dashboard', 'competencies'],
  'mentorship': ['dashboard'],
  'mentorship/schedule': ['dashboard', 'mentorship'],
  'mentorship/sessions': ['dashboard', 'mentorship'],
  'wellness': ['dashboard'],
  'wellness/checkin': ['dashboard', 'wellness'],
  'mental-health': ['dashboard'],
  'mental-health/checkin': ['dashboard', 'mental-health'],
  'calendar': ['dashboard'],
  'calendar/events': ['dashboard', 'calendar'],
  'administration': ['dashboard'],
  'administration/competencies': ['dashboard', 'administration'],
  'administration/users': ['dashboard', 'administration'],
  'user-management': ['dashboard', 'administration'],
  'team-management': ['dashboard', 'administration'],
  'profile': ['dashboard'],
  'profile/settings': ['dashboard', 'profile'],
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items: providedItems,
  className = '',
  mobileMaxItems = 2,
  showHomeIcon = true,
  separator,
}) => {
  const location = useLocation();
  const params = useParams();

  // Gerar items automaticamente a partir da rota se não foram fornecidos
  const items = useMemo((): BreadcrumbItem[] => {
    if (providedItems && providedItems.length > 0) {
      return providedItems;
    }

    const pathParts = location.pathname.split('/').filter(Boolean);
    
    // Dashboard é sempre o primeiro
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard', icon: showHomeIcon ? <Home size={16} /> : undefined }
    ];

    // Construir breadcrumbs a partir do path
    let currentPath = '';
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      
      // Skip dashboard (já adicionado)
      if (part === 'dashboard') continue;
      
      // Verificar se é um ID (UUID ou número)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part) || 
                   /^\d+$/.test(part);
      
      if (isId) {
        // Para IDs, usar contexto ou label genérico
        // O label pode ser substituído via props ou contexto
        breadcrumbs.push({
          label: 'Detalhes',
          href: i < pathParts.length - 1 ? currentPath : undefined,
        });
      } else {
        const label = routeLabels[part] || capitalizeFirst(part.replace(/-/g, ' '));
        const isLast = i === pathParts.length - 1;
        
        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath,
        });
      }
    }

    return breadcrumbs;
  }, [providedItems, location.pathname, showHomeIcon]);

  // Para mobile, colapsar items intermediários
  const mobileItems = useMemo((): BreadcrumbItem[] => {
    if (items.length <= mobileMaxItems) return items;
    
    // Mostrar primeiro e último(s)
    const first = items[0];
    const last = items.slice(-Math.min(mobileMaxItems - 1, items.length - 1));
    
    return [
      first,
      { label: '...', href: undefined }, // Placeholder para items colapsados
      ...last,
    ];
  }, [items, mobileMaxItems]);

  const Separator = separator || (
    <ChevronRight 
      size={16} 
      className="text-slate-400 flex-shrink-0" 
      aria-hidden="true" 
    />
  );

  if (items.length <= 1) {
    return null; // Não mostrar breadcrumb se só tem um item
  }

  return (
    <nav 
      aria-label="Breadcrumbs" 
      className={`text-sm ${className}`}
    >
      {/* Desktop */}
      <ol 
        role="list"
        className="hidden sm:flex items-center gap-2"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && Separator}
              
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast ? 'text-slate-900 font-medium' : 'text-slate-600'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile (colapsado) */}
      <ol 
        role="list"
        className="flex sm:hidden items-center gap-2"
      >
        {mobileItems.map((item, index) => {
          const isLast = index === mobileItems.length - 1;
          const isEllipsis = item.label === '...';
          
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && Separator}
              
              {isEllipsis ? (
                <span className="text-slate-400">
                  <MoreHorizontal size={16} aria-label="mais itens" />
                </span>
              ) : item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {item.icon}
                  <span className="max-w-[100px] truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast ? 'text-slate-900 font-medium' : 'text-slate-600'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="max-w-[120px] truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// =====================================================
// HOOK useBreadcrumbs
// =====================================================

interface UseBreadcrumbsOptions {
  /** Items customizados para substituir os automáticos */
  customItems?: BreadcrumbItem[];
  /** Dados dinâmicos (ex: nome do PDI, nome do usuário) */
  dynamicLabels?: Record<string, string>;
}

export function useBreadcrumbs(options: UseBreadcrumbsOptions = {}): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    if (options.customItems && options.customItems.length > 0) {
      return options.customItems;
    }

    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> }
    ];

    let currentPath = '';
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += `/${part}`;
      
      if (part === 'dashboard') continue;
      
      // Verificar se é um ID
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part) || 
                   /^\d+$/.test(part);
      
      let label: string;
      
      if (isId) {
        // Usar label dinâmico se disponível
        const dynamicKey = pathParts[i - 1]; // Usar a parte anterior como chave
        label = options.dynamicLabels?.[dynamicKey] || 
                options.dynamicLabels?.[part] || 
                'Detalhes';
      } else {
        label = options.dynamicLabels?.[part] || 
                routeLabels[part] || 
                capitalizeFirst(part.replace(/-/g, ' '));
      }
      
      const isLast = i === pathParts.length - 1;
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }

    return breadcrumbs;
  }, [location.pathname, options.customItems, options.dynamicLabels]);
}

// =====================================================
// BREADCRUMB CONTEXT (para labels dinâmicos)
// =====================================================

interface BreadcrumbContextValue {
  setDynamicLabel: (key: string, label: string) => void;
  clearDynamicLabel: (key: string) => void;
  dynamicLabels: Record<string, string>;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue | null>(null);

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dynamicLabels, setDynamicLabels] = React.useState<Record<string, string>>({});

  const setDynamicLabel = React.useCallback((key: string, label: string) => {
    setDynamicLabels(prev => ({ ...prev, [key]: label }));
  }, []);

  const clearDynamicLabel = React.useCallback((key: string) => {
    setDynamicLabels(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ setDynamicLabel, clearDynamicLabel, dynamicLabels }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export function useBreadcrumbContext() {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return context;
}

// =====================================================
// BREADCRUMBS PRÉ-CONFIGURADOS
// =====================================================

export const breadcrumbPresets = {
  // PDI
  pdiList: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'PDI' },
  ],

  pdiDetails: (userName?: string): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'PDI', href: '/pdi' },
    { label: userName || 'Detalhes' },
  ],

  pdiCompetency: (userName?: string, competencyName?: string): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'PDI', href: '/pdi' },
    { label: userName || 'Usuário', href: '/pdi' }, // Link genérico
    { label: `Competência: ${competencyName || 'Detalhes'}` },
  ],

  // Competências
  competenciesList: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Competências' },
  ],

  competencyDetails: (name?: string): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Competências', href: '/competencies' },
    { label: name || 'Detalhes' },
  ],

  // Mentoria
  mentorshipList: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Mentoria' },
  ],

  mentorshipSchedule: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Mentoria', href: '/mentorship' },
    { label: 'Agendar Sessão' },
  ],

  // Bem-estar
  wellnessList: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Bem-estar' },
  ],

  wellnessCheckin: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Bem-estar', href: '/mental-health' },
    { label: 'Check-in Emocional' },
  ],

  // Calendário
  calendar: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Calendário' },
  ],

  calendarEvent: (eventName?: string): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Calendário', href: '/hr-calendar' },
    { label: eventName || 'Evento' },
  ],

  // Administração
  administration: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Administração' },
  ],

  adminCompetencies: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Administração', href: '/administration' },
    { label: 'Competências' },
  ],

  adminUsers: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Administração', href: '/administration' },
    { label: 'Usuários' },
  ],

  // Perfil
  profile: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Perfil' },
  ],

  profileSettings: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard', icon: <Home size={16} /> },
    { label: 'Perfil', href: '/profile' },
    { label: 'Configurações' },
  ],
};

// =====================================================
// UTILITÁRIOS
// =====================================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

Breadcrumbs.displayName = 'Breadcrumbs';
BreadcrumbProvider.displayName = 'BreadcrumbProvider';
