# TalentFlow - Guia de Onboarding para Desenvolvedores

Bem-vindo ao time TalentFlow! 🎉

Este guia vai te ajudar a configurar seu ambiente de desenvolvimento e começar a contribuir com o projeto.

## Índice
1. [Requisitos](#requisitos)
2. [Setup do Ambiente](#setup-do-ambiente)
3. [Arquitetura do Projeto](#arquitetura-do-projeto)
4. [Convenções de Código](#convenções-de-código)
5. [Fluxo de Git](#fluxo-de-git)
6. [Como Executar Testes](#como-executar-testes)
7. [Como Fazer Deploy](#como-fazer-deploy)
8. [Acessos Necessários](#acessos-necessários)
9. [Recursos Importantes](#recursos-importantes)
10. [Troubleshooting Inicial](#troubleshooting-inicial)
11. [Checklist de Onboarding](#checklist-de-onboarding)

---

## Requisitos

### Software Necessário

| Ferramenta | Versão Mínima | Como Instalar |
|------------|---------------|---------------|
| Node.js | 18.x | [nodejs.org](https://nodejs.org) |
| npm | 9.x | Vem com Node.js |
| Git | 2.x | [git-scm.com](https://git-scm.com) |
| VS Code | Última | [code.visualstudio.com](https://code.visualstudio.com) |

### Extensões VS Code Recomendadas

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "mikestead.dotenv"
  ]
}
```

### Verificar Instalações

```bash
node -v  # Deve ser >= 18.0.0
npm -v   # Deve ser >= 9.0.0
git --version  # Deve ser >= 2.0.0
```

---

## Setup do Ambiente

### 1. Clonar o Repositório

```bash
# Via SSH (recomendado)
git clone git@github.com:sua-org/talentflow.git
cd talentflow

# Via HTTPS
git clone https://github.com/sua-org/talentflow.git
cd talentflow
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
# (solicitar credenciais de desenvolvimento ao tech lead)
code .env
```

**Variáveis obrigatórias:**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_APP_ENV=development
```

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### 5. Verificar se Está Funcionando

1. Abra http://localhost:5173
2. Faça login com usuário de teste
3. Navegue pelo dashboard
4. Verifique o console para erros

---

## Arquitetura do Projeto

### Estrutura de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes de UI genéricos (Button, Input, etc.)
│   ├── layout/         # Layout principal (Header, Sidebar, etc.)
│   ├── mental-health/  # Componentes de saúde mental
│   └── ...
├── pages/              # Páginas/Views da aplicação
├── services/           # Serviços de API (Supabase queries)
├── contexts/           # React Contexts (Auth, etc.)
├── hooks/              # Custom hooks
├── utils/              # Utilitários e helpers
├── types/              # TypeScript types/interfaces
└── lib/                # Configurações de bibliotecas

supabase/
├── migrations/         # Migrations do banco de dados
└── seed.sql           # Dados de seed para desenvolvimento

cypress/
└── e2e/               # Testes end-to-end
```

### Stack Tecnológica

| Camada | Tecnologia | Documentação |
|--------|------------|--------------|
| Frontend | React 18 | [react.dev](https://react.dev) |
| Linguagem | TypeScript | [typescriptlang.org](https://typescriptlang.org) |
| Styling | Tailwind CSS | [tailwindcss.com](https://tailwindcss.com) |
| Build | Vite | [vitejs.dev](https://vitejs.dev) |
| Backend | Supabase | [supabase.com/docs](https://supabase.com/docs) |
| State | React Context | Nativo do React |
| Forms | React Hook Form | [react-hook-form.com](https://react-hook-form.com) |
| Charts | Recharts | [recharts.org](https://recharts.org) |
| Testing | Jest + Cypress | [jestjs.io](https://jestjs.io) |

### Fluxo de Dados

```
User Action → Component → Service → Supabase → RLS → Database
                ↓
            Context/State
                ↓
            Re-render
```

---

## Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase com `use` | `useAuth.ts` |
| Services | camelCase | `authService.ts` |
| Utilitários | camelCase | `formatDate.ts` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `UserProfile` |

### Estrutura de Componentes

```tsx
// components/UserCard.tsx

import { useState } from 'react';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="p-4 rounded-lg bg-white shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{user.name}</h3>
      {onSelect && (
        <button onClick={() => onSelect(user)}>
          Selecionar
        </button>
      )}
    </div>
  );
}
```

### Padrões de Código

- Usar **functional components** com hooks
- Preferir **named exports** sobre default exports
- Usar **TypeScript** para todos os arquivos
- Usar **Tailwind CSS** para estilos
- Evitar **any** - tipar corretamente
- Comentar código complexo

### Linting e Formatação

```bash
# Verificar lint
npm run lint

# Corrigir lint automaticamente
npm run lint:fix

# Verificar tipos
npm run type-check
```

---

## Fluxo de Git

### Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Produção - código estável |
| `develop` | Staging - integração |
| `feature/*` | Novas funcionalidades |
| `fix/*` | Correções de bugs |
| `chore/*` | Manutenção, deps, etc. |

### Workflow

```bash
# 1. Criar branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/minha-feature

# 2. Desenvolver e commitar
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 3. Push e criar PR
git push origin feature/minha-feature
# Criar PR no GitHub: feature/minha-feature → develop
```

### Mensagens de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```
feat(pdi): adiciona validação de prazo
fix(auth): corrige loop de redirecionamento
docs: atualiza README com instruções de setup
```

### Code Review

1. Criar PR com descrição clara
2. Aguardar review de pelo menos 1 pessoa
3. Resolver comentários
4. Merge após aprovação

---

## Como Executar Testes

### Testes Unitários

```bash
# Rodar todos os testes
npm run test

# Rodar com watch mode
npm run test:watch

# Rodar com coverage
npm run test:coverage
```

### Testes E2E (Cypress)

```bash
# Abrir Cypress UI
npm run test:e2e:open

# Rodar headless
npm run test:e2e
```

### Testes de Tipo

```bash
npm run type-check
```

---

## Como Fazer Deploy

### Deploy para Staging

```bash
# 1. Garantir que está na branch develop
git checkout develop
git pull

# 2. Build e deploy
npm run deploy:staging
```

### Deploy para Produção

Apenas via CI/CD após merge para `main`:

1. Criar PR: `develop` → `main`
2. Aprovar e fazer merge
3. CI/CD faz deploy automaticamente

**Não fazer deploy manual em produção!**

---

## Acessos Necessários

Solicite ao tech lead:

- [ ] Acesso ao repositório GitHub
- [ ] Credenciais Supabase (desenvolvimento)
- [ ] Acesso ao Sentry
- [ ] Acesso ao Google Analytics (opcional)
- [ ] Acesso ao Vercel/Netlify (se necessário)
- [ ] Convite para canais Slack

---

## Recursos Importantes

### Documentação Interna
- [Guia de Deployment](./DEPLOYMENT_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Manutenção](./MAINTENANCE_PROCEDURES.md)
- [Segurança RLS](./RLS_SECURITY_DOCUMENTATION.md)

### Links Externos
- [Documentação React](https://react.dev)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Tailwind](https://tailwindcss.com/docs)
- [Documentação TypeScript](https://www.typescriptlang.org/docs)

### Contatos

| Papel | Contato |
|-------|---------|
| Tech Lead | tech-lead@empresa.com |
| Product Owner | po@empresa.com |
| DevOps | devops@empresa.com |

---

## Troubleshooting Inicial

### "npm install" falha

```bash
# Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Erro de conexão com Supabase

1. Verificar se `.env` está configurado
2. Verificar se credenciais estão corretas
3. Testar: `curl https://seu-projeto.supabase.co/rest/v1/`

### Página não carrega

1. Verificar console do navegador (F12)
2. Verificar terminal do dev server
3. Tentar hard refresh: Ctrl+Shift+R

### TypeScript errors

```bash
# Verificar tipos
npm run type-check

# Reinstalar tipos
npm install
```

---

## Checklist de Onboarding

Use este checklist para garantir que você está pronto:

### Dia 1
- [ ] Ambiente configurado (Node, npm, Git, VS Code)
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] `.env` configurado
- [ ] Servidor dev rodando
- [ ] Consegue fazer login na aplicação

### Semana 1
- [ ] Entendeu arquitetura do projeto
- [ ] Leu documentação principal
- [ ] Fez primeira task/bug fix
- [ ] Abriu primeiro PR
- [ ] Conheceu o time

### Mês 1
- [ ] Completou feature independentemente
- [ ] Participou de code review
- [ ] Conhece fluxo de deploy
- [ ] Confortável com stack tecnológica

---

## Dúvidas Frequentes

### "Por onde começar?"

1. Pegue uma task marcada como `good first issue`
2. Leia o código relacionado
3. Faça perguntas no Slack
4. Abra PR pequeno e peça feedback

### "Preciso de ajuda!"

1. Procure na documentação
2. Pesquise no Slack
3. Pergunte no canal do time
4. Agende pair programming se necessário

### "Encontrei um bug!"

1. Verifique se já existe issue
2. Se não, crie issue com:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots/logs se aplicável

---

**Bem-vindo novamente! Estamos felizes em ter você no time! 🚀**

*Última atualização: Dezembro 2024*
