# Guia de Implementação - ARIA Labels

## Índice Rápido de Padrões

Este guia complementa o `ARIA_ACCESSIBILITY_AUDIT.md` com exemplos práticos de implementação.

---

## 1. Padrões de Código por Tipo de Elemento

### 1.1 Inputs e Campos de Texto

#### ✅ Padrão Correto
```tsx
const InputExample: React.FC = () => {
  const fieldId = useId(); // React 18+
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;
  
  return (
    <div>
      <label htmlFor={fieldId}>Nome Completo *</label>
      <input
        id={fieldId}
        type="text"
        aria-required="true"
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
      />
      {hasError && <span id={errorId} role="alert">{errorMessage}</span>}
      {helpText && <span id={helpId}>{helpText}</span>}
    </div>
  );
};
```

#### ❌ Padrão Incorreto
```tsx
// Sem id, sem aria attributes, label não conectado
<div>
  <label>Nome</label>
  <input type="text" />
  {error && <span>{error}</span>}
</div>
```

---

### 1.2 Checkboxes e Switches

#### ✅ Padrão Correto - Checkbox
```tsx
const CheckboxExample: React.FC<CheckboxProps> = ({ checked, onChange, label }) => {
  const id = useId();
  
  return (
    <div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        aria-checked={checked}
        aria-describedby={label ? undefined : `${id}-label`}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};
```

#### ✅ Padrão Correto - Switch Toggle
```tsx
const SwitchExample: React.FC<SwitchProps> = ({ enabled, onChange, label }) => {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={enabled ? 'on' : 'off'}
    >
      <span aria-hidden="true">{/* Visual toggle */}</span>
    </button>
  );
};
```

---

### 1.3 Selects e Dropdowns

#### ✅ Padrão Correto
```tsx
const SelectExample: React.FC<SelectProps> = ({ 
  label, 
  value, 
  options, 
  required, 
  error 
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  
  return (
    <div>
      <label htmlFor={fieldId}>{label} {required && '*'}</label>
      <select
        id={fieldId}
        value={value}
        aria-required={required ? "true" : undefined}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span id={errorId} role="alert">{error}</span>}
    </div>
  );
};
```

---

### 1.4 Botões de Ação

#### ✅ Padrão Correto - Botão com Ícone
```tsx
const IconButtonExample: React.FC = () => {
  return (
    <button
      type="button"
      aria-label="Excluir item"
      onClick={handleDelete}
    >
      <Trash2 size={16} aria-hidden="true" />
    </button>
  );
};
```

#### ✅ Padrão Correto - Botão com Texto e Ícone
```tsx
const ButtonWithIconExample: React.FC = () => {
  return (
    <button type="button" onClick={handleSave}>
      <Save size={16} aria-hidden="true" />
      Salvar
      {/* Não precisa de aria-label, o texto já descreve */}
    </button>
  );
};
```

#### ✅ Padrão Correto - Botão de Toggle
```tsx
const ToggleButtonExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button
      type="button"
      aria-label="Menu de navegação"
      aria-expanded={isOpen}
      aria-controls="navigation-menu"
      onClick={() => setIsOpen(!isOpen)}
    >
      <Menu size={20} aria-hidden="true" />
    </button>
  );
};
```

---

### 1.5 Modais e Diálogos

