# Guia de Configuração do Token Supabase

## CRÍTICO: Token Atual Está Expirado

O token JWT no arquivo `.env` **expirou instantaneamente** (iat e exp são o mesmo timestamp). Você precisa gerar um novo token válido.

## Como Obter um Novo Token

### 1. Acesse o Supabase Dashboard

Acesse: https://0ec90b57d6e95fcbda19832f.supabase.co

Ou vá para: https://supabase.com/dashboard

### 2. Navegue até as Configurações de API

1. Clique no seu projeto
2. Vá em **Settings** (⚙️) no menu lateral
3. Clique em **API**

### 3. Copie as Credenciais

Você verá duas seções importantes:

**Project URL:**
```
https://0ec90b57d6e95fcbda19832f.supabase.co
```

**Project API keys:**
- `anon` `public` - Este é o que você precisa!
- `service_role` `secret` - NÃO use este (é privado)

### 4. Atualize o arquivo .env

Abra o arquivo `.env` e substitua:

```bash
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=<COLE-O-ANON-KEY-AQUI>
```

### 5. Verifique o Token

Um token válido deve:
- Ser bem longo (centenas de caracteres)
- Começar com `eyJ`
- Ter expiração em anos no futuro (não segundos)

## Verificar Token Atual

Para verificar se seu token está expirado, execute:

```bash
node -e "const jwt = 'SEU_TOKEN_AQUI'; const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()); console.log('Expires:', new Date(payload.exp * 1000));"
```

## Após Atualizar o Token

1. Salve o arquivo `.env`
2. Reinicie o servidor de desenvolvimento
3. O sistema de login deve funcionar normalmente

## Solução de Problemas

### "Invalid JWT"
- Token copiado incorretamente
- Token contém espaços extras
- Usando `service_role` ao invés de `anon`

### "Token Expired"
- Token realmente expirou
- Precisa gerar novo token no Dashboard

### "Cannot connect to Supabase"
- Verifique sua conexão com internet
- Verifique se a URL do projeto está correta
- Confirme que o projeto Supabase está ativo

## Estrutura do Token JWT

Um token JWT válido tem 3 partes separadas por pontos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MjA3NDI0MTU3NH0.signature
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ^^^^^^^^^
        Header                                           Payload                                           Signature
```

O payload decodificado deve conter:
```json
{
  "iss": "supabase",
  "ref": "0ec90b57d6e95fcbda19832f",
  "role": "anon",
  "iat": 1758881574,
  "exp": 2074241574  // Deve ser ANOS no futuro!
}
```

## Segurança

- ✅ Anon key pode ser público (frontend)
- ❌ Service role key NUNCA deve ser exposto
- ✅ Use Row Level Security (RLS) para proteger dados
- ✅ Tokens anon respeitam políticas RLS

## Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação de API Keys](https://supabase.com/docs/guides/api/api-keys)
- [JWT.io - Decodificador de Token](https://jwt.io)
