import React, { useState } from 'react';
import { Download, FileText, Eye, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  exportFacilitiesReport,
  generateSampleReport,
  FacilitiesReportData,
  InstallationItem,
  ProjectInfo
} from '../../utils/facilitiesPdfReport';

/**
 * Componente para gerar relatórios PDF de gestão de instalações
 * Com design moderno e profissional
 */
export const FacilitiesReportGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<FacilitiesReportData | null>(null);

  // Função para gerar relatório de exemplo
  const handleGenerateSample = () => {
    setLoading(true);
    try {
      generateSampleReport();
      alert('Relatório de exemplo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar relatório personalizado
  const handleGenerateCustomReport = (data: FacilitiesReportData) => {
    setLoading(true);
    try {
      exportFacilitiesReport(data);
      alert('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 text-blue-500" size={28} />
            Gerador de Relatórios de Instalações
          </h2>
          <p className="text-gray-600 mt-1">
            Crie relatórios PDF profissionais com design moderno
          </p>
        </div>
        <Badge variant="info">Novo</Badge>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Design Profissional</h3>
          </div>
          <p className="text-sm text-gray-600">
            Layout moderno com cores semânticas, cards visuais e hierarquia clara
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Totalmente Configurável</h3>
          </div>
          <p className="text-sm text-gray-600">
            Personalize informações do projeto, instalações e galeria de fotos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Fácil Leitura</h3>
          </div>
          <p className="text-sm text-gray-600">
            Tabelas zebradas, ícones de status e organização visual otimizada
          </p>
        </Card>
      </div>

      {/* Features List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">✨ Recursos Incluídos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Cabeçalho com Gradiente</h4>
              <p className="text-sm text-gray-600">
                Design moderno com faixa decorativa e informações destacadas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Cards de Informações</h4>
              <p className="text-sm text-gray-600">
                Layout em cards com ícones e organização em colunas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Estatísticas Visuais</h4>
              <p className="text-sm text-gray-600">
                Cards coloridos com métricas e barra de progresso animada
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Cores Semânticas</h4>
              <p className="text-sm text-gray-600">
                Verde para concluído, amarelo para pendente, azul para info
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Tabelas Estilizadas</h4>
              <p className="text-sm text-gray-600">
                Linhas zebradas, ícones de status e bordas arredondadas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Galeria de Fotos</h4>
              <p className="text-sm text-gray-600">
                Grid organizado com legendas e bordas elegantes
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Rodapé Profissional</h4>
              <p className="text-sm text-gray-600">
                Paginação automática e informações de contato
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Impressão Otimizada</h4>
              <p className="text-sm text-gray-600">
                Formato A4, margens adequadas e quebra de página inteligente
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Ações Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGenerateSample}
            disabled={loading}
            className="flex items-center"
          >
            <Download size={18} className="mr-2" />
            {loading ? 'Gerando...' : 'Gerar Relatório de Exemplo'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              alert(
                'Para gerar um relatório personalizado, use a função exportFacilitiesReport() passando seus dados.'
              );
            }}
          >
            <Eye size={18} className="mr-2" />
            Ver Documentação
          </Button>
        </div>
      </Card>

      {/* Code Example */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">💻 Exemplo de Uso</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{`import { exportFacilitiesReport } from './utils/facilitiesPdfReport';

// Seus dados
const reportData = {
  projectInfo: {
    titulo: 'Nome do Projeto',
    cliente: 'Nome do Cliente',
    endereco: 'Endereço completo',
    email: 'contato@cliente.com',
    telefone: '(11) 9999-9999',
    responsavel: 'Nome do Responsável',
    dataInicio: '2025-01-01'
  },
  installations: [
    {
      codigo: 'INST-001',
      tipologia: 'Elétrica',
      descricao: 'Descrição da instalação',
      local: 'Local da instalação',
      status: 'concluido', // ou 'pendente'
      responsavel: 'Nome do responsável',
      dataConclusao: '2025-02-01'
    }
    // ... mais instalações
  ],
  photos: [
    {
      url: '/caminho/foto.jpg',
      legenda: 'Descrição da foto',
      itemCodigo: 'INST-001'
    }
    // ... mais fotos
  ]
};

// Gera o PDF
exportFacilitiesReport(reportData);`}</code>
          </pre>
        </div>
      </Card>

      {/* Color Palette Reference */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎨 Paleta de Cores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="w-full h-16 bg-blue-600 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Primary</p>
            <p className="text-xs text-gray-500">#2563EB</p>
          </div>
          <div>
            <div className="w-full h-16 bg-green-500 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Success (Concluído)</p>
            <p className="text-xs text-gray-500">#10B981</p>
          </div>
          <div>
            <div className="w-full h-16 bg-yellow-500 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Warning (Pendente)</p>
            <p className="text-xs text-gray-500">#F59E0B</p>
          </div>
          <div>
            <div className="w-full h-16 bg-gray-600 rounded-lg mb-2"></div>
            <p className="text-sm font-medium text-gray-900">Secondary</p>
            <p className="text-xs text-gray-500">#64748B</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FacilitiesReportGenerator;