#### ✅ Padrão Correto
```tsx
const ModalExample: React.FC<ModalProps> = ({ isOpen, onClose, title }) => {
  const titleId = useId();
  const descId = useId();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div role="dialog" 
             aria-modal="true" 
             aria-labelledby={titleId}
             aria-describedby={descId}>
          <div className="modal-content">
            <h2 id={titleId}>{title}</h2>
            <div id={descId}>
              {/* Conteúdo do modal */}
            </div>
            <button 
              onClick={onClose}
              aria-label="Fechar modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

---

### 1.6 Listas e Itens

#### ✅ Padrão Correto - Lista de Itens
```tsx
const ListExample: React.FC = ({ items }) => {
  return (
    <div>
      <h3 id="list-title">Tarefas Pendentes</h3>
      <ul role="list" aria-labelledby="list-title">
        {items.map((item) => (
          <li key={item.id} role="listitem">
            <div aria-label={`Tarefa: ${item.title}`}>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <button aria-label={`Concluir tarefa ${item.title}`}>
                <CheckCircle aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

#### ✅ Padrão Correto - Lista de Seleção
```tsx
const SelectableListExample: React.FC = ({ users, selectedIds }) => {
  return (
    <div role="group" aria-label="Selecionar usuários">
      <ul role="list">
        {users.map((user) => (
          <li key={user.id} role="listitem">
            <label>
              <input
                type="checkbox"
                role="checkbox"
                aria-checked={selectedIds.includes(user.id)}
                value={user.id}
              />
              <span>{user.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

### 1.7 Tabelas

#### ✅ Padrão Correto
```tsx
const TableExample: React.FC = ({ data, caption }) => {
  return (
    <table role="table" aria-label={caption}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr role="row">
          <th scope="col" role="columnheader">Nome</th>
          <th scope="col" role="columnheader">Email</th>
          <th scope="col" role="columnheader">Ações</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={row.id} role="row" aria-rowindex={idx + 1}>
            <td role="cell">{row.name}</td>
            <td role="cell">{row.email}</td>
            <td role="cell">
              <button aria-label={`Editar ${row.name}`}>
                <Edit2 aria-hidden="true" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

### 1.8 Barras de Progresso

#### ✅ Padrão Correto - Determinado
```tsx
const ProgressBarExample: React.FC = ({ current, max, label }) => {
  const percentage = (current / max) * 100;
  
  return (
    <div>
      <label id="progress-label">{label}</label>
      <div
        role="progressbar"
        aria-labelledby="progress-label"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`${current} de ${max} completo`}
      >
        <div style={{ width: `${percentage}%` }} aria-hidden="true" />
      </div>
      <span aria-live="polite" aria-atomic="true">
        {percentage.toFixed(0)}% completo
      </span>
    </div>
  );
};
```

#### ✅ Padrão Correto - Indeterminado
```tsx
const LoadingSpinnerExample: React.FC = () => {
  return (
    <div
      role="progressbar"
      aria-label="Carregando conteúdo"
      aria-busy="true"
      aria-valuetext="Carregando..."
    >
      <div className="spinner" aria-hidden="true" />
    </div>
  );
};
```

---

### 1.9 Navegação e Abas

#### ✅ Padrão Correto - Tabs
```tsx
const TabsExample: React.FC = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div>
      <div role="tablist" aria-label="Configurações">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};
```

#### ✅ Padrão Correto - Navegação com Página Ativa
```tsx
const NavigationExample: React.FC = ({ items, currentPath }) => {
  return (
    <nav aria-label="Principal">
      <ul role="list">
        {items.map((item) => (
          <li key={item.path} role="listitem">
            <Link
              to={item.path}
              aria-current={currentPath === item.path ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
```

---

### 1.10 Range Sliders

#### ✅ Padrão Correto
```tsx
const RangeSliderExample: React.FC = ({ value, min, max, label, onChange }) => {
  const id = useId();
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} de ${max}`}
      />
      <output
        htmlFor={id}
        aria-live="polite"
      >
        {value}
      </output>
    </div>
  );
};
```

---

### 1.11 Notificações e Alertas

#### ✅ Padrão Correto - Erro Assertivo
```tsx
const ErrorAlertExample: React.FC = ({ error }) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="error-alert"
    >
      <AlertCircle aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
};
```

#### ✅ Padrão Correto - Notificação Polite
```tsx
const SuccessMessageExample: React.FC = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="success-message"
    >
      <CheckCircle aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
```

#### ✅ Padrão Correto - Lista de Notificações
```tsx
const NotificationListExample: React.FC = ({ notifications }) => {
  return (
    <div
      role="region"
      aria-label="Centro de notificações"
    >
      <h2>Notificações</h2>
      <ul role="list" aria-label="Lista de notificações">
        {notifications.map((notif) => (
          <li key={notif.id} role="listitem">
            <div aria-label={`Notificação: ${notif.title}`}>
              <h3>{notif.title}</h3>
              <p>{notif.message}</p>
              <button aria-label={`Marcar notificação "${notif.title}" como lida`}>
                <Check aria-hidden="true" />
              </button>
              <button aria-label={`Excluir notificação "${notif.title}"`}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

### 1.12 Cards e Artigos

#### ✅ Padrão Correto
```tsx
const CardExample: React.FC = ({ title, description, onEdit, onDelete }) => {
  return (
    <article aria-label={`Cartão: ${title}`}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div role="group" aria-label="Ações do cartão">
        <button aria-label={`Editar ${title}`}>
          <Edit2 aria-hidden="true" />
        </button>
        <button aria-label={`Excluir ${title}`}>
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
```

---

### 1.13 Busca e Filtros

#### ✅ Padrão Correto
```tsx
const SearchExample: React.FC = ({ value, onChange, onSubmit }) => {
  return (
    <form role="search" onSubmit={onSubmit}>
      <label htmlFor="search-input" className="sr-only">
        Buscar itens
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={onChange}
        aria-label="Campo de busca"
        placeholder="Buscar..."
      />
      <button type="submit" aria-label="Executar busca">
        <Search aria-hidden="true" />
      </button>
    </form>
  );
};
```

---

## 2. Padrões de aria-live

### Quando usar aria-live="polite"
- Mensagens de sucesso
- Atualizações de status não críticas
- Contadores e estatísticas
- Resultados de busca

```tsx
<div aria-live="polite" aria-atomic="true">
  3 resultados encontrados
</div>
```

### Quando usar aria-live="assertive"
- Mensagens de erro
- Alertas críticos
- Avisos de segurança
- Notificações urgentes

```tsx
<div role="alert" aria-live="assertive">
  Erro ao salvar os dados. Tente novamente.
</div>
```

### Quando usar aria-live="off"
- Conteúdo que não deve interromper
- Elementos decorativos
- Informações redundantes

```tsx
<div aria-live="off">
  {/* Conteúdo auxiliar */}
</div>
```

---

## 3. Ícones e Elementos Decorativos

### ✅ Ícone Puramente Decorativo
```tsx
<button aria-label="Salvar documento">
  <Save size={16} aria-hidden="true" />
  Salvar
</button>
```

### ✅ Ícone como Único Conteúdo
```tsx
<button aria-label="Fechar janela">
  <X size={20} aria-hidden="true" />
</button>
```

### ❌ Ícone Sem aria-hidden
```tsx
// Incorreto - leitor de tela pode anunciar conteúdo desnecessário
<button>
  <Save size={16} />
</button>
```

---

## 4. Estados de Loading

### ✅ Loading Inline
```tsx
<button disabled aria-busy="true">
  <Loader className="animate-spin" aria-hidden="true" />
  Salvando...
</button>
```

### ✅ Loading de Página
```tsx
<div
  role="alert"
  aria-busy="true"
  aria-live="polite"
>
  <Loader className="spinner" aria-hidden="true" />
  <span>Carregando conteúdo...</span>
</div>
```

---

## 5. Formulários Complexos

### ✅ Grupo de Radio Buttons
```tsx
const RadioGroupExample: React.FC = ({ options, selected, onChange }) => {
  const groupId = useId();
  
  return (
    <fieldset role="radiogroup" aria-labelledby={`${groupId}-label`}>
      <legend id={`${groupId}-label`}>Escolha uma opção</legend>
      {options.map((option) => (
        <div key={option.value}>
          <input
            type="radio"
            id={`${groupId}-${option.value}`}
            name={groupId}
            value={option.value}
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
          />
          <label htmlFor={`${groupId}-${option.value}`}>
            {option.label}
          </label>
        </div>
      ))}
    </fieldset>
  );
};
```

---

## 6. Dicas de Screen Readers

### Textos Apenas para Screen Readers
```tsx
// Classe CSS recomendada
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// Uso
<span className="sr-only">Informação adicional para leitores de tela</span>
```

---

## 7. Testes de Acessibilidade

### Checklist Manual
- [ ] Navegar apenas com teclado (Tab, Enter, Space, Arrows)
- [ ] Testar com leitor de tela (NVDA/JAWS/VoiceOver)
- [ ] Verificar ordem de foco lógica
- [ ] Testar formulários completos
- [ ] Verificar anúncios de erros e sucessos
- [ ] Testar modais e overlays
- [ ] Verificar navegação por landmarks

### Ferramentas Automatizadas
```bash
# Instalar ferramentas
npm install --save-dev @axe-core/react jest-axe
npm install --save-dev eslint-plugin-jsx-a11y

# Configurar ESLint
{
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

---

## 8. Recursos e Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM Articles](https://webaim.org/articles/)
- [React Accessibility Docs](https://react.dev/learn/accessibility)

---

**Última Atualização:** 27 de Novembro de 2025
