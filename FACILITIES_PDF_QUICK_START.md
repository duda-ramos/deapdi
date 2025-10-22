# 🚀 Guia Rápido - Relatório PDF de Instalações

## 📦 Instalação

As dependências já estão instaladas! Apenas certifique-se de que você tem:
```json
"jspdf": "^3.0.3",
"jspdf-autotable": "^5.0.2"
```

## ⚡ Uso em 3 Passos

### 1️⃣ Importar

```typescript
import { exportFacilitiesReport } from './utils/facilitiesPdfReport';
```

### 2️⃣ Preparar Dados

```typescript
const reportData = {
  projectInfo: {
    titulo: 'Meu Projeto',
    cliente: 'Nome do Cliente',
    endereco: 'Endereço',
    responsavel: 'Seu Nome',
    dataInicio: '2025-01-01'
  },
  installations: [
    {
      codigo: 'INST-001',
      tipologia: 'Elétrica',
      descricao: 'Descrição',
      local: 'Local',
      status: 'concluido', // ou 'pendente'
      responsavel: 'Nome'
    }
  ]
};
```

### 3️⃣ Gerar PDF

```typescript
exportFacilitiesReport(reportData);
```

## 🎯 Exemplo Completo em um Componente React

```typescript
import React from 'react';
import { Button } from './components/ui/Button';
import { exportFacilitiesReport } from './utils/facilitiesPdfReport';

export const MyComponent = () => {
  const handleGenerateReport = () => {
    const data = {
      projectInfo: {
        titulo: 'Reforma do Escritório',
        cliente: 'Empresa ABC',
        endereco: 'Rua X, 123',
        email: 'contato@abc.com',
        telefone: '(11) 9999-9999',
        responsavel: 'João Silva',
        dataInicio: '2025-01-15'
      },
      installations: [
        {
          codigo: 'INST-001',
          tipologia: 'Elétrica',
          descricao: 'Instalação de quadro elétrico',
          local: 'Sala técnica',
          status: 'concluido',
          responsavel: 'Carlos',
          dataConclusao: '2025-02-01'
        },
        {
          codigo: 'INST-002',
          tipologia: 'Ar Condicionado',
          descricao: 'Instalação de split',
          local: 'Sala de reuniões',
          status: 'pendente',
          responsavel: 'Maria'
        }
      ],
      photos: [
        {
          url: '/foto1.jpg',
          legenda: 'Quadro elétrico instalado'
        }
      ]
    };
    
    exportFacilitiesReport(data);
  };

  return (
    <Button onClick={handleGenerateReport}>
      Gerar Relatório PDF
    </Button>
  );
};
```

## 🎨 O que você recebe

✅ **Cabeçalho profissional** com gradiente azul  
✅ **Cards de informações** do projeto com ícones  
✅ **Estatísticas visuais** (total, concluídos, pendentes)  
✅ **Barra de progresso** mostrando % de conclusão  
✅ **Tabelas separadas** para concluídos e pendentes  
✅ **Linhas zebradas** para fácil leitura  
✅ **Ícones de status** (✅ concluído, ⏳ pendente)  
✅ **Galeria de fotos** em grid 2 colunas  
✅ **Rodapé com paginação** em todas as páginas  
✅ **Cores semânticas** (verde, amarelo, azul)  

## 🧪 Testar Rapidamente

```typescript
import { generateSampleReport } from './utils/facilitiesPdfReport';

// Gera um PDF de exemplo completo
generateSampleReport();
```

## 📱 Adicionar ao Menu

Para adicionar o gerador ao seu sistema, você pode:

1. **Criar uma nova página**:
```typescript
// src/pages/FacilitiesReport.tsx
import FacilitiesReportGenerator from '../components/facilities/FacilitiesReportGenerator';

const FacilitiesReport = () => {
  return <FacilitiesReportGenerator />;
};

export default FacilitiesReport;
```

2. **Adicionar rota no App.tsx**:
```typescript
import FacilitiesReport from './pages/FacilitiesReport';

// Nas suas rotas:
<Route path="/facilities-report" element={<FacilitiesReport />} />
```

3. **Adicionar ao menu lateral** (Sidebar.tsx):
```typescript
{
  path: '/facilities-report',
  name: 'Relatórios',
  icon: <FileText size={20} />
}
```

## 🎯 Campos Obrigatórios vs Opcionais

### Obrigatórios:
- `projectInfo.titulo`
- `projectInfo.cliente`
- `projectInfo.endereco`
- `projectInfo.responsavel`
- `projectInfo.dataInicio`
- `installations[].codigo`
- `installations[].tipologia`
- `installations[].descricao`
- `installations[].local`
- `installations[].status`

### Opcionais:
- `projectInfo.email`
- `projectInfo.telefone`
- `projectInfo.dataPrevisao`
- `installations[].responsavel`
- `installations[].dataInicio`
- `installations[].dataConclusao`
- `installations[].observacoes`
- `photos` (array inteiro é opcional)

## 💡 Dicas

1. **Datas**: Use formato ISO (YYYY-MM-DD) ou Date string
2. **Status**: Apenas 'concluido' ou 'pendente' (exatamente assim)
3. **Fotos**: Por enquanto mostra placeholder (futura implementação carregará imagens reais)
4. **Performance**: Relatórios grandes (>100 itens) podem levar alguns segundos

## 🐛 Troubleshooting

**Erro: "jspdf is not defined"**
```bash
npm install jspdf jspdf-autotable
```

**PDF não baixa**
- Verifique se não há popup blocker
- Verifique o console do navegador

**Cores não aparecem**
- Certifique-se que está usando as cores corretas
- Verifique o método `hexToRgb()`

## 📚 Documentação Completa

Para mais detalhes, veja:
- `FACILITIES_PDF_DOCUMENTATION.md` - Documentação completa
- `src/utils/facilitiesPdfReport.ts` - Código fonte
- `src/components/facilities/FacilitiesReportGenerator.tsx` - Componente de exemplo

---

**Pronto para usar!** 🎉
