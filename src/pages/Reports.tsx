import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Target,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reportService, PerformanceReport, TeamReport } from '../services/reports';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('performance');
  const [performanceData, setPerformanceData] = useState<PerformanceReport[]>([]);
  const [teamData, setTeamData] = useState<TeamReport[]>([]);
  const [competencyGaps, setCompetencyGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { value: 'performance', label: 'Performance Individual', icon: <TrendingUp size={16} /> },
    { value: 'team', label: 'Performance por Equipe', icon: <Users size={16} /> },
    { value: 'competency', label: 'Gap de Competências', icon: <Target size={16} /> },
    { value: 'engagement', label: 'Engajamento', icon: <BarChart3 size={16} /> }
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (selectedReport) {
        case 'performance':
          const perfData = await reportService.generatePerformanceReport();
          setPerformanceData(perfData);
          break;
        case 'team':
          const teamData = await reportService.generateTeamReport();
          setTeamData(teamData);
          break;
        case 'competency':
          const gapData = await reportService.generateCompetencyGapReport();
          setCompetencyGaps(gapData);
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (selectedReport) {
        case 'performance':
          data = performanceData;
          filename = 'relatorio_performance';
          break;
        case 'team':
          data = teamData;
          filename = 'relatorio_equipes';
          break;
        case 'competency':
          data = competencyGaps;
          filename = 'relatorio_competencias';
          break;
      }

      await reportService.exportToCSV(data, filename);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const performanceColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'position', label: 'Cargo' },
    { key: 'level', label: 'Nível' },
    { 
      key: 'points', 
      label: 'Pontos',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      )
    },
    { key: 'completedPDIs', label: 'PDIs Concluídos' },
    { 
      key: 'averageCompetencyRating', 
      label: 'Média Competências',
      render: (value: number) => (
        <span className={`font-medium ${
          value >= 4 ? 'text-green-600' : 
          value >= 3 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}
        </span>
      )
    },
    { key: 'achievementsCount', label: 'Conquistas' },
    { 
      key: 'engagementScore', 
      label: 'Engajamento',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                value >= 80 ? 'bg-green-500' : 
                value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    }
  ];

  const teamColumns = [
    { key: 'teamName', label: 'Equipe' },
    { key: 'memberCount', label: 'Membros' },
    { 
      key: 'averagePoints', 
      label: 'Média de Pontos',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{Math.round(value)}</span>
      )
    },
    { key: 'completedPDIs', label: 'PDIs Concluídos' },
    { 
      key: 'averageCompetencyRating', 
      label: 'Média Competências',
      render: (value: number) => (
        <span className={`font-medium ${
          value >= 4 ? 'text-green-600' : 
          value >= 3 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value.toFixed(1)}
        </span>
      )
    }
  ];

  const competencyColumns = [
    { key: 'competencyName', label: 'Competência' },
    { key: 'type', label: 'Tipo' },
    { key: 'profileName', label: 'Colaborador' },
    { key: 'position', label: 'Cargo' },
    { key: 'currentLevel', label: 'Nível Atual' },
    { key: 'targetLevel', label: 'Meta' },
    { 
      key: 'gap', 
      label: 'Gap',
      render: (value: number) => (
        <span className={`font-bold ${
          value >= 2 ? 'text-red-600' : 
          value >= 1 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {value.toFixed(1)}
        </span>
      )
    }
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'hr' && user.role !== 'manager')) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar os relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análises detalhadas e insights estratégicos</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={loadReportData}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Tipo de Relatório"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            options={reportTypes.map(type => ({ value: type.value, label: type.label }))}
          />
          <Input
            label="Data Início"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <Input
            label="Data Fim"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
          <div className="flex items-end">
            <Button variant="secondary" className="w-full">
              <Filter size={16} className="mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {selectedReport === 'performance' && (
        <div className="space-y-6">
          {/* Performance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="#3B82F6" name="Pontos" />
                <Bar dataKey="engagementScore" fill="#10B981" name="Engajamento" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Relatório Detalhado de Performance</h3>
            <Table
              columns={performanceColumns}
              data={performanceData}
              loading={loading}
              emptyMessage="Nenhum dado de performance encontrado"
            />
          </Card>
        </div>
      )}

      {selectedReport === 'team' && (
        <div className="space-y-6">
          {/* Team Performance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance por Equipe</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averagePoints" fill="#3B82F6" name="Média de Pontos" />
                <Bar dataKey="completedPDIs" fill="#10B981" name="PDIs Concluídos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Team Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Relatório Detalhado por Equipe</h3>
            <Table
              columns={teamColumns}
              data={teamData}
              loading={loading}
              emptyMessage="Nenhum dado de equipe encontrado"
            />
          </Card>
        </div>
      )}

      {selectedReport === 'competency' && (
        <div className="space-y-6">
          {/* Competency Gap Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Maiores Gaps de Competências</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competencyGaps.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencyName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gap" fill="#EF4444" name="Gap" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Competency Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Relatório Detalhado de Competências</h3>
            <Table
              columns={competencyColumns}
              data={competencyGaps}
              loading={loading}
              emptyMessage="Nenhum gap de competência encontrado"
            />
          </Card>
        </div>
      )}

      {selectedReport === 'engagement' && (
        <Card className="p-8 text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Relatório de Engajamento
          </h3>
          <p className="text-gray-600">
            Em desenvolvimento...
          </p>
        </Card>
      )}
    </div>
  );
};

export default Reports;