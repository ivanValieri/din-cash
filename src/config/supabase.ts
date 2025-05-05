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

// Verifique se há uma sessão ao iniciar
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erro ao verificar sessão:", error);
    } else {
      console.log("Sessão carregada:", data);
      
      // Verificar o usuário 
      if (data.session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', data.session.user.id)
          .single();
          
        if (userError) {
          console.error("Erro ao buscar dados de admin:", userError);
        } else {
          console.log("Usuário é admin?", userData?.is_admin);
        }
      }
    }
  } catch (e) {
    console.error("Exceção ao verificar sessão:", e);
  }
})();

// Interfaces para os tipos de dados
export interface SupabaseUser {
  id: string;
  phone_number?: string; // Tornou-se opcional para refletir a mudança para autenticação por e-mail
  name: string;
  email: string; // Agora é obrigatório, já que usaremos autenticação por e-mail
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
  status: 'completed' | 'pending';
  created_at: string;
}

export interface SupabaseWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}