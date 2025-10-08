# TalentFlow - Sistema de Gestão de Talentos

## 🚀 Início Rápido

O sistema agora possui **configuração automática do Supabase**! Não é mais necessário configurar manualmente as credenciais.

### Instalação

```bash
# Clone o repositório
git clone [seu-repositorio]
cd talentflow

# Instale as dependências
npm install

# Inicie o servidor (configuração automática!)
npm run dev
```

O arquivo `.env` já está configurado com credenciais padrão. O sistema irá:
- ✅ Detectar automaticamente as variáveis de ambiente
- ✅ Validar a conexão com o Supabase
- ✅ Migrar configurações antigas (se existirem)
- ✅ Exibir instruções claras em caso de erro

### Configuração Personalizada (Opcional)

Para usar seu próprio projeto Supabase, atualize o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

Para mais detalhes sobre a configuração automática, veja [SETUP_AUTOMATICO.md](./SETUP_AUTOMATICO.md).

## 📋 Recursos Principais

- **Gestão de Competências**: Avaliação e desenvolvimento de habilidades
- **PDI (Plano de Desenvolvimento Individual)**: Planejamento de carreira personalizado
- **Trilhas de Carreira**: Progressão profissional estruturada
- **Saúde Mental**: Acompanhamento psicológico integrado
- **Mentoria**: Sistema de mentoria e coaching
- **Relatórios e Analytics**: Dashboards com insights em tempo real

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI/UX**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Testes**: Jest + Cypress + React Testing Library
- **Deploy**: Otimizado para Vercel/Netlify

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- 📱 Mobile (a partir de 320px)
- 💻 Tablet (768px+)
- 🖥️ Desktop (1024px+)

## 🔒 Segurança

- Autenticação via Supabase Auth
- RLS (Row Level Security) em todas as tabelas
- Validação de dados em múltiplas camadas
- Proteção contra XSS e CSRF

## 📚 Documentação Adicional

- [Guia de Configuração Automática](./SETUP_AUTOMATICO.md)
- [Guia de Deployment](./DEPLOYMENT_GUIDE.md)
- [Checklist de Produção](./PRODUCTION_CHECKLIST.md)
- [Documentação de Segurança RLS](./RLS_SECURITY_DOCUMENTATION.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

---

**Desenvolvido com ❤️ pela equipe TalentFlow**