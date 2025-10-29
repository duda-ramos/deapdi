# ✅ CHECKLIST DE VALIDAÇÃO MANUAL

## 🧪 Teste 1: ActionGroups - Criação de Tarefa

### Passos:
1. Fazer login como Admin ou Gestor
2. Navegar para "Grupos de Ação"
3. Abrir um grupo existente
4. Clicar em "+ Tarefa" ou "Nova Tarefa"

### Validar:
- [ ] No campo "Título", digitar rapidamente: "Teste rápido de digitação com muitas palavras e caracteres"
- [ ] Todos os caracteres aparecem
- [ ] Campo NÃO perde foco
- [ ] Cursor permanece na posição correta

- [ ] No campo "Descrição", digitar texto longo (50+ caracteres)
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco
- [ ] Quebras de linha funcionam

- [ ] Copiar texto longo e colar no campo "Título"
- [ ] Todo texto aparece
- [ ] Sem travamentos

---

## 🧪 Teste 2: Mentorship - Solicitação

### Passos:
1. Ir para "Mentoria"
2. Clicar em "Solicitar Mentoria"
3. Selecionar um mentor

### Validar:
- [ ] No campo "Mensagem", digitar: "Gostaria de desenvolver habilidades de liderança e comunicação com a equipe técnica para projetos complexos"
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco
- [ ] Múltiplas linhas funcionam

---

## 🧪 Teste 3: PDI - Criação

### Passos:
1. Ir para "PDI"
2. Clicar em "Criar Novo PDI"

### Validar:
- [ ] Campo "Título": digitar rapidamente "Desenvolver habilidades em React e TypeScript"
- [ ] Todos os caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Descrição": digitar texto longo
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

---

## 🧪 Teste 4: Profile - Edição

### Passos:
1. Ir para "Perfil"
2. Clicar em "Editar"

### Validar:
- [ ] Campo "Nome": digitar rapidamente
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Sobre Mim": digitar texto longo
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Formação": digitar texto
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

---

## 🧪 Teste 5: UserManagement - Criação de Usuário

### Passos (apenas Admin/HR):
1. Ir para "Gestão de Usuários"
2. Clicar em "Criar Novo Usuário"

### Validar:
- [ ] Campo "Nome Completo": digitar rapidamente "João da Silva Santos Oliveira"
- [ ] Todos os caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Email": digitar "joao.silva.santos@empresa.com.br"
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Biografia": digitar texto longo
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

- [ ] Campo "Formação": digitar texto
- [ ] Todos caracteres aparecem
- [ ] Campo não perde foco

---

## 🎯 Testes Gerais (Em TODOS os campos acima)

### Digitação:
- [ ] Digitação rápida funciona (30+ palavras por minuto)
- [ ] Digitação lenta funciona
- [ ] Pausar durante digitação e continuar funciona

### Edição:
- [ ] Voltar cursor para o meio do texto e inserir caracteres
- [ ] Selecionar texto e substituir
- [ ] Deletar caracteres com Backspace
- [ ] Deletar caracteres com Delete

### Copiar/Colar:
- [ ] Ctrl+A seleciona todo texto
- [ ] Ctrl+C copia
- [ ] Ctrl+V cola
- [ ] Ctrl+X recorta

### Mobile (se aplicável):
- [ ] Teclado virtual aparece
- [ ] Digitação funciona
- [ ] Campo não perde foco

---

## 🐛 Console DevTools

Abrir DevTools (F12) e verificar:
- [ ] Sem erros no console
- [ ] Sem warnings de React
- [ ] Sem mensagens sobre re-renders excessivos

---

## ✅ Critério de Aceitação

**TODOS** os itens devem estar marcados para considerar o bug RESOLVIDO.

Se QUALQUER campo ainda perder foco após digitar 1 caractere:
1. Anotar qual componente/arquivo
2. Anotar qual campo específico
3. Reportar para aplicar a mesma correção

---

## 📊 Resultado Esperado

### ✅ SUCESSO = 
- Digitação fluída em todos os campos
- Nenhuma perda de foco
- Nenhum erro no console
- Experiência de usuário natural

### ❌ FALHA = 
- Qualquer campo perde foco após 1 caractere
- Erros no console
- Warnings de React

---

**Data de Validação**: _______________  
**Validado por**: _______________  
**Status**: [ ] PASSOU | [ ] FALHOU  
**Observações**: _______________
