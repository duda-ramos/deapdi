import React from 'react';
import { LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../NotificationCenter';

interface HeaderProps {
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { user, signOut } = useAuth();

  console.log('🎯 Header: Rendering with user:', !!user);

  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-muted transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            onClick={onOpenMenu}
            aria-label="Abrir menu de navegação"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-ink sm:text-xl">
              Bem-vindo, {user?.name}! 👋
            </h2>
            <p className="hidden text-sm text-muted sm:block">Aqui está o resumo do seu desenvolvimento hoje.</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="order-2 w-full sm:order-1 sm:w-auto sm:max-w-xs lg:max-w-sm">
            <label className="sr-only" htmlFor="global-search">
              Buscar conteúdo
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                id="global-search"
                type="search"
                placeholder="Buscar..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink shadow-sm transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem]"
              />
            </div>
          </div>

          <div className="order-1 flex items-center gap-3 sm:order-2">
            <NotificationCenter />

            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                data-testid="logout-button"
                className="sm:hidden"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                data-testid="logout-button"
                className="hidden sm:inline-flex"
                aria-label="Sair"
              >
                <LogOut size={16} />
                <span className="ml-2 hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};