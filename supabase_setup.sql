-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL, -- Em produção, usar hash
  email TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de missões
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  is_fixed_for_new_users BOOLEAN DEFAULT false,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de conclusões de missões (pendente ou completada)
CREATE TABLE IF NOT EXISTS public.mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  mission_id UUID NOT NULL REFERENCES public.missions(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, mission_id, status)
);

-- Tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS mission_completions_user_id_idx ON public.mission_completions(user_id);
CREATE INDEX IF NOT EXISTS mission_completions_mission_id_idx ON public.mission_completions(mission_id);
CREATE INDEX IF NOT EXISTS mission_completions_status_idx ON public.mission_completions(status);
CREATE INDEX IF NOT EXISTS withdrawals_user_id_idx ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);

-- Função para aprovar uma missão (atualizar status e saldo do usuário)
CREATE OR REPLACE FUNCTION public.approve_mission(
  completion_id UUID,
  user_id UUID,
  mission_value DECIMAL,
  current_balance DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Atualizar o status da missão para 'completed'
  UPDATE public.mission_completions
  SET status = 'completed'
  WHERE id = completion_id;
  
  -- Atualizar o saldo do usuário
  UPDATE public.users
  SET balance = balance + mission_value
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Função para aprovar um saque (atualizar status e saldo do usuário)
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  withdrawal_id UUID,
  user_id UUID,
  withdrawal_amount DECIMAL,
  current_balance DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário tem saldo suficiente
  IF current_balance < withdrawal_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar o saque';
  END IF;

  -- Atualizar o status do saque para 'approved'
  UPDATE public.withdrawals
  SET status = 'approved'
  WHERE id = withdrawal_id;
  
  -- Atualizar o saldo do usuário
  UPDATE public.users
  SET balance = balance - withdrawal_amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Criar uma RLS (Row Level Security) para proteger os dados
-- Cada usuário só pode ver/editar seus próprios dados

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela de usuários
CREATE POLICY users_select ON public.users
  FOR SELECT USING (true); -- Todos podem ver os usuários
  
CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (true); -- Todos podem criar usuários (para registro)
  
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR -- Usuário só pode atualizar seus próprios dados
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Ou é admin
  );

-- Políticas para a tabela de missões
CREATE POLICY missions_select ON public.missions
  FOR SELECT USING (true); -- Todos podem ver as missões
  
CREATE POLICY missions_insert ON public.missions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Apenas admins podem criar
  );
  
CREATE POLICY missions_update ON public.missions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Apenas admins podem atualizar
  );
  
CREATE POLICY missions_delete ON public.missions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Apenas admins podem deletar
  );

-- Políticas para a tabela de conclusões de missões
CREATE POLICY mission_completions_select ON public.mission_completions
  FOR SELECT USING (true); -- Todos podem ver completions
  
CREATE POLICY mission_completions_insert ON public.mission_completions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR -- Usuário só pode enviar suas próprias completions
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Ou é admin
  );
  
CREATE POLICY mission_completions_update ON public.mission_completions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Apenas admins podem atualizar
  );

-- Políticas para a tabela de saques
CREATE POLICY withdrawals_select ON public.withdrawals
  FOR SELECT USING (
    user_id = auth.uid() OR -- Usuário só pode ver seus próprios saques
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Ou é admin
  );
  
CREATE POLICY withdrawals_insert ON public.withdrawals
  FOR INSERT WITH CHECK (
    user_id = auth.uid() -- Usuário só pode solicitar seus próprios saques
  );
  
CREATE POLICY withdrawals_update ON public.withdrawals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true) -- Apenas admins podem atualizar
  ); 