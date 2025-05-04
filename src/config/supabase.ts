import { createClient } from '@supabase/supabase-js';

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Configurações adicionais para persistir a sessão
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Usar localStorage para armazenar o token
    storage: {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return value ? value : null;
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
      }
    }
  },
  global: {
    // Sempre enviar os cabeçalhos de autenticação
    headers: { 
      'X-Supabase-Auth-Include': 'true'
    }
  }
};

// Cria o cliente do Supabase com as opções de autenticação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Verifique se há uma sessão ao iniciar
(async () => {
  const { data } = await supabase.auth.getSession();
  console.log("Sessão carregada:", data);
})();

// Interfaces para os tipos de dados
export interface SupabaseUser {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
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