import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface InstallationItem {
  codigo: string;
  tipologia: string;
  descricao: string;
  local: string;
  status: 'concluido' | 'pendente';
  responsavel?: string;
  dataInicio?: string;
  dataConclusao?: string;
  observacoes?: string;
}

export interface PhotoItem {
  url: string;
  legenda: string;
  itemCodigo?: string;
}

export interface ProjectInfo {
  titulo: string;
  cliente: string;
  endereco: string;
  email?: string;
  telefone?: string;
  responsavel: string;
  dataInicio: string;
  dataPrevisao?: string;
}

export interface FacilitiesReportData {
  projectInfo: ProjectInfo;
  installations: InstallationItem[];
  photos?: PhotoItem[];
}

// ==========================================
// PALETA DE CORES PROFISSIONAL
// ==========================================

const COLORS = {
  // Cores principais
  primary: '#2563EB',      // Azul principal
  primaryDark: '#1E40AF',  // Azul escuro
  secondary: '#64748B',    // Cinza azulado
  
  // Cores semânticas
  success: '#10B981',      // Verde para concluído
  warning: '#F59E0B',      // Amarelo/laranja para pendente
  danger: '#EF4444',       // Vermelho para alertas
  
  // Cores de fundo
  bgLight: '#F8FAFC',      // Fundo claro
  bgMedium: '#E2E8F0',     // Fundo médio
  bgDark: '#1E293B',       // Fundo escuro
  
  // Cores de texto
  textPrimary: '#1E293B',  // Texto principal
  textSecondary: '#64748B', // Texto secundário
  textLight: '#94A3B8',    // Texto claro
  white: '#FFFFFF',        // Branco
  
  // Cores de gradiente
  gradientStart: '#3B82F6',
  gradientEnd: '#1E40AF'
};

// ==========================================
// CLASSE PRINCIPAL DO GERADOR DE PDF
// ==========================================

export class FacilitiesPDFReport {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 0;
  private readonly lineHeight: number = 7;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  // ==========================================
  // MÉTODO PRINCIPAL DE GERAÇÃO
  // ==========================================

