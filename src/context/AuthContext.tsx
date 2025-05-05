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
  logout: () => void;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificar se há um usuário autenticado no Supabase Auth e localStorage
  useEffect(() => {
    const checkSession = async () => {
      // Primeiro verifica se há uma sessão ativa no Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Se houver, busca os dados extras na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!userError && userData) {
          setCurrentUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            isAdmin: userData.is_admin,
            balance: userData.balance,
          });
          return;
        }
      }
      
      // Se não houver sessão no Auth, tenta recuperar do localStorage
      const savedUser = localStorage.getItem("dincashUser");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    };
    
    checkSession();
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
    // Desconectar da autenticação Supabase
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate("/");
    toast({
      title: "Logout realizado",
      description: "Até mais!",
    });
  };

  const updateBalance = async (newBalance: number) => {
    if (currentUser) {
      // Atualizar no Supabase
      if (currentUser.id !== "admin") {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', currentUser.id)
            .select()
            .single();
          
          if (error) {
            toast({
              title: "Erro ao atualizar saldo",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
        } catch (error) {
          console.error("Erro ao atualizar saldo:", error);
          toast({
            title: "Erro ao atualizar saldo",
            description: "Ocorreu um erro inesperado. Tente novamente.",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Atualizar localmente
      setCurrentUser({ ...currentUser, balance: newBalance });
    }
  };

  const value = {
    currentUser,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
