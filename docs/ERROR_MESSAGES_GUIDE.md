# Guia de Mensagens de Erro

## Princípios de Design

### 1. Ser Específico
❌ "Campo obrigatório"  
✅ "Informe seu e-mail para continuar"

### 2. Incluir Ação
❌ "Senha inválida"  
✅ "Senha incorreta. Tente novamente ou clique em 'Esqueci minha senha'"

### 3. Ser Empático
❌ "Você errou"  
✅ "Algo deu errado"

### 4. Tom Consistente
- Usar "você" (2ª pessoa)
- Evitar linguagem técnica
- Ser conciso e direto

---

## Antes e Depois

### Autenticação

| Situação | ❌ Antes | ✅ Depois |
|----------|---------|----------|
| Login inválido | "Invalid login credentials" | "E-mail ou senha incorretos. Verifique seus dados e tente novamente" |
| Sessão expirada | "Invalid Refresh Token" | "Sua sessão expirou. Faça login novamente para continuar" |
| Email não confirmado | "email_not_confirmed" | "Confirme seu e-mail para acessar. Verifique sua caixa de entrada e spam" |
| Cadastro desabilitado | "signup_disabled" | "O cadastro de novos usuários está temporariamente desabilitado. Entre em contato com o administrador" |
| Email já cadastrado | "User already registered" | "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail" |

### Validação de Formulários

| Campo | ❌ Antes | ✅ Depois |
|-------|---------|----------|
| Email obrigatório | "Campo obrigatório" | "Informe seu e-mail para continuar" |
| Email inválido | "Formato inválido" | "Digite um e-mail válido (exemplo: seu@email.com)" |
| Senha curta | "Senha inválida" | "Sua senha precisa ter pelo menos 6 caracteres" |
| Senhas não coincidem | "Senhas diferentes" | "As senhas não coincidem. Digite novamente" |
| Nome obrigatório | "Este campo é obrigatório" | "Informe seu nome completo" |
| CPF inválido | "CPF inválido" | "Digite um CPF válido (apenas números ou com pontos e traço)" |

### Permissões

| Situação | ❌ Antes | ✅ Depois |
|----------|---------|----------|
| Sem permissão | "permission denied" / "42501" | "Você não tem permissão para acessar este recurso. Se precisar de acesso, fale com seu gestor" |
| Ação proibida | "unauthorized" | "Esta ação não é permitida para o seu perfil" |

### Rede

| Situação | ❌ Antes | ✅ Depois |
|----------|---------|----------|
| Sem conexão | "Failed to fetch" | "Você está sem conexão com a internet. Verifique sua conexão e tente novamente" |
| Timeout | "timeout" | "A conexão está demorando muito. Verifique sua internet ou tente novamente em alguns minutos" |
| Erro de servidor | "connection error" | "Nosso servidor está com problemas. Nossa equipe foi notificada. Tente novamente em alguns minutos" |

### Recursos

| Situação | ❌ Antes | ✅ Depois |
|----------|---------|----------|
| Não encontrado | "404 Not Found" | "Ops! Não encontramos o que você procura. O item pode ter sido removido ou o link está incorreto" |
| Conflito | "23505" / "duplicate" | "Este item já existe. Verifique os dados ou edite o item existente" |
| Concorrência | "conflict" | "Outro usuário já fez alterações neste item. Recarregue a página para ver as alterações mais recentes" |

### Upload

| Situação | ❌ Antes | ✅ Depois |
|----------|---------|----------|
| Arquivo muito grande | "File too large" | "O arquivo é muito grande. Reduza o tamanho do arquivo ou escolha outro" |
| Tipo inválido | "Invalid file type" | "Tipo de arquivo não permitido. Use arquivos nos formatos: JPG, PNG, PDF ou DOCX" |
| Upload falhou | "Upload failed" | "Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente" |

---

## Uso no Código

### Importar mensagens centralizadas

```typescript
import { 
  validationMessages,
  authMessages,
  networkMessages,
  getSupabaseErrorMessage,
  getFieldValidationMessage 
} from '@/lib/errorMessages';
```

### Validação de formulário

```typescript
// Em vez de:
if (!email) {
  setError('Campo obrigatório');
}

// Use:
if (!email) {
  setError(validationMessages.email.required);
}
```

### Erro de API

```typescript
// Em vez de:
catch (err) {
  setError(err.message);
}

// Use:
catch (err) {
  const { message } = getSupabaseErrorMessage(err.message);
  setError(message);
}
```

### Mensagem com sugestão e ação

```typescript
const { message, suggestion, action } = authMessages.invalidCredentials;

// Renderizar:
<div>
  <p>{message}</p>
  <p className="text-sm text-gray-500">{suggestion}</p>
  {action && (
    <a href={action.href}>{action.label}</a>
  )}
</div>
```

---

## Checklist de Revisão

Antes de adicionar uma nova mensagem de erro, verifique:

- [ ] A mensagem é específica sobre o que deu errado?
- [ ] Inclui uma ação que o usuário pode tomar?
- [ ] Evita culpar o usuário?
- [ ] Usa linguagem simples e acessível?
- [ ] Está em português brasileiro?
- [ ] É consistente com o tom das outras mensagens?
- [ ] Está centralizada em `src/lib/errorMessages.ts`?

---

## Arquivo Central

Todas as mensagens de erro estão centralizadas em:

```
src/lib/errorMessages.ts
```

Este arquivo contém:
- `validationMessages` - Mensagens de validação de campos
- `authMessages` - Mensagens de autenticação
- `networkMessages` - Mensagens de rede/conexão
- `permissionMessages` - Mensagens de permissão
- `resourceMessages` - Mensagens de recursos (não encontrado, conflito)
- `uploadMessages` - Mensagens de upload de arquivos
- `actionMessages` - Mensagens específicas por funcionalidade (PDI, mentoria, etc.)
- `loadingMessages` - Mensagens de loading contextual
- `getSupabaseErrorMessage()` - Função para mapear erros do Supabase
- `getFieldValidationMessage()` - Função para mensagens de validação
- `getDestructiveActionMessage()` - Função para mensagens de confirmação
