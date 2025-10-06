import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  title: string;
  filename: string;
  elementId?: string;
  content?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

export const exportToPDF = async (options: PDFExportOptions): Promise<void> => {
  const {
    title,
    filename,
    elementId,
    content,
    orientation = 'portrait',
    format = 'a4'
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

  let yPosition = 40;

  if (elementId) {
    // Export from DOM element
    const element = document.getElementById(elementId);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = doc.internal.pageSize.getWidth() - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (yPosition + imgHeight > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error capturing element:', error);
        doc.text('Erro ao capturar elemento para PDF', 20, yPosition);
        yPosition += 10;
      }
    }
  }

  if (content) {
    // Add text content
    const lines = doc.splitTextToSize(content, doc.internal.pageSize.getWidth() - 40);
    
    for (const line of lines) {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(10);
      doc.text(line, 20, yPosition);
      yPosition += 5;
    }
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(filename);
};

export const exportMentalHealthRecord = async (
  data: {
    employeeName: string;
    checkins: any[];
    sessions: any[];
    alerts: any[];
    responses: any[];
    activities: any[];
    timeline: any[];
  }
): Promise<void> => {
  const content = `
RELATÓRIO DE SAÚDE MENTAL - ${data.employeeName.toUpperCase()}

RESUMO EXECUTIVO
================
Total de Check-ins: ${data.checkins.length}
Total de Sessões: ${data.sessions.length}
Total de Alertas: ${data.alerts.length}
Total de Respostas: ${data.responses.length}
Total de Atividades: ${data.activities.length}

ÚLTIMOS CHECK-INS
=================
${data.checkins.slice(0, 10).map(checkin => `
Data: ${new Date(checkin.checkin_date).toLocaleDateString('pt-BR')}
Humor: ${checkin.mood_rating}/10
Energia: ${checkin.energy_level}/10
Estresse: ${checkin.stress_level}/10
Sono: ${checkin.sleep_quality}/10
Notas: ${checkin.notes || 'Nenhuma nota'}
`).join('\n')}

SESSÕES DE PSICOLOGIA
=====================
${data.sessions.map(session => `
Data: ${new Date(session.scheduled_date).toLocaleDateString('pt-BR')}
Status: ${session.status}
Tipo: ${session.session_type}
Notas: ${session.notes || 'Nenhuma nota'}
`).join('\n')}

ALERTAS DE SAÚDE MENTAL
=======================
${data.alerts.map(alert => `
Data: ${new Date(alert.created_at).toLocaleDateString('pt-BR')}
Título: ${alert.title}
Severidade: ${alert.severity}
Status: ${alert.acknowledged_at ? 'Reconhecido' : 'Pendente'}
Descrição: ${alert.description}
`).join('\n')}

ATIVIDADES TERAPÊUTICAS
=======================
${data.activities.map(activity => `
Título: ${activity.title}
Tipo: ${activity.type}
Status: ${activity.status}
Data de Criação: ${new Date(activity.created_at).toLocaleDateString('pt-BR')}
`).join('\n')}

CRONOLOGIA DETALHADA
====================
${data.timeline.slice(0, 20).map(item => `
${new Date(item.date).toLocaleDateString('pt-BR')} - ${item.title}
Tipo: ${item.type}
${item.data.notes ? `Notas: ${item.data.notes}` : ''}
`).join('\n')}

---
Este relatório foi gerado automaticamente pelo sistema de saúde mental.
Para mais informações, entre em contato com o departamento de RH.
  `;

  await exportToPDF({
    title: `Relatório de Saúde Mental - ${data.employeeName}`,
    filename: `relatorio-saude-mental-${data.employeeName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
    content,
    orientation: 'portrait'
  });
};

export const exportAnalyticsReport = async (
  data: {
    period: string;
    metrics: any;
    charts: any[];
  }
): Promise<void> => {
  const content = `
RELATÓRIO DE ANÁLISES DE SAÚDE MENTAL
=====================================

Período: ${data.period}
Data de Geração: ${new Date().toLocaleDateString('pt-BR')}

MÉTRICAS PRINCIPAIS
==================
Total de Funcionários Participando: ${data.metrics.total_employees_participating || 0}
Pontuação Média de Humor: ${data.metrics.average_mood_score || 0}/10
Sessões Este Mês: ${data.metrics.sessions_this_month || 0}
Respostas de Alto Risco: ${data.metrics.high_risk_responses || 0}
Alertas Ativos: ${data.metrics.active_alerts || 0}
Recursos de Bem-estar Acessados: ${data.metrics.wellness_resources_accessed || 0}

TENDÊNCIA DE HUMOR
==================
${data.metrics.mood_trend?.map((trend: any) => `
Data: ${new Date(trend.date).toLocaleDateString('pt-BR')}
Humor Médio: ${trend.average_mood}/10
`).join('\n') || 'Nenhum dado disponível'}

ANÁLISE DE ENGAGEMENT
=====================
Taxa de Adoção do Programa: ${data.metrics.program_adoption_rate || 0}%
Frequência de Check-ins: ${data.metrics.checkin_frequency || 0} por semana
Tempo Médio de Resolução de Alertas: ${data.metrics.alert_resolution_time || 0} dias

RECOMENDAÇÕES
=============
1. Continue monitorando as tendências de humor dos funcionários
2. Implemente ações preventivas baseadas nos dados de estresse
3. Promova o uso dos recursos de bem-estar disponíveis
4. Mantenha o acompanhamento das sessões de psicologia

---
Este relatório foi gerado automaticamente pelo sistema de análise de saúde mental.
Para mais informações, entre em contato com o departamento de RH.
  `;

  await exportToPDF({
    title: `Relatório de Análises - ${data.period}`,
    filename: `relatorio-analises-${data.period.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
    content,
    orientation: 'portrait'
  });
};

export const exportCheckinHistory = async (
  data: {
    employeeName: string;
    checkins: any[];
    period: string;
  }
): Promise<void> => {
  const content = `
HISTÓRICO DE CHECK-INS EMOCIONAIS
==================================

Funcionário: ${data.employeeName}
Período: ${data.period}
Data de Geração: ${new Date().toLocaleDateString('pt-BR')}

RESUMO ESTATÍSTICO
==================
Total de Check-ins: ${data.checkins.length}
Humor Médio: ${data.checkins.length > 0 ? (data.checkins.reduce((sum, c) => sum + c.mood_rating, 0) / data.checkins.length).toFixed(1) : 0}/10
Energia Média: ${data.checkins.length > 0 ? (data.checkins.reduce((sum, c) => sum + c.energy_level, 0) / data.checkins.length).toFixed(1) : 0}/10
Estresse Médio: ${data.checkins.length > 0 ? (data.checkins.reduce((sum, c) => sum + c.stress_level, 0) / data.checkins.length).toFixed(1) : 0}/10
Sono Médio: ${data.checkins.length > 0 ? (data.checkins.reduce((sum, c) => sum + c.sleep_quality, 0) / data.checkins.length).toFixed(1) : 0}/10

DETALHAMENTO DOS CHECK-INS
===========================
${data.checkins.map(checkin => `
Data: ${new Date(checkin.checkin_date).toLocaleDateString('pt-BR')}
Humor: ${checkin.mood_rating}/10
Energia: ${checkin.energy_level}/10
Estresse: ${checkin.stress_level}/10
Sono: ${checkin.sleep_quality}/10
Notas: ${checkin.notes || 'Nenhuma nota'}
---
`).join('\n')}

ANÁLISE DE TENDÊNCIAS
=====================
${data.checkins.length >= 7 ? `
Últimos 7 dias vs. Anterior:
- Humor: ${data.checkins.slice(0, 7).reduce((sum, c) => sum + c.mood_rating, 0) / 7} vs ${data.checkins.slice(7, 14).length > 0 ? (data.checkins.slice(7, 14).reduce((sum, c) => sum + c.mood_rating, 0) / data.checkins.slice(7, 14).length).toFixed(1) : 'N/A'}
- Estresse: ${data.checkins.slice(0, 7).reduce((sum, c) => sum + c.stress_level, 0) / 7} vs ${data.checkins.slice(7, 14).length > 0 ? (data.checkins.slice(7, 14).reduce((sum, c) => sum + c.stress_level, 0) / data.checkins.slice(7, 14).length).toFixed(1) : 'N/A'}
` : 'Dados insuficientes para análise de tendências'}

---
Este relatório foi gerado automaticamente pelo sistema de check-ins emocionais.
Para mais informações, entre em contato com o departamento de RH.
  `;

  await exportToPDF({
    title: `Histórico de Check-ins - ${data.employeeName}`,
    filename: `historico-checkins-${data.employeeName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
    content,
    orientation: 'portrait'
  });
};
