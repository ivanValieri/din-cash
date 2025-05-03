# Integração do DinCash com Supabase

Este documento contém instruções para configurar e utilizar o Supabase como banco de dados para o DinCash.

## Configuração Inicial

### 1. Arquivo de Ambiente (.env)

O arquivo `.env` na raiz do projeto contém as chaves de API do Supabase:

```
VITE_SUPABASE_URL=https://bqaxuzwwozztcwpcapoh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYXh1end3b3p6dGN3cGNhcG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODk1NjUsImV4cCI6MjA2MTg2NTU2NX0.dsxTQrn-sBRGI98QfjObtUKCdlAGjOgo28x-Ig9ThMQ
```

### 2. Configuração do Banco de Dados

Execute o script SQL encontrado em `supabase_setup.sql` no painel de administração do Supabase (SQL Editor) para criar:

- Tabelas (users, missions, mission_completions, withdrawals)
- Funções (approve_mission, approve_withdrawal)
- Políticas de segurança (RLS)

### 3. Dependências

Certifique-se de que a biblioteca do Supabase está instalada:

```bash
npm install @supabase/supabase-js
```

## Estrutura da Integração

### Arquivos Principais

1. **src/config/supabase.ts**
   - Configuração do cliente Supabase
   - Interfaces dos tipos de dados

2. **src/services/supabaseService.ts**
   - Funções para interagir com o Supabase
   - Operações CRUD para usuários, missões, etc.

3. **src/context/AuthContext.tsx**
   - Contexto de autenticação integrado com Supabase
   - Gerenciamento de estado de usuário

## Fluxo de Dados

### Autenticação

1. Usuário faz login com telefone/senha
2. Sistema verifica credenciais no Supabase
3. Se não existir, cria uma nova conta
4. Mantém as informações do usuário no contexto

### Missões

1. Admin cria missões no painel administrativo
2. Missões são armazenadas no Supabase
3. Usuários visualizam missões disponíveis
4. Usuários completam missões, enviando para aprovação
5. Admin aprova/rejeita missões completadas

### Saldo e Saques

1. Quando uma missão é aprovada, o saldo do usuário é atualizado
2. Usuários podem solicitar saques
3. Admin aprova/rejeita saques
4. Quando um saque é aprovado, o saldo é deduzido

## Instruções para Desenvolvimento

### Testando a Integração

1. Crie um usuário admin no Supabase:

```sql
INSERT INTO public.users (phone_number, name, password, is_admin, balance)
VALUES ('73982505494', 'Administrador', 'admgeral', true, 0);
```

2. Faça login como admin para acessar o painel administrativo
3. Crie algumas missões para testar

### Observações

- Os dados serão sincronizados entre o Supabase e a aplicação
- As alterações feitas no painel administrativo são persistidas no Supabase
- A aplicação mantém compatibilidade com o localStorage como fallback

## Resolução de Problemas

### Limpeza de Dados Locais

Se quiser limpar os dados do localStorage para testar apenas com o Supabase:

```javascript
// No console do navegador
localStorage.removeItem("dincashUser");
localStorage.removeItem("dincashMissions");
localStorage.removeItem("dincashUsers");
localStorage.removeItem("dincashWithdrawals");
```

### Logs de Erro

Verifique os erros no console do navegador para identificar problemas de conexão com o Supabase. 