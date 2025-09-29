import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Gift,
  Briefcase,
  Sun,
  Coffee,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hrCalendarService, CalendarEvent, CalendarRequest, CalendarStats } from '../services/hrCalendar';
import { Card } from '../components/ui/Card';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorMessage } from '../utils/errorMessages';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { CalendarView } from '../components/hr-calendar/CalendarView';
import { EventModal } from '../components/hr-calendar/EventModal';
import { RequestForm } from '../components/hr-calendar/RequestForm';
import { ApprovalQueue } from '../components/hr-calendar/ApprovalQueue';
import { CalendarFilters } from '../components/hr-calendar/CalendarFilters';
import { CalendarLegend } from '../components/hr-calendar/CalendarLegend';
import { CalendarExport } from '../components/hr-calendar/CalendarExport';

const HRCalendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [requests, setRequests] = useState<CalendarRequest[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  const [filters, setFilters] = useState({
    types: [] as string[],
    teams: [] as string[],
    users: [] as string[],
    status: 'all'
  });

  const tabs = [
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={16} /> },
    { id: 'requests', label: 'Solicitações', icon: <Clock size={16} /> },
    { id: 'approvals', label: 'Aprovações', icon: <CheckCircle size={16} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={16} /> }
  ];

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, selectedDate, viewMode]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range based on view mode
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const [eventsData, requestsData, statsData] = await Promise.all([
        hrCalendarService.getEvents({
          start_date: startDate,
          end_date: endDate
        }),
        hrCalendarService.getRequests(),
        hrCalendarService.getStats()
      ]);

      setEvents(eventsData || []);
      setRequests(requestsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados do calendário');
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = (): string => {
    const date = new Date(selectedDate);
    switch (viewMode) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      case 'day':
        return date.toISOString().split('T')[0];
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const getViewEndDate = (): string => {
    const date = new Date(selectedDate);
    switch (viewMode) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() - date.getDay() + 6);
        return endOfWeek.toISOString().split('T')[0];
      case 'day':
        return date.toISOString().split('T')[0];
      default:
        return date.toISOString().split('T')[0];
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      await hrCalendarService.createEvent({
        ...eventData,
        created_by: user?.id
      });
      setShowEventModal(false);
      loadCalendarData();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleCreateRequest = async (requestData: any) => {
    try {
      await hrCalendarService.createRequest({
        ...requestData,
        requester_id: user?.id
      });
      setShowRequestModal(false);
      loadCalendarData();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleApproveRequest = async (requestId: string, comments?: string) => {
    try {
      await hrCalendarService.approveRequest(requestId, user?.id || '', comments);
      loadCalendarData();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      await hrCalendarService.rejectRequest(requestId, user?.id || '', reason);
      loadCalendarData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };

  const getDateRangeLabel = (): string => {
    const date = new Date(selectedDate);
    
    switch (viewMode) {
      case 'month':
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`;
      case 'day':
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  const canManageCalendar = user?.role === 'hr' || user?.role === 'admin';
  const canApproveRequests = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin';

  if (!user) {
    return <LoadingScreen message="Carregando..." />;
  }

  if (loading) {
    return <LoadingScreen message="Carregando calendário..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário RH</h1>
          <p className="text-gray-600 mt-1">Gestão de eventos, férias e ausências</p>
        </div>
        <ErrorMessage error={error} onRetry={loadCalendarData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-3 text-blue-500" size={28} />
            Calendário RH
          </h1>
          <p className="text-gray-600 mt-1">Gestão de eventos, férias e ausências</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowExportModal(true)}
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowRequestModal(true)}>
            <Plus size={16} className="mr-2" />
            Nova Solicitação
          </Button>
          {canManageCalendar && (
            <Button onClick={() => setShowEventModal(true)}>
              <Plus size={16} className="mr-2" />
              Novo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_events}</div>
                <div className="text-sm text-gray-600">Total Eventos</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending_requests}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.upcoming_birthdays}</div>
                <div className="text-sm text-gray-600">Aniversários</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.upcoming_anniversaries}</div>
                <div className="text-sm text-gray-600">Empresa</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.team_absences_today}</div>
                <div className="text-sm text-gray-600">Ausentes Hoje</div>
              </div>
            </div>
          </div>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.vacation_requests_this_month}</div>
                <div className="text-sm text-gray-600">Férias/Mês</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Controls */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <h2 className="text-lg font-semibold text-gray-900 min-w-0">
                    {getDateRangeLabel()}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoje
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['month', 'week', 'day'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Calendar */}
            <div className="lg:col-span-3">
              <CalendarView
                events={events}
                selectedDate={selectedDate}
                viewMode={viewMode}
                onDateSelect={setSelectedDate}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setShowEventModal(true);
                }}
                filters={filters}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mini Calendar */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Navegação</h3>
                <div className="space-y-2">
                  <input
                    type="month"
                    value={selectedDate.toISOString().slice(0, 7)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </Card>

              {/* Filters */}
              <CalendarFilters
                filters={filters}
                onFiltersChange={setFilters}
                events={events}
              />

              {/* Legend */}
              <CalendarLegend />

              {/* Upcoming Events */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Próximos Eventos</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {events
                    .filter(e => new Date(e.start_date) >= new Date())
                    .slice(0, 5)
                    .map((event) => (
                      <div key={event.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.start_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {events.filter(e => new Date(e.start_date) >= new Date()).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum evento próximo
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Minhas Solicitações</h3>
              <Button onClick={() => setShowRequestModal(true)}>
                <Plus size={16} className="mr-2" />
                Nova Solicitação
              </Button>
            </div>
            
            <div className="space-y-3">
              {requests
                .filter(r => r.requester_id === user?.id)
                .map((request) => (
                  <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {request.event_type === 'ferias' ? (
                            <Sun size={16} className="text-yellow-500" />
                          ) : (
                            <Coffee size={16} className="text-orange-500" />
                          )}
                          <h4 className="font-medium text-gray-900">
                            {request.event_type === 'ferias' ? 'Férias' : 'Day Off'}
                          </h4>
                        </div>
                        <Badge variant={hrCalendarService.getStatusColor(request.status)}>
                          {hrCalendarService.getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.days_requested} dia{request.days_requested !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Período:</span>
                        <p className="font-medium">
                          {new Date(request.start_date).toLocaleDateString('pt-BR')} - {new Date(request.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Motivo:</span>
                        <p className="font-medium">{request.reason}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Solicitado em:</span>
                        <p className="font-medium">{new Date(request.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    {request.comments && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-800">Comentários: {request.comments}</span>
                      </div>
                    )}

                    {request.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-red-800">Motivo da rejeição: {request.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              
              {requests.filter(r => r.requester_id === user?.id).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma solicitação encontrada</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && canApproveRequests && (
        <ApprovalQueue
          requests={requests.filter(r => r.status === 'pending')}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          userRole={user.role}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && canManageCalendar && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações do Calendário</h3>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  try {
                    const birthdayCount = await hrCalendarService.createBirthdayEvents();
                    const anniversaryCount = await hrCalendarService.createCompanyAnniversaryEvents();
                    alert(`Criados ${birthdayCount} aniversários e ${anniversaryCount} aniversários de empresa`);
                    loadCalendarData();
                  } catch (error) {
                    console.error('Error creating automatic events:', error);
                  }
                }}
              >
                <Gift size={16} className="mr-2" />
                Gerar Aniversários Automáticos
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings size={16} className="mr-2" />
                Configurações Avançadas
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onSave={handleCreateEvent}
        event={selectedEvent}
        canEdit={canManageCalendar}
      />

      {/* Request Modal */}
      <RequestForm
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleCreateRequest}
        userId={user.id}
      />

      {/* Export Modal */}
      <CalendarExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        events={events}
        filters={filters}
      />
    </div>
  );
};

export default HRCalendar;