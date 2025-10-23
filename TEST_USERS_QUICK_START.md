# ⚡ QUICK START - Usuários DeaDesign
## DEAPDI TalentFlow

> **Tempo estimado:** 5 minutos para validação  
> **Status:** ✅ Usuários já criados no Auth  
> **Próximo passo:** Executar script SQL

---

## 📊 ESTRUTURA ORGANIZACIONAL DEADESIGN

```
DeaDesign
├── GESTÃO (2 pessoas)
│   ├── Ana Paula Nemoto (Admin/Diretora) ⭐
│   │   └── Maria Eduarda Ramos (Jr)
│   └── Alexia Sobreira (RH/Gerente) 💚
│
├── DESIGN (2 pessoas)
│   ├── Nathalia Fujii (Gestora) ⭐
│   │   └── Roberto Fagaraz (Desenvolvedor Sr)
│
└── PROJETOS (5 pessoas)
    ├── Silvia Kanayama (Gestora) ⭐
    │   ├── Pedro Oliveira (GP Jr)
    │   ├── Lucila Muranaka (Analista Sr)
    │   ├── Julia Rissin (Designer Pleno)
    │   └── Juliana Hobo (Designer Sr)

Legenda:
⭐ Gestor/Admin
💚 RH
```

---

## 👥 USUÁRIOS DEADESIGN

| # | Nome | Email | Senha | UUID | Cargo |
|---|------|-------|-------|------|-------|
| 1 | Ana Paula Nemoto | anapaula@deadesign.com.br | DEA@pdi | `0fbd25b0-ea9c-45e4-a19c-f1ea3403e445` | Diretora Executiva |
| 2 | Alexia Sobreira | alexia@deadesign.com.br | DEA@pdi | `55158bb7-b884-43ae-bf2e-953fc0cb0e4b` | Gerente de RH |
| 3 | Nathalia Fujii | nathalia@deadesign.com.br | DEA@pdi | `cebe7528-c574-43a2-b21d-7905b28ee9d1` | Gerente de Design |
| 4 | Silvia Kanayama | silvia@deadesign.com.br | DEA@pdi | `cad26b49-b723-46a4-a228-bd1a30c49287` | Gerente de Projetos |
| 5 | Maria Eduarda Ramos | mariaeduarda@deadesign.com.br | DEA@pdi | `7278b804-6b4f-4e31-8b78-87aa2295d2c3` | Analista Júnior |
| 6 | Julia Rissin | julia@deadesign.com.br | DEA@pdi | `bb6d9b49-6cd0-40fa-ae38-0defcbce924c` | Designer Pleno |
| 7 | Juliana Hobo | juliana@deadesign.com.br | DEA@pdi | `a14bac90-ae64-404a-b559-da880aee9ca6` | Designer Sênior |
| 8 | Pedro Oliveira | pedro@deadesign.com.br | DEA@pdi | `27b1f282-8a89-4473-87d0-d5f589cda236` | GP Júnior |
| 9 | Lucila Muranaka | lucila@deadesign.com.br | DEA@pdi | `6a4774f2-8418-49ff-a8b9-c24562846350` | Analista Sr |
| 10 | Roberto Fagaraz | roberto@deadesign.com.br | DEA@pdi | `e5561665-e906-4ed0-a3d0-40386db5cea0` | Desenvolvedor Sr |

---

## 🚀 EXECUÇÃO RÁPIDA (2 PASSOS)

### PASSO 1: Executar Script SQL ⚡

1. **Abra:** `TEST_USERS_SEED_SCRIPT.sql`
2. **Acesse:** Dashboard Supabase → SQL Editor
3. **Cole** o script completo
4. **Execute:** Clique em `Run`
5. **Aguarde:** ~2-5 segundos

✅ **Resultado esperado:** "Success. No rows returned"

---

### PASSO 2: Validar Dados ✅

Execute estas queries no SQL Editor para confirmar:

#### Query 1: Verificar 10 usuários

```sql
SELECT 
  p.name as "Nome",
  p.email as "Email",
  p.role as "Perfil",
  p.position as "Cargo",
  t.name as "Departamento",
  g.name as "Gestor"
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN profiles g ON p.manager_id = g.id
WHERE p.email LIKE '%@deadesign.com.br'
ORDER BY 
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'hr' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'employee' THEN 4
  END,
  p.name;
```

**✅ Esperado:** 10 linhas com todos os usuários DeaDesign

---

#### Query 2: Verificar Hierarquia

```sql
SELECT 
  g.name as "Gestora",
  COUNT(p.id) as "Total Equipe",
  STRING_AGG(p.name || ' (' || p.level || ')', ', ') as "Membros"
FROM profiles p
JOIN profiles g ON p.manager_id = g.id
WHERE p.role = 'employee'
  AND p.email LIKE '%@deadesign.com.br'
GROUP BY g.id, g.name
ORDER BY g.name;
```

**✅ Esperado:** 
- Ana Paula: 1 pessoa (Maria Eduarda)
- Nathalia: 1 pessoa (Roberto)
- Silvia: 4 pessoas (Pedro, Lucila, Julia, Juliana)

---

## 🎭 TESTE DE LOGIN

Teste com estes 4 usuários:

| Perfil | Email | Senha | Deve Ver |
|--------|-------|-------|----------|
| **Admin** | anapaula@deadesign.com.br | DEA@pdi | Dashboard completo, todos os usuários |
| **RH** | alexia@deadesign.com.br | DEA@pdi | Módulo RH, saúde mental |
| **Gestora** | silvia@deadesign.com.br | DEA@pdi | Sua equipe (4 pessoas) |
| **Colaboradora** | julia@deadesign.com.br | DEA@pdi | Seu perfil, Silvia como gestora |

---

## ✅ CHECKLIST RÁPIDO

- [x] 10 usuários criados no Auth (UUIDs confirmados)
- [ ] Script SQL executado sem erros
- [ ] Query 1: 10 usuários confirmados
- [ ] Query 2: Hierarquia correta
- [ ] Login Ana Paula funciona
- [ ] Login Silvia funciona
- [ ] Login Julia funciona

---

## 📊 RESULTADO ESPERADO

Após executar:

✅ **10 usuários** ativos no sistema  
✅ **3 departamentos** criados (Gestão, Design, Projetos)  
✅ **3 gestoras** com equipes  
✅ **Hierarquia** funcionando  
✅ **Todos podem fazer login** com DEA@pdi  

---

## 🎯 PRÓXIMOS PASSOS OPCIONAIS

Após validar a estrutura base, você pode adicionar:

1. **Competências** - Habilidades de cada pessoa
2. **PDIs** - Planos de desenvolvimento
3. **Grupos de Ação** - Projetos colaborativos
4. **Mentorias** - Relacionamentos de aprendizado
5. **Check-ins** - Saúde mental da equipe

---

## 🔗 LINKS ÚTEIS

- **Dashboard:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr
- **SQL Editor:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/sql
- **Auth Users:** https://supabase.com/dashboard/project/fvobspjiujcurfugjsxr/auth/users

---

**📅 Atualizado:** 2025-10-22  
**✍️ Versão:** 3.0 - DeaDesign Real Users  
**🏢 Empresa:** DeaDesign  
**🎯 Status:** ✅ Pronto para executar
