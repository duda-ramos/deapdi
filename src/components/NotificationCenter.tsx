import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
  Trophy,
  Target,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, NotificationPreferences, NotificationStats } from '../services/notifications';
import type { Notification } from '../types';
import { supabase } from '../lib/supabase';
import { memoryMonitor } from '../utils/memoryMonitor';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const subscriptionRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(-1);
  const notificationRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keyboard shortcuts for the notification panel
  useKeyboardShortcuts({
    enabled: isOpen,
    shortcuts: [
      {
        key: 'Escape',
        callback: () => {
          setIsOpen(false);
          bellButtonRef.current?.focus();
        },
        description: 'Close notification panel'
      }
    ]
  });

  // Handle keyboard navigation within the notification list
  const handleNotificationKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < notifications.length - 1) {
          setActiveNotificationIndex(index + 1);
          notificationRefs.current[index + 1]?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          setActiveNotificationIndex(index - 1);
          notificationRefs.current[index - 1]?.focus();
        }
        break;
      case 'Home':
        event.preventDefault();
        setActiveNotificationIndex(0);
        notificationRefs.current[0]?.focus();
        break;
      case 'End': {
        event.preventDefault();
        const lastIndex = notifications.length - 1;
        setActiveNotificationIndex(lastIndex);
        notificationRefs.current[lastIndex]?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const notification = notifications[index];
        if (notification && !notification.read) {
          handleMarkAsRead(notification.id);
        }
        break;
      }
      case 'Delete':
      case 'Backspace': {
        event.preventDefault();
        const notifToDelete = notifications[index];
        if (notifToDelete) {
          handleDelete(notifToDelete.id);
        }
        break;
      }
      default:
        break;
    }
  }, [notifications]);

  // Memoize functions to prevent unnecessary re-renders
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured
      if (!supabase) {
        console.warn('🔔 NotificationCenter: Supabase not configured, using empty state');
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      const [allNotifications, unreadNotifications] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getNotifications(user.id, true)
      ]);
      
      setNotifications(allNotifications || []);
      setUnreadCount(unreadNotifications?.length || 0);
      memoryMonitor.logMemoryUsage('NotificationCenter', 'Notifications loaded');
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    
    try {
      const prefs = await notificationService.getPreferences(user.id);
      setPreferences(prefs);
      memoryMonitor.logMemoryUsage('NotificationCenter', 'Preferences loaded');
    } catch (error) {
      console.warn('Error loading preferences, using defaults:', error);
      setPreferences(notificationService.getDefaultPreferences(user.id));
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check if Supabase is properly configured
      if (!supabase) {
        console.warn('🔔 NotificationCenter: Supabase not configured, using default stats');
        setStats(notificationService.getDefaultStats());
        return;
      }
      
      const statsData = await notificationService.getStats(user.id);
      setStats(statsData);
      memoryMonitor.logMemoryUsage('NotificationCenter', 'Stats loaded');
    } catch (error) {
      // Handle all connection errors gracefully
      console.warn('🔔 NotificationCenter: Connection error loading stats, using defaults');
      setStats(notificationService.getDefaultStats());
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return () => {};
    }

    // Log memory usage on component mount
    memoryMonitor.logMemoryUsage('NotificationCenter', 'Component mounted');

    loadNotifications();
    loadPreferences();
    loadStats();
    const unsubscribe = setupNotificationSubscription();

    // Request browser notification permission
    notificationService.requestBrowserPermission();

    return () => {
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        memoryMonitor.logMemoryUsage('NotificationCenter', 'Subscription cleaned up');
      }
      
      // Call the unsubscribe function
      unsubscribe();
      memoryMonitor.logMemoryUsage('NotificationCenter', 'Component unmounted - cleanup complete');
    };
  }, [user, loadNotifications, loadPreferences, loadStats, reconnectAttempts]);

  /**
   * Configures the real-time notification subscription.
   * Always returns a cleanup function (noop when setup fails) so the caller can safely unsubscribe.
   */
  const setupNotificationSubscription = (): (() => void) => {
    if (!user) {
      return () => {};
    }

    // Check if Supabase is properly configured
    if (!supabase) {
      console.warn('🔔 NotificationCenter: Supabase not configured, skipping real-time subscription');
      setSubscriptionStatus('disconnected');
      return () => {};
    }

    console.log('🔔 NotificationCenter: Setting up subscription, attempt:', reconnectAttempts + 1);
    setSubscriptionStatus('connecting');

    try {
      subscriptionRef.current = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          console.log('🔔 NotificationCenter: New notification received:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setSubscriptionStatus('connected');
          setReconnectAttempts(0);
          memoryMonitor.logMemoryUsage('NotificationCenter', 'New notification received');
          
          // Show browser notification
          notificationService.showBrowserNotification(
            newNotification.title,
            newNotification.message
          );
        },
        (status) => {
          console.log('🔔 NotificationCenter: Subscription status changed:', status);
          
          if (status === 'SUBSCRIBED') {
            setSubscriptionStatus('connected');
            setReconnectAttempts(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setSubscriptionStatus('disconnected');
            
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.pow(2, reconnectAttempts) * 1000;
              console.log(`🔔 NotificationCenter: Reconnecting in ${delay}ms...`);
              
              setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
              }, delay);
            }
          }
        }
      );

      return () => {
        console.log('🔔 NotificationCenter: Cleaning up subscription');
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    } catch (error) {
      console.error('🔔 NotificationCenter: Subscription setup failed:', error);
      setSubscriptionStatus('disconnected');
      // Always provide a cleanup function so callers can safely unsubscribe even when setup fails
      return () => {};
    }
  };



  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleUpdatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    try {
      const updated = await notificationService.updatePreferences(user.id, updates);
      setPreferences(updated);
    } catch (error) {
      console.warn('Error updating preferences:', error);
      // Update local state even if backend fails
      if (preferences) {
        setPreferences({ ...preferences, ...updates });
      }
    }
  };

  const handleCreateTestNotifications = async () => {
    if (!user) return;
    
    try {
      await notificationService.createTestNotifications(user.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error creating test notifications:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type'], category?: string) => {
    if (category) {
      switch (category) {
        case 'pdi_approved':
        case 'pdi_rejected':
          return <Target size={16} className="text-blue-500" aria-hidden="true" />;
        case 'task_assigned':
          return <CheckCircle size={16} className="text-green-500" aria-hidden="true" />;
        case 'achievement_unlocked':
          return <Trophy size={16} className="text-yellow-500" aria-hidden="true" />;
        case 'mentorship_scheduled':
        case 'mentorship_cancelled':
          return <Calendar size={16} className="text-purple-500" aria-hidden="true" />;
        case 'group_invitation':
          return <Users size={16} className="text-indigo-500" aria-hidden="true" />;
        default:
          break;
      }
    }

    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" aria-hidden="true" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" aria-hidden="true" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" aria-hidden="true" />;
      default: return <Info size={16} className="text-blue-500" aria-hidden="true" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getConnectionStatusColor = () => {
    switch (subscriptionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (subscriptionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        ref={bellButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Centro de notificações${unreadCount > 0 ? `, ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : ''}`}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        aria-haspopup="true"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center"
            aria-label={`${unreadCount} ${unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
        
        {/* Connection Status Indicator */}
        <div 
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
            subscriptionStatus === 'connected' ? 'bg-green-500' :
            subscriptionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Panel */}
            <motion.div
              ref={panelRef}
              id="notification-panel"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Painel de notificações"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notificações
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      aria-label="Configurações de notificações"
                    >
                      <Settings size={16} aria-hidden="true" />
                    </button>
                    <button
                      onClick={loadNotifications}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      aria-label="Atualizar notificações"
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      aria-label="Fechar painel de notificações"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {/* Stats and Actions */}
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-2 text-sm"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span className={getConnectionStatusColor()} aria-hidden="true">●</span>
                    <span className="text-gray-600">{getConnectionStatusText()}</span>
                    {stats && (
                      <Badge variant="default" size="sm">
                        {stats.notifications_today} hoje
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                        aria-label="Marcar todas as notificações como lidas"
                      >
                        <Check size={12} className="mr-1" aria-hidden="true" />
                        Marcar todas
                      </Button>
                    )}
                    
                    {import.meta.env.DEV && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCreateTestNotifications}
                        className="text-xs"
                        aria-label="Criar notificações de teste"
                      >
                        Teste
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center" role="status" aria-live="polite">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
                    <span className="sr-only">Carregando notificações...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500" role="status" aria-live="polite">
                    <Bell size={32} className="mx-auto mb-2 text-gray-300" aria-hidden="true" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100" role="listbox" aria-label="Lista de notificações">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        ref={(el) => { notificationRefs.current[index] = el; }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                          !notification.read ? 'bg-blue-50' : ''
                        } ${activeNotificationIndex === index ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                        role="option"
                        aria-selected={activeNotificationIndex === index}
                        tabIndex={index === 0 ? 0 : -1}
                        onKeyDown={(e) => handleNotificationKeyDown(e, index)}
                        onFocus={() => setActiveNotificationIndex(index)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <p className="text-xs text-gray-400">
                                    {new Date(notification.created_at).toLocaleString('pt-BR')}
                                  </p>
                                  {notification.category && (
                                    <Badge variant="default" size="sm">
                                      {notification.category.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    aria-label={`Marcar "${notification.title}" como lida`}
                                  >
                                    <Check size={14} aria-hidden="true" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(notification.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  aria-label={`Excluir notificação "${notification.title}"`}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Action URL */}
                            {notification.action_url && (
                              <button
                                onClick={() => {
                                  window.location.href = notification.action_url!;
                                  if (!notification.read) {
                                    handleMarkAsRead(notification.id);
                                  }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                                aria-label={`Ver detalhes de "${notification.title}"`}
                              >
                                Ver detalhes →
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <Modal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        title="Preferências de Notificação"
        size="lg"
      >
        {preferences && (
          <div className="space-y-6">
            {/* Statistics */}
            {stats && (
              <Card className="p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-3">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total de notificações:</span>
                    <span className="font-medium ml-2">{stats.total_notifications}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Não lidas:</span>
                    <span className="font-medium ml-2">{stats.unread_notifications}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Hoje:</span>
                    <span className="font-medium ml-2">{stats.notifications_today}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Tipo mais comum:</span>
                    <span className="font-medium ml-2">{stats.most_common_type}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Notification Types */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Tipos de Notificação</h4>
              <div className="space-y-3">
                {[
                  { key: 'pdi_approved', label: 'PDI Aprovado', icon: <CheckCircle size={16} className="text-green-500" aria-hidden="true" /> },
                  { key: 'pdi_rejected', label: 'PDI Rejeitado', icon: <AlertTriangle size={16} className="text-yellow-500" aria-hidden="true" /> },
                  { key: 'task_assigned', label: 'Tarefa Atribuída', icon: <Target size={16} className="text-blue-500" aria-hidden="true" /> },
                  { key: 'achievement_unlocked', label: 'Conquista Desbloqueada', icon: <Trophy size={16} className="text-yellow-500" aria-hidden="true" /> },
                  { key: 'mentorship_scheduled', label: 'Mentoria Agendada', icon: <Calendar size={16} className="text-purple-500" aria-hidden="true" /> },
                  { key: 'mentorship_cancelled', label: 'Mentoria Cancelada', icon: <X size={16} className="text-red-500" aria-hidden="true" /> },
                  { key: 'group_invitation', label: 'Convite para Grupo', icon: <Users size={16} className="text-indigo-500" aria-hidden="true" /> },
                  { key: 'deadline_reminder', label: 'Lembrete de Prazo', icon: <AlertCircle size={16} className="text-orange-500" aria-hidden="true" /> }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                        onChange={(e) => handleUpdatePreferences({
                          [item.key]: e.target.checked
                        })}
                        className="sr-only peer"
                        aria-checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                        aria-label={`Ativar notificações de ${item.label}`}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" aria-hidden="true"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Methods */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Métodos de Entrega</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell size={16} className="text-blue-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-900">Notificações no Sistema</span>
                  </div>
                  <span className="text-sm text-gray-600">Sempre ativo</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg" aria-hidden="true">📧</span>
                    <span className="text-sm font-medium text-gray-900">Email</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={preferences.email_notifications}
                      onChange={(e) => handleUpdatePreferences({
                        email_notifications: e.target.checked
                      })}
                      className="sr-only peer"
                      aria-checked={preferences.email_notifications}
                      aria-label="Ativar notificações por email"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" aria-hidden="true"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg" aria-hidden="true">🔔</span>
                    <span className="text-sm font-medium text-gray-900">Push (Navegador)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={preferences.push_notifications}
                      onChange={(e) => handleUpdatePreferences({
                        push_notifications: e.target.checked
                      })}
                      className="sr-only peer"
                      aria-checked={preferences.push_notifications}
                      aria-label="Ativar notificações push no navegador"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" aria-hidden="true"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Status da Conexão</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2" role="status" aria-live="polite" aria-atomic="true">
                  <div className={`w-2 h-2 rounded-full ${
                    subscriptionStatus === 'connected' ? 'bg-green-500' :
                    subscriptionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} aria-hidden="true" />
                  <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
                </div>
                {subscriptionStatus === 'disconnected' && reconnectAttempts < maxReconnectAttempts && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReconnectAttempts(0)}
                    aria-label="Tentar reconectar ao servidor de notificações"
                  >
                    Reconectar
                  </Button>
                )}
              </div>
              {reconnectAttempts >= maxReconnectAttempts && (
                <p className="text-xs text-red-600 mt-2" role="alert" aria-live="assertive">
                  Máximo de tentativas de reconexão atingido. Recarregue a página.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowPreferences(false)}
                aria-label="Fechar preferências de notificações"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};