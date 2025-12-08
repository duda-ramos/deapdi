# Mapeamento de Tooltips

## Componente

```tsx
import { Tooltip, IconButtonWithTooltip } from '@/components/ui/Tooltip';
```

## Uso Básico

```tsx
<Tooltip content="Editar competência">
  <Button variant="ghost"><Edit2 /></Button>
</Tooltip>

// Com atalho de teclado
<Tooltip content="Salvar alterações" shortcut="Ctrl+S">
  <Button>Salvar</Button>
</Tooltip>

// Botão de ícone com tooltip integrado
<IconButtonWithTooltip
  tooltip="Excluir item"
  icon={<Trash2 />}
  variant="danger"
  onClick={handleDelete}
/>
```

---

## Elementos Prioritários

### 1. Botões com Apenas Ícone (Alta Prioridade)

| Elemento | Localização | Texto do Tooltip | Atalho |
|----------|-------------|------------------|--------|
| Editar | Listas, Cards | "Editar {item}" | - |
| Excluir | Listas, Cards | "Excluir {item}" | - |
| Visualizar | Listas, Cards | "Ver detalhes" | - |
| Fechar | Modais, Painéis | "Fechar" | Esc |
| Menu | Header, Cards | "Mais opções" | - |
| Notificações | Header | "Notificações" | - |
| Perfil | Header | "Meu perfil" | - |
| Filtrar | Listas | "Filtrar resultados" | - |
| Buscar | Header | "Buscar" | Ctrl+K |
| Adicionar | Listas | "Adicionar novo" | - |
| Refresh | Listas | "Atualizar lista" | - |
| Download | Relatórios | "Baixar relatório" | - |
| Upload | Formulários | "Enviar arquivo" | - |
| Copiar | Inputs | "Copiar para área de transferência" | Ctrl+C |
| Expandir | Cards | "Expandir/Recolher" | - |
| Configurações | Header | "Configurações" | - |

### 2. Campos com Validação Complexa (Alta Prioridade)

| Campo | Texto do Tooltip |
|-------|------------------|
| CPF | "Digite apenas números ou use o formato 000.000.000-00" |
| CNPJ | "Digite apenas números ou use o formato 00.000.000/0000-00" |
| Telefone | "Use o formato (00) 00000-0000" |
| CEP | "Digite o CEP com 8 dígitos" |
| Data de nascimento | "Formato: DD/MM/AAAA" |
| Senha | "Mínimo 6 caracteres. Use letras, números e símbolos para maior segurança" |
| Email corporativo | "Use seu email @empresa.com.br" |

### 3. Métricas e Indicadores (Média Prioridade)

| Elemento | Texto do Tooltip |
|----------|------------------|
| % Conclusão PDI | "Progresso calculado com base nas ações concluídas" |
| Pontos de gamificação | "Pontos acumulados por completar ações e alcançar metas" |
| Nível do usuário | "Seu nível atual baseado nos pontos acumulados" |
| Streak | "Dias consecutivos com atividade registrada" |
| Taxa de conclusão | "Porcentagem de itens concluídos no prazo" |
| NPS | "Net Promoter Score: satisfação dos colaboradores" |
| Tempo médio | "Média de tempo para conclusão de ações" |
| Meta mensal | "Progresso em relação à meta estabelecida para o mês" |

### 4. Badges de Status (Média Prioridade)

| Status | Texto do Tooltip |
|--------|------------------|
| Ativo | "Este item está ativo e em andamento" |
| Concluído | "Item finalizado com sucesso" |
| Pendente | "Aguardando ação ou aprovação" |
| Em revisão | "Sendo analisado por um gestor" |
| Cancelado | "Item foi cancelado" |
| Atrasado | "Prazo ultrapassado" |
| Próximo do prazo | "Prazo termina em menos de 7 dias" |
| Beta | "Funcionalidade em teste. Pode sofrer alterações" |
| Novo | "Recurso recém-lançado" |
| Premium | "Disponível apenas para planos premium" |

### 5. Recursos Beta/Avançados (Média Prioridade)

| Elemento | Texto do Tooltip |
|----------|------------------|
| IA Assistant | "Assistente de IA para sugestões personalizadas (Beta)" |
| Analytics avançado | "Relatórios detalhados com insights de IA" |
| Integrações | "Conecte com outras ferramentas da empresa" |
| Automações | "Configure ações automáticas baseadas em eventos" |
| Export PDF | "Gera relatório em PDF para impressão ou compartilhamento" |

### 6. Atalhos de Teclado (Baixa Prioridade)

| Ação | Atalho | Texto do Tooltip |
|------|--------|------------------|
| Salvar | Ctrl+S | "Salvar alterações (Ctrl+S)" |
| Buscar | Ctrl+K | "Buscar (Ctrl+K)" |
| Novo item | Ctrl+N | "Criar novo (Ctrl+N)" |
| Fechar modal | Esc | "Fechar (Esc)" |
| Desfazer | Ctrl+Z | "Desfazer última ação (Ctrl+Z)" |
| Navegação | Tab | "Navegar entre elementos (Tab)" |

---

## Validações de Acessibilidade

- [x] Tooltip aparece após 300ms de hover
- [x] Escape fecha o tooltip
- [x] Acessível via foco de teclado (Tab)
- [x] `aria-describedby` conectado corretamente
- [x] Texto legível (contraste adequado)
- [x] Não bloqueia interação com elementos adjacentes
- [x] Posicionamento inteligente (evita sair da viewport)

---

## Implementação por Página

### Header
```tsx
<Tooltip content="Notificações" shortcut="N">
  <button><Bell /></button>
</Tooltip>

<Tooltip content="Buscar" shortcut="Ctrl+K">
  <button><Search /></button>
</Tooltip>
```

### PDI
```tsx
<IconButtonWithTooltip
  tooltip="Editar PDI"
  icon={<Edit2 />}
  onClick={() => setEditMode(true)}
/>

<IconButtonWithTooltip
  tooltip="Excluir PDI"
  icon={<Trash2 />}
  variant="danger"
  onClick={confirmDelete}
/>
```

### Dashboard
```tsx
<Tooltip content="Progresso calculado com base nas ações concluídas">
  <span className="flex items-center gap-1">
    75% <HelpCircle size={14} />
  </span>
</Tooltip>
```

---

## Configurações Globais

```tsx
// Em App.tsx
import { TooltipProvider } from '@/components/ui/Tooltip';

<TooltipProvider delay={300}>
  <App />
</TooltipProvider>
```

Para desabilitar tooltips (modo performance):
```tsx
<TooltipProvider disabled={true}>
  ...
</TooltipProvider>
```
