import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SupabaseUser } from "@/config/supabase";
import { supabase } from "@/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  balance: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificar se há um usuário autenticado ao carregar
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        // Verificar se existe uma sessão
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Usuário encontrado:", session.user.id);
          // Buscar dados adicionais na tabela users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userError) {
            console.error("Erro ao buscar dados do usuário:", userError);
            return;
          }
          
          if (userData) {
            // Lendo dados do perfil JSONB
            const profile = userData.profile || {};
            setCurrentUser({
              id: userData.id,
              email: userData.email || session.user.email || '',
              name: profile.name || 'Usuário',
              isAdmin: profile.is_admin || false,
              balance: profile.balance || 0,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Verificar a sessão inicial
    checkSession();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event);
        
        if (event === 'SIGNED_IN' && session) {
          // Atualizar o estado do usuário quando fizer login
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!userError && userData) {
            // Lendo dados do perfil JSONB
            const profile = userData.profile || {};
            setCurrentUser({
              id: userData.id,
              email: userData.email || session.user.email || '',
              name: profile.name || 'Usuário',
              isAdmin: profile.is_admin || false,
              balance: profile.balance || 0,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Limpar o estado do usuário quando fizer logout
          setCurrentUser(null);
        }
      }
    );
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("dincashUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("dincashUser");
    }
  }, [currentUser]);

  // Para emergência: permitir ao admin acessar por um botão específico
  // Este botão pode ser adicionado na página de login para situações de emergência
  const loginAsAdmin = () => {
    setCurrentUser({
      id: "admin",
      email: "admin@dincash.com",
      name: "Administrador",
      isAdmin: true,
      balance: 0,
    });
    navigate("/admin");
    toast({
      title: "Login administrativo",
      description: "Bem-vindo, Administrador!",
    });
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!currentUser) return;
    
    try {
      // Primeiro obter o perfil atual
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('profile')
        .eq('id', currentUser.id)
        .single();
      
      if (fetchError) {
        console.error("Erro ao buscar perfil:", fetchError);
        return;
      }
      
      // Criar um novo objeto profile combinando o existente com o novo saldo
      const currentProfile = userData.profile || {};
      const updatedProfile = { ...currentProfile, balance: newBalance };
      
      // Atualizar o perfil
      const { error } = await supabase
        .from('users')
        .update({ profile: updatedProfile })
        .eq('id', currentUser.id);
      
      if (error) {
        console.error("Erro ao atualizar saldo:", error);
        return;
      }
      
      // Atualizar o estado local
      setCurrentUser({ ...currentUser, balance: newBalance });
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
