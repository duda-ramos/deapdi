import React from 'react';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../NotificationCenter';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  console.log('🎯 Header: Rendering with user:', !!user);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Bem-vindo, {user?.name}! 👋
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=150&h=150&fit=crop&crop=face'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};