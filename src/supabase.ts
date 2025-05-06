import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key configurada:", supabaseAnonKey ? "Sim (valor oculto)" : "Não configurada");

// Configurações adicionais para persistir a sessão
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Usar localStorage para armazenar o token
    storage: {
      getItem: (key: string) => {
        try {
          const value = localStorage.getItem(key);
          return value ? value : null;
        } catch (error) {
          console.error('Erro ao ler localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao escrever localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover localStorage:', error);
        }
      }
    }
  },
  global: {
    // Sempre enviar os cabeçalhos de autenticação
    headers: { 
      'X-Supabase-Auth-Include': 'true',
      'Content-Type': 'application/json'
    }
  },
  realtime: {
    // Para garantir que eventuais eventos em tempo real funcionem
    params: {
      eventsPerSecond: 10
    }
  },
  // Adicionar debug para ver erros de rede
  debug: true
};

// Cria o cliente do Supabase com as opções de autenticação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Função para registrar e enviar Magic Link por e-mail
export async function signUpWithMagicLink(email: string, name: string) {
  try {
    const redirectTo = import.meta.env.VITE_REDIRECT_URL || 'http://localhost:3000';
    if (!email) throw new Error('E-mail é obrigatório');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw new Error(`Erro ao enviar Magic Link: ${error.message}`);
    console.log('Magic Link enviado. Verifique seu e-mail:', email);
    return data;
  } catch (error) {
    console.error('Erro no registro por e-mail:', error);
    throw error;
  }
}

// Função para registro com email e senha
export async function signUpWithEmailAndPassword(email: string, password: string, name: string) {
  try {
    // Registrar o usuário com email e senha e incluir o redirecionamento
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    if (error) throw new Error(`Erro ao registrar: ${error.message}`);
    
    // Log para depuração
    console.log('Usuário registrado com sucesso:', data.user?.id);
    
    return data;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

// Função para login com email e senha
export async function signInWithEmailAndPassword(email: string, password: string) {
  try {
    console.log('Tentando login com:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro de login:', error.message);
      throw new Error(`Erro ao fazer login: ${error.message}`);
    }
    
    console.log('Login bem-sucedido:', data.user?.id);
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Função para atualizar o perfil do usuário na tabela users após autenticação
export async function updateUserProfile(email: string, name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email,
        name,
        balance: 0,
        is_admin: false,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    console.log('Perfil atualizado:', data);
    return data;
  }
}

// Interfaces para os tipos de dados
export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

export interface SupabaseMission {
  id: string;
  title: string;
  description: string;
  value: number;
  is_fixed_for_new_users: boolean;
  url?: string;
  created_at: string;
}

export interface SupabaseMissionCompletion {
  id: string;
  user_id: string;
  mission_id: string;
  status: 'completed' | 'pending' | 'rejected';
  created_at: string;
}

export interface SupabaseWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
} 