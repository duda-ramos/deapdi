# 📄 Documentação - Gerador de Relatórios PDF de Instalações

## 🎯 Visão Geral

Sistema completo de geração de relatórios PDF profissionais para gestão de instalações, com design moderno, diagramação otimizada e fácil leitura.

## ✨ Características Principais

### 🎨 Design Profissional e Moderno
- **Cabeçalho com gradiente**: Fundo azul com faixa decorativa superior
- **Layout em cards**: Informações organizadas em caixas visuais
- **Cores semânticas**: Verde para concluído, amarelo para pendente
- **Tipografia hierárquica**: Títulos claros com diferentes tamanhos
- **Espaçamento adequado**: Margens e padding otimizados para leitura

### 📊 Componentes do Relatório

#### 1. Cabeçalho
- Logo ou título destacado com gradiente azul
- Nome do projeto centralizado
- Data e hora de geração do relatório
- Faixa decorativa superior

#### 2. Informações do Projeto
- Layout em 2 colunas dentro de card
- Ícones emoji para cada tipo de informação:
  - 👤 Cliente
  - 📍 Endereço
  - 👷 Responsável
  - ✉️ Email
  - 📞 Telefone
  - 📅 Data de início
- Bordas arredondadas e sombra sutil

#### 3. Estatísticas Visuais
- **3 Cards coloridos**:
  - Total de instalações (azul) 📋
  - Concluídas (verde) ✅
  - Pendentes (amarelo) ⏳
- **Barra de progresso**: Mostra percentual de conclusão
- Valores grandes e destacados
- Ícones para fácil identificação

#### 4. Tabelas de Instalações
- **Duas tabelas separadas**: Concluídas e Pendentes
- **Linhas zebradas**: Alternância de cores para melhor leitura
- **Cabeçalhos coloridos**: Verde para concluídas, amarelo para pendentes
- **Ícones de status**: ✅ para concluído, ⏳ para pendente
- **Colunas**:
  - Código (destaque em negrito)
  - Tipologia
  - Descrição
  - Local
  - Status
  - Responsável
  - Data de conclusão
- Bordas sutis e arredondadas

#### 5. Galeria de Fotos
- Grid 2 colunas
- Cards individuais para cada foto
- Bordas arredondadas
- Legendas descritivas
- Espaçamento adequado
- Proporção 4:3 para imagens

#### 6. Rodapé
- Linha decorativa superior
- Numeração de páginas centralizada
- Copyright no canto esquerdo
- Data de geração no canto direito
- Presente em todas as páginas

## 🎨 Paleta de Cores

```typescript
COLORS = {
  // Cores principais
  primary: '#2563EB',      // Azul principal
  primaryDark: '#1E40AF',  // Azul escuro
  secondary: '#64748B',    // Cinza azulado
  
  // Cores semânticas
  success: '#10B981',      // Verde para concluído
  warning: '#F59E0B',      // Amarelo para pendente
  danger: '#EF4444',       // Vermelho para alertas
  
  // Cores de fundo
  bgLight: '#F8FAFC',      // Fundo claro
  bgMedium: '#E2E8F0',     // Fundo médio
  bgDark: '#1E293B',       // Fundo escuro
  
  // Cores de texto
  textPrimary: '#1E293B',  // Texto principal
  textSecondary: '#64748B',// Texto secundário
  textLight: '#94A3B8',    // Texto claro
  white: '#FFFFFF'         // Branco
}
```

## 💻 Como Usar

### Instalação

As dependências já estão instaladas no projeto:
- `jspdf`: ^3.0.3
- `jspdf-autotable`: ^5.0.2

### Uso Básico

```typescript
import { exportFacilitiesReport, FacilitiesReportData } from './utils/facilitiesPdfReport';

// Preparar os dados
const reportData: FacilitiesReportData = {
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
      tipologia: 'Ar Condicionado',
      descricao: 'Instalação de sistema VRF',
      local: 'Andares 1 a 5',
      status: 'pendente',
      responsavel: 'Pedro Oliveira',
      dataInicio: '2025-03-20'
    }
  ],
  photos: [
    {
      url: '/path/to/photo.jpg',
      legenda: 'Quadro elétrico instalado',
      itemCodigo: 'INST-001'
    }
  ]
};

// Gerar o PDF
exportFacilitiesReport(reportData);
```

### Gerar Relatório de Exemplo

```typescript
import { generateSampleReport } from './utils/facilitiesPdfReport';

// Gera um relatório de exemplo completo
generateSampleReport();
```

## 📋 Tipos de Dados

### ProjectInfo

```typescript
interface ProjectInfo {
  titulo: string;           // Título do projeto
  cliente: string;          // Nome do cliente
  endereco: string;         // Endereço completo
  email?: string;           // Email de contato (opcional)
  telefone?: string;        // Telefone de contato (opcional)
  responsavel: string;      // Nome do responsável
  dataInicio: string;       // Data de início (formato ISO)
  dataPrevisao?: string;    // Data de previsão (opcional)
}
```