  public generate(data: FacilitiesReportData): void {
    // Adiciona cabeçalho com design moderno
    this.addHeader(data.projectInfo);
    
    // Adiciona cards de informações do projeto
    this.addProjectInfoCards(data.projectInfo);
    
    // Adiciona estatísticas visuais
    this.addStatisticsCards(data.installations);
    
    // Adiciona tabela de itens concluídos
    this.addInstallationsTable(
      data.installations.filter(item => item.status === 'concluido'),
      'Instalações Concluídas',
      COLORS.success
    );
    
    // Adiciona tabela de itens pendentes
    this.addInstallationsTable(
      data.installations.filter(item => item.status === 'pendente'),
      'Instalações Pendentes',
      COLORS.warning
    );
    
    // Adiciona galeria de fotos se houver
    if (data.photos && data.photos.length > 0) {
      this.addPhotoGallery(data.photos);
    }
    
    // Adiciona rodapés em todas as páginas
    this.addFooters();
    
    // Salva o PDF
    const filename = `relatorio-instalacoes-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename);
  }

  // ==========================================
  // CABEÇALHO MODERNO COM DESIGN PROFISSIONAL
  // ==========================================

  private addHeader(projectInfo: ProjectInfo): void {
    // Fundo gradiente do cabeçalho
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Faixa decorativa superior
    this.doc.setFillColor(COLORS.primaryDark);
    this.doc.rect(0, 0, this.pageWidth, 3, 'F');
    
    // Título do relatório
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(COLORS.white);
    this.doc.text('RELATÓRIO DE INSTALAÇÕES', this.pageWidth / 2, 18, { align: 'center' });
    
    // Subtítulo
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.bgLight);
    this.doc.text(projectInfo.titulo, this.pageWidth / 2, 27, { align: 'center' });
    
    // Data de geração
    this.doc.setFontSize(9);
    const dataGeracao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.doc.text(`Gerado em: ${dataGeracao}`, this.pageWidth / 2, 37, { align: 'center' });
    
    this.currentY = 50;
  }

  // ==========================================
  // CARDS DE INFORMAÇÕES DO PROJETO
  // ==========================================

  private addProjectInfoCards(projectInfo: ProjectInfo): void {
    const cardHeight = 35;
    const cardSpacing = 5;
    
    // Título da seção
    this.addSectionTitle('Informações do Projeto', 'info');
    
    // Card principal de informações
    const cardY = this.currentY;
    
    // Fundo do card com sombra sutil
    this.doc.setFillColor(COLORS.white);
    this.doc.roundedRect(this.margin, cardY, this.pageWidth - (2 * this.margin), cardHeight, 2, 2, 'F');
    
    // Borda do card
    this.doc.setDrawColor(COLORS.bgMedium);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, cardY, this.pageWidth - (2 * this.margin), cardHeight, 2, 2, 'S');
    
    // Informações dentro do card em layout de 2 colunas
    const leftColX = this.margin + 8;
    const rightColX = this.pageWidth / 2 + 5;
    let infoY = cardY + 8;
    
    // Coluna esquerda
    this.addInfoField('👤 Cliente', projectInfo.cliente, leftColX, infoY);
    infoY += 10;
    this.addInfoField('📍 Endereço', projectInfo.endereco, leftColX, infoY);
    infoY += 10;
    this.addInfoField('📅 Início', new Date(projectInfo.dataInicio).toLocaleDateString('pt-BR'), leftColX, infoY);
    
    // Coluna direita
    infoY = cardY + 8;
    this.addInfoField('👷 Responsável', projectInfo.responsavel, rightColX, infoY);
    infoY += 10;
    
    if (projectInfo.email) {
      this.addInfoField('✉️ Email', projectInfo.email, rightColX, infoY);
      infoY += 10;
    }
    
    if (projectInfo.telefone) {
      this.addInfoField('📞 Telefone', projectInfo.telefone, rightColX, infoY);
    }
    
    this.currentY = cardY + cardHeight + cardSpacing + 5;
  }

  // ==========================================
  // CARDS DE ESTATÍSTICAS VISUAIS
  // ==========================================

  private addStatisticsCards(installations: InstallationItem[]): void {
    const total = installations.length;
    const concluidos = installations.filter(item => item.status === 'concluido').length;
    const pendentes = installations.filter(item => item.status === 'pendente').length;
    const percentualConcluido = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    
    // Título da seção
    this.addSectionTitle('Resumo Executivo', 'stats');
    
    const cardWidth = (this.pageWidth - (2 * this.margin) - 10) / 3;
    const cardHeight = 28;
    const startY = this.currentY;
    
    // Card 1: Total de Instalações
    this.addStatCard(
      this.margin,
      startY,
      cardWidth,
      cardHeight,
      String(total),
      'Total de Instalações',
      COLORS.primary,
      '📋'
    );
    
    // Card 2: Instalações Concluídas
    this.addStatCard(
      this.margin + cardWidth + 5,
      startY,
      cardWidth,
      cardHeight,
      String(concluidos),
      'Concluídas',
      COLORS.success,
      '✅'
    );
    
    // Card 3: Instalações Pendentes
    this.addStatCard(
      this.margin + (cardWidth * 2) + 10,
      startY,
      cardWidth,
      cardHeight,
      String(pendentes),
      'Pendentes',
      COLORS.warning,
      '⏳'
    );
    
    this.currentY = startY + cardHeight + 5;
    
    // Barra de progresso visual
    this.addProgressBar(percentualConcluido);
    
    this.currentY += 10;
  }

  // ==========================================
  // CARD DE ESTATÍSTICA INDIVIDUAL
  // ==========================================

  private addStatCard(
    x: number,
    y: number,
    width: number,
    height: number,
    value: string,
    label: string,
    color: string,
    icon: string
  ): void {
    // Fundo do card
    this.doc.setFillColor(color);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Faixa decorativa superior
    this.doc.setFillColor(this.hexToRgb(color).map(c => Math.max(0, c - 30)) as any);
    this.doc.roundedRect(x, y, width, 4, 2, 2, 'F');
    
    // Ícone
    this.doc.setFontSize(16);
    this.doc.setTextColor(COLORS.white);
    this.doc.text(icon, x + 8, y + 14);
    
    // Valor grande
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(COLORS.white);
    this.doc.text(value, x + width / 2, y + 15, { align: 'center' });
    
    // Label
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(label, x + width / 2, y + 23, { align: 'center' });
  }

  // ==========================================
  // BARRA DE PROGRESSO VISUAL
  // ==========================================

  private addProgressBar(percentage: number): void {
    const barY = this.currentY;
    const barWidth = this.pageWidth - (2 * this.margin);
    const barHeight = 20;
    
    // Fundo da barra
    this.doc.setFillColor(COLORS.bgMedium);
    this.doc.roundedRect(this.margin, barY, barWidth, barHeight, 2, 2, 'F');
    
    // Preenchimento da barra (progresso)
    const fillWidth = (barWidth * percentage) / 100;
    if (fillWidth > 0) {
      this.doc.setFillColor(COLORS.success);
      this.doc.roundedRect(this.margin, barY, fillWidth, barHeight, 2, 2, 'F');
    }
    
    // Texto do percentual
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(percentage > 50 ? COLORS.white : COLORS.textPrimary);
    this.doc.text(
      `${percentage}% Concluído`,
      this.margin + barWidth / 2,
      barY + 13,
      { align: 'center' }
    );
    
    this.currentY = barY + barHeight;
  }

  // ==========================================
  // TABELA DE INSTALAÇÕES COM DESIGN MODERNO
  // ==========================================

  private addInstallationsTable(
    items: InstallationItem[],
    title: string,
    headerColor: string
  ): void {
    if (items.length === 0) return;
    
    // Verifica se precisa de nova página
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    // Título da tabela
    this.addSectionTitle(title, 'table');
    
    // Prepara os dados da tabela
    const tableData = items.map(item => {
      const statusIcon = item.status === 'concluido' ? '✅' : '⏳';
      const statusText = item.status === 'concluido' ? 'Concluído' : 'Pendente';
      
      return [
        item.codigo,
        item.tipologia,
        item.descricao,
        item.local,
        `${statusIcon} ${statusText}`,
        item.responsavel || '-',
        item.dataConclusao ? new Date(item.dataConclusao).toLocaleDateString('pt-BR') : '-'
      ];
    });
    
    // Gera a tabela com autoTable
    autoTable(this.doc, {
      startY: this.currentY,
      head: [[
        'Código',
        'Tipologia',
        'Descrição',
        'Local',
        'Status',
        'Responsável',
        'Data'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.hexToRgb(headerColor),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [255, 255, 255]
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: this.hexToRgb(COLORS.bgMedium)
      },
      alternateRowStyles: {
        fillColor: this.hexToRgb(COLORS.bgLight)
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' }, // Código
        1: { cellWidth: 25 }, // Tipologia
        2: { cellWidth: 'auto' }, // Descrição
        3: { cellWidth: 30 }, // Local
        4: { cellWidth: 28, halign: 'center' }, // Status
        5: { cellWidth: 25 }, // Responsável
        6: { cellWidth: 20, halign: 'center', fontSize: 7 } // Data
      },
      margin: { left: this.margin, right: this.margin },
      tableLineWidth: 0.1,
      tableLineColor: this.hexToRgb(COLORS.bgMedium),
      didDrawPage: (data) => {
        // Atualiza a posição Y após desenhar a tabela
        this.currentY = data.cursor?.y || this.currentY;
      }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // ==========================================
  // GALERIA DE FOTOS EM GRID
  // ==========================================

  private addPhotoGallery(photos: PhotoItem[]): void {
    // Nova página para galeria
    this.doc.addPage();
    this.currentY = this.margin;
    
    // Título da seção
    this.addSectionTitle('Registro Fotográfico', 'gallery');
    
    const columns = 2;
    const photoWidth = (this.pageWidth - (2 * this.margin) - 10) / columns;
    const photoHeight = photoWidth * 0.75; // Proporção 4:3
    const spacing = 5;
    
    let currentCol = 0;
    let rowStartY = this.currentY;
    
    photos.forEach((photo, index) => {
      // Verifica se precisa de nova página
      if (rowStartY + photoHeight + 15 > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
        rowStartY = this.currentY;
        currentCol = 0;
      }
      
      const x = this.margin + (currentCol * (photoWidth + spacing));
      const y = rowStartY;
      
      // Fundo do card de foto
      this.doc.setFillColor(COLORS.white);
      this.doc.roundedRect(x, y, photoWidth, photoHeight + 12, 2, 2, 'F');
      
      // Borda do card
      this.doc.setDrawColor(COLORS.bgMedium);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(x, y, photoWidth, photoHeight + 12, 2, 2, 'S');
      
      // Placeholder para foto (em produção, carregaria a imagem real)
      this.doc.setFillColor(COLORS.bgLight);
      this.doc.rect(x + 2, y + 2, photoWidth - 4, photoHeight - 4, 'F');
      
      // Ícone de imagem
      this.doc.setFontSize(24);
      this.doc.setTextColor(COLORS.textLight);
      this.doc.text('📷', x + photoWidth / 2, y + photoHeight / 2, { align: 'center' });
      
      // Legenda
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(COLORS.textSecondary);
      const legendText = this.doc.splitTextToSize(
        photo.legenda,
        photoWidth - 8
      );
      this.doc.text(legendText, x + photoWidth / 2, y + photoHeight + 5, {
        align: 'center',
        maxWidth: photoWidth - 8
      });
      
      currentCol++;
      if (currentCol >= columns) {
        currentCol = 0;
        rowStartY += photoHeight + spacing + 12;
      }
    });
    
    this.currentY = rowStartY + (currentCol > 0 ? photoHeight + spacing + 12 : 0);
  }

  // ==========================================
  // TÍTULO DE SEÇÃO COM ÍCONE
  // ==========================================

  private addSectionTitle(title: string, type: 'info' | 'stats' | 'table' | 'gallery'): void {
    const iconMap = {
      info: '📊',
      stats: '📈',
      table: '📋',
      gallery: '📷'
    };
    
    // Linha decorativa acima
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 5;
    
    // Ícone e título
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.text(`${iconMap[type]} ${title}`, this.margin, this.currentY);
    
    this.currentY += 8;
  }

  // ==========================================
  // CAMPO DE INFORMAÇÃO (LABEL + VALOR)
  // ==========================================

  private addInfoField(label: string, value: string, x: number, y: number): void {
    // Label
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.textSecondary);
    this.doc.text(label, x, y);
    
    // Valor
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(COLORS.textPrimary);
    const valueText = this.doc.splitTextToSize(value, 80);
    this.doc.text(valueText[0] || value, x, y + 4);
  }

  // ==========================================
  // RODAPÉS COM PAGINAÇÃO
  // ==========================================

  private addFooters(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Linha decorativa
      this.doc.setDrawColor(COLORS.bgMedium);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15
      );
      
      // Numeração de páginas
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(COLORS.textSecondary);
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
      
      // Informações de contato/copyright (lado esquerdo)
      this.doc.text(
        '© Sistema de Gestão de Instalações',
        this.margin,
        this.pageHeight - 10
      );
      
      // Data de geração (lado direito)
      this.doc.text(
        new Date().toLocaleDateString('pt-BR'),
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [0, 0, 0];
  }
}

// ==========================================
// FUNÇÃO DE EXPORTAÇÃO SIMPLIFICADA
// ==========================================

export const exportFacilitiesReport = (data: FacilitiesReportData): void => {
  const report = new FacilitiesPDFReport();
  report.generate(data);
};

// ==========================================
// EXEMPLO DE USO
// ==========================================

export const generateSampleReport = (): void => {
  const sampleData: FacilitiesReportData = {
    projectInfo: {
      titulo: 'Modernização do Edifício Corporativo',
      cliente: 'Empresa XYZ Ltda.',
      endereco: 'Av. Paulista, 1000 - São Paulo/SP',
      email: 'contato@empresaxyz.com.br',
      telefone: '(11) 3000-0000',
      responsavel: 'João Silva',
      dataInicio: '2025-01-15',
      dataPrevisao: '2025-06-30'
    },
    installations: [
      {
        codigo: 'INST-001',
        tipologia: 'Elétrica',
        descricao: 'Instalação de quadro elétrico principal',
        local: 'Subsolo - Sala técnica',
        status: 'concluido',
        responsavel: 'Carlos Souza',
        dataInicio: '2025-01-20',
        dataConclusao: '2025-02-10',
        observacoes: 'Instalação conforme projeto'
      },
      {
        codigo: 'INST-002',
        tipologia: 'Hidráulica',
        descricao: 'Tubulação de água fria e quente',
        local: 'Todos os andares',
        status: 'concluido',
        responsavel: 'Maria Santos',
        dataInicio: '2025-02-01',
        dataConclusao: '2025-03-15'
      },
      {
        codigo: 'INST-003',
        tipologia: 'Ar Condicionado',
        descricao: 'Instalação de sistema VRF',
        local: 'Andares 1 a 5',
        status: 'pendente',
        responsavel: 'Pedro Oliveira',
        dataInicio: '2025-03-20'
      },
      {
        codigo: 'INST-004',
        tipologia: 'Rede Lógica',
        descricao: 'Cabeamento estruturado Cat6',
        local: 'Todos os andares',
        status: 'pendente',
        responsavel: 'Ana Costa',
        dataInicio: '2025-04-01'
      },
      {
        codigo: 'INST-005',
        tipologia: 'CFTV',
        descricao: 'Sistema de câmeras de segurança',
        local: 'Perímetro e áreas comuns',
        status: 'concluido',
        responsavel: 'Roberto Lima',
        dataInicio: '2025-02-15',
        dataConclusao: '2025-03-30'
      }
    ],
    photos: [
      {
        url: '/placeholder1.jpg',
        legenda: 'Quadro elétrico principal instalado',
        itemCodigo: 'INST-001'
      },
      {
        url: '/placeholder2.jpg',
        legenda: 'Tubulação hidráulica em execução',
        itemCodigo: 'INST-002'
      },
      {
        url: '/placeholder3.jpg',
        legenda: 'Sistema de CFTV instalado',
        itemCodigo: 'INST-005'
      },
      {
        url: '/placeholder4.jpg',
        legenda: 'Vista geral do canteiro de obras'
      }
    ]
  };
  
  exportFacilitiesReport(sampleData);
};
