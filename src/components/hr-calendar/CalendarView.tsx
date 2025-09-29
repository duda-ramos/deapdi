import React from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '../../services/hrCalendar';

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  viewMode: 'month' | 'week' | 'day';
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  filters: {
    types: string[];
    teams: string[];
    users: string[];
    status: string;
  };
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedDate,
  viewMode,
  onDateSelect,
  onEventClick,
  filters
}) => {
  const filteredEvents = events.filter(event => {
    if (filters.types.length > 0 && !filters.types.includes(event.type)) return false;
    if (filters.teams.length > 0 && event.team_id && !filters.teams.includes(event.team_id)) return false;
    if (filters.users.length > 0 && event.user_id && !filters.users.includes(event.user_id)) return false;
    if (filters.status !== 'all' && event.status !== filters.status) return false;
    return true;
  });

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      const checkDate = new Date(dateStr);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const dayEvents = getEventsForDate(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <motion.div
                key={index}
                whileHover={{ backgroundColor: '#F3F4F6' }}
                className={`min-h-24 p-2 border-b border-r border-gray-200 cursor-pointer transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' :
                  isToday ? 'bg-blue-50' :
                  isSelected ? 'bg-blue-100' :
                  isWeekend ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => onDateSelect(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 
                  isSelected ? 'text-blue-700' :
                  !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="px-2 py-1 rounded text-xs text-white cursor-pointer truncate"
                      style={{ backgroundColor: event.color }}
                      title={event.title}
                    >
                      {event.title}
                    </motion.div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {days.map((day) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className={`p-4 text-center ${isToday ? 'bg-blue-100' : ''}`}>
                <div className="text-sm font-medium text-gray-700">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 min-h-96">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={day.toISOString()}
                className={`p-3 border-r border-gray-200 cursor-pointer ${
                  isWeekend ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => onDateSelect(day)}
              >
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="px-2 py-1 rounded text-xs text-white cursor-pointer"
                      style={{ backgroundColor: event.color }}
                    >
                      {event.title}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {selectedDate.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhum evento neste dia</p>
            </div>
          ) : (
            dayEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => onEventClick(event)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600">{event.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Tipo: {hrCalendarService.getEventTypeLabel(event.type)}</span>
                      {event.user && <span>Usuário: {event.user.name}</span>}
                      {event.team && <span>Equipe: {event.team.name}</span>}
                    </div>
                  </div>
                  <Badge variant={hrCalendarService.getStatusColor(event.status)}>
                    {hrCalendarService.getStatusLabel(event.status)}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};