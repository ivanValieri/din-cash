import { supabase, SupabaseUser, SupabaseMission, SupabaseMissionCompletion, SupabaseWithdrawal } from '../config/supabase';

// ===== USUÁRIOS =====

// Autenticar usuário com número de telefone usando Supabase Auth
export const signInWithPhoneNumber = async (phoneNumber: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phoneNumber,
    password,
  });
  if (error) {
    return { user: null, error: error.message };
  }
  // Buscar dados extras na tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (userError) {
    return { user: null, error: userError.message };
  }
  return { user: userData as SupabaseUser, error: null };
};

// Cadastrar novo usuário usando Supabase Auth
export const signUpUser = async (phoneNumber: string, name: string, password: string, email?: string) => {
  const { data, error } = await supabase.auth.signUp({
    phone: phoneNumber,
    password,
  });
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Erro ao criar usuário' };
  }
  // Inserir dados extras na tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: data.user.id,
        phone_number: phoneNumber,
        name,
        password, // Em produção, use hash
        email,
        balance: 0,
        is_admin: false,
      },
    ])
    .select()
    .single();
  if (userError) {
    return { user: null, error: userError.message };
  }
  return { user: userData as SupabaseUser, error: null };
};

// Obter usuário por ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data as SupabaseUser, error: null };
};

// Obter todos os usuários (para admin)
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { users: [], error: error.message };
  }

  return { users: data as SupabaseUser[], error: null };
};

// Atualizar saldo do usuário
export const updateUserBalance = async (userId: string, newBalance: number) => {
  const { data, error } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data as SupabaseUser, error: null };
};

// ===== MISSÕES =====

// Criar nova missão
export const createMission = async (mission: Omit<SupabaseMission, 'id' | 'created_at'>) => {
  // Verificar se tem sessão ativa
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("Sessão atual para criação de missão:", sessionData?.session);
  
  // Se não tem sessão, retorna erro
  if (!sessionData?.session) {
    console.error("Tentativa de criar missão sem sessão ativa");
    return { mission: null, error: "Sem sessão ativa. Faça login novamente." };
  }
  
  // Verificar se o usuário é admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', sessionData.session.user.id)
    .single();
    
  if (userError || !userData?.is_admin) {
    console.error("Usuário não é admin ou erro ao verificar:", userError);
    return { mission: null, error: "Apenas administradores podem criar missões." };
  }
  
  console.log("Usuário admin confirmado:", userData);
  
  // Garantir que o campo is_fixed_for_new_users existe
  const missionData = {
    ...mission,
    is_fixed_for_new_users: mission.is_fixed_for_new_users || false,
  };
  
  console.log("Tentando criar missão com dados:", missionData);
  
  // Usar o cliente supabase com autenticação
  const supabaseWithHeaders = supabase.from('missions');
  
  try {
    const { data, error } = await supabaseWithHeaders
      .insert([missionData])
      .select()
      .single();

    if (error) {
      console.error("Erro detalhado ao criar missão:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { mission: null, error: `${error.message} (${error.code})` };
    }

    console.log("Missão criada com sucesso:", data);
    return { mission: data as SupabaseMission, error: null };
  } catch (e) {
    console.error("Exceção ao criar missão:", e);
    return { mission: null, error: "Erro interno ao criar missão." };
  }
};

// Obter todas as missões
export const getAllMissions = async () => {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { missions: [], error: error.message };
  }

  return { missions: data as SupabaseMission[], error: null };
};

// Excluir missão
export const deleteMission = async (missionId: string) => {
  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
};

// ===== COMPLETAR MISSÕES =====

// Solicitar completar missão (status pendente)
export const submitMissionCompletion = async (userId: string, missionId: string) => {
  const { data, error } = await supabase
    .from('mission_completions')
    .insert([
      {
        user_id: userId,
        mission_id: missionId,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    return { completion: null, error: error.message };
  }

  return { completion: data as SupabaseMissionCompletion, error: null };
};

// Obter todas as missões pendentes (para admin)
export const getPendingMissionCompletions = async () => {
  const { data, error } = await supabase
    .from('mission_completions')
    .select(`
      *,
      users (id, phone_number, name),
      missions (id, title, value)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { pendingCompletions: [], error: error.message };
  }

  return { pendingCompletions: data, error: null };
};

// Aprovar missão
export const approveMissionCompletion = async (completionId: string, userId: string, missionValue: number) => {
  // Primeiro obter o saldo atual do usuário
  const { user, error: userError } = await getUserById(userId);

  if (userError || !user) {
    return { success: false, error: userError || 'Usuário não encontrado' };
  }

  // Iniciar uma transação - atualizar o status da missão e o saldo do usuário
  const { error: updateError } = await supabase.rpc('approve_mission', {
    completion_id: completionId,
    user_id: userId,
    mission_value: missionValue,
    current_balance: user.balance
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
};

// Rejeitar missão
export const rejectMissionCompletion = async (completionId: string) => {
  const { error } = await supabase
    .from('mission_completions')
    .update({ status: 'rejected' })
    .eq('id', completionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
};

// ===== SAQUES =====

// Solicitar saque
export const requestWithdrawal = async (userId: string, amount: number) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([
      {
        user_id: userId,
        amount,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    return { withdrawal: null, error: error.message };
  }

  return { withdrawal: data as SupabaseWithdrawal, error: null };
};

// Obter todos os saques pendentes (para admin)
export const getPendingWithdrawals = async () => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select(`
      *,
      users (id, phone_number, name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { pendingWithdrawals: [], error: error.message };
  }

  return { pendingWithdrawals: data, error: null };
};

// Aprovar saque
export const approveWithdrawal = async (withdrawalId: string, userId: string, amount: number) => {
  // Primeiro obter o saldo atual do usuário
  const { user, error: userError } = await getUserById(userId);

  if (userError || !user) {
    return { success: false, error: userError || 'Usuário não encontrado' };
  }

  // Verificar se o usuário tem saldo suficiente
  if (user.balance < amount) {
    return { success: false, error: 'Saldo insuficiente' };
  }

  // Iniciar uma transação - atualizar o status do saque e o saldo do usuário
  const { error: updateError } = await supabase.rpc('approve_withdrawal', {
    withdrawal_id: withdrawalId,
    user_id: userId,
    withdrawal_amount: amount,
    current_balance: user.balance
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
};

// Rejeitar saque
export const rejectWithdrawal = async (withdrawalId: string) => {
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'rejected' })
    .eq('id', withdrawalId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}; 