### InstallationItem

```typescript
interface InstallationItem {
  codigo: string;           // Código único da instalação
  tipologia: string;        // Tipo (Elétrica, Hidráulica, etc.)
  descricao: string;        // Descrição detalhada
  local: string;            // Localização
  status: 'concluido' | 'pendente';  // Status
  responsavel?: string;     // Responsável pela execução
  dataInicio?: string;      // Data de início
  dataConclusao?: string;   // Data de conclusão (se concluído)
  observacoes?: string;     // Observações adicionais
}
```

### PhotoItem

```typescript
interface PhotoItem {
  url: string;              // URL ou caminho da imagem
  legenda: string;          // Legenda descritiva
  itemCodigo?: string;      // Código do item relacionado
}
```

## 🎯 Casos de Uso

### 1. Relatório de Obra

```typescript
const obraData = {
  projectInfo: {
    titulo: 'Construção de Prédio Comercial',
    cliente: 'Construtora ABC',
    // ...
  },
  installations: [
    // Fundação, estrutura, alvenaria, etc.
  ],
  photos: [
    // Fotos do andamento da obra
  ]
};

exportFacilitiesReport(obraData);
```

### 2. Relatório de Manutenção Predial

```typescript
const manutencaoData = {
  projectInfo: {
    titulo: 'Manutenção Preventiva Anual',
    cliente: 'Shopping Center XYZ',
    // ...
  },
  installations: [
    // Itens de manutenção
  ]
};

exportFacilitiesReport(manutencaoData);
```

### 3. Relatório de Reforma

```typescript
const reformaData = {
  projectInfo: {
    titulo: 'Reforma de Escritórios',
    cliente: 'Empresa Tech',
    // ...
  },
  installations: [
    // Itens da reforma
  ]
};

exportFacilitiesReport(reformaData);
```

## 🔧 Personalização

### Alterar Cores

Edite o objeto `COLORS` no arquivo `facilitiesPdfReport.ts`:

```typescript
const COLORS = {
  primary: '#SUA_COR_AQUI',
  success: '#SUA_COR_AQUI',
  // ...
};
```

### Adicionar Logo

No método `addHeader()`, você pode adicionar uma imagem:

```typescript
// Converter imagem para base64 e adicionar
this.doc.addImage(logoBase64, 'PNG', x, y, width, height);
```

### Customizar Layout

Cada método da classe `FacilitiesPDFReport` pode ser modificado:
- `addHeader()`: Modificar cabeçalho
- `addProjectInfoCards()`: Alterar layout de informações
- `addStatisticsCards()`: Personalizar estatísticas
- `addInstallationsTable()`: Customizar tabelas
- `addPhotoGallery()`: Ajustar galeria de fotos

## 📊 Especificações Técnicas

- **Formato**: A4 (210mm x 297mm)
- **Orientação**: Retrato (Portrait)
- **Margens**: 20mm em todos os lados
- **Fonte padrão**: Helvetica
- **Tamanhos de fonte**:
  - Título principal: 24pt
  - Subtítulos: 14pt
  - Texto normal: 9-10pt
  - Rodapé: 8pt
- **Cores**: RGB e Hexadecimal
- **Tabelas**: jsPDF-autoTable com tema grid

## ✅ Checklist de Qualidade

- [x] Design profissional e moderno
- [x] Hierarquia visual clara
- [x] Cores semânticas (verde/amarelo)
- [x] Tabelas zebradas
- [x] Ícones de status
- [x] Cards visuais para estatísticas
- [x] Galeria de fotos organizada
- [x] Rodapé com paginação
- [x] Margens adequadas para impressão
- [x] Quebra de página inteligente
- [x] Código limpo e comentado
- [x] TypeScript com tipos definidos
- [x] Fácil de usar e personalizar

## 🚀 Melhorias Futuras

1. **Suporte a imagens reais**: Carregar fotos de URLs ou arquivos
2. **Gráficos**: Adicionar charts com progresso temporal
3. **Assinaturas digitais**: Campos para assinaturas
4. **QR Code**: Link para versão online do relatório
5. **Múltiplos idiomas**: Suporte i18n
6. **Temas**: Paletas de cores pré-definidas
7. **Exportar Excel**: Versão em planilha
8. **Email automático**: Enviar por email após geração

## 📞 Suporte

Para dúvidas ou sugestões sobre o gerador de relatórios:
- Verifique o código em `src/utils/facilitiesPdfReport.ts`
- Veja o componente de exemplo em `src/components/facilities/FacilitiesReportGenerator.tsx`
- Execute o relatório de exemplo com `generateSampleReport()`

---

**Versão**: 1.0.0  
**Data**: Outubro 2025  
**Autor**: Sistema de Gestão de Instalações
