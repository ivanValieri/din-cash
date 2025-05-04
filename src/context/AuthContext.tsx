import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signInWithPhoneNumber, signUpUser, updateUserBalance as updateSupabaseUserBalance, getUserById } from "@/services/supabaseService";
import { SupabaseUser } from "@/config/supabase";
import { supabase } from "@/config/supabase";

interface User {
  id: string;
  phoneNumber: string;
  isAdmin: boolean;
  balance: number;
}

interface AuthContextType {
  currentUser: User | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
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
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem("dincashUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("dincashUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("dincashUser");
    }
  }, [currentUser]);

  // Administrador fixo para caso de emergência
  const adminUser = {
    phoneNumber: "73982505494",
    password: "admgeral",
    isAdmin: true,
    balance: 0,
  };

  const login = async (phoneNumber: string, password: string) => {
    // Admin fixo para emergência (backup)
    if (phoneNumber === adminUser.phoneNumber && password === adminUser.password) {
      setCurrentUser({
        id: "admin",
        phoneNumber,
        isAdmin: true,
        balance: 0,
      });
      navigate("/admin");
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo, Administrador!",
      });
      return;
    }

    try {
      // Limpar sessão anterior para evitar conflitos
      await supabase.auth.signOut();
      
      // Tentar autenticação via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone: phoneNumber,
        password,
      });
      
      if (authError) {
        // Se não conseguir fazer login, tenta criar o usuário
        if (authError.message.includes('Invalid login')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            phone: phoneNumber,
            password,
          });
          
          if (signUpError) {
            toast({
              title: "Erro ao criar conta",
              description: signUpError.message,
              variant: "destructive",
            });
            return;
          }
          
          // Criar usuário na tabela users
          const { user: newUser, error: userError } = await signUpUser(phoneNumber, "Novo Usuário", password);
          if (userError) {
            toast({
              title: "Erro ao criar perfil",
              description: userError,
              variant: "destructive",
            });
            return;
          }
          
          setCurrentUser({
            id: newUser.id,
            phoneNumber: newUser.phone_number,
            isAdmin: newUser.is_admin,
            balance: newUser.balance,
          });
          
          navigate("/dashboard");
          toast({
            title: "Conta criada com sucesso",
            description: "Bem-vindo ao DinCash!",
          });
          return;
        } else {
          toast({
            title: "Erro de login",
            description: authError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Login bem-sucedido, buscar dados extras
      const { user: userData, error: userError } = await getUserById(authData.user.id);
      if (userError) {
        toast({
          title: "Erro ao buscar dados do usuário",
          description: userError,
          variant: "destructive",
        });
        return;
      }
      
      setCurrentUser({
        id: userData.id,
        phoneNumber: userData.phone_number,
        isAdmin: userData.is_admin,
        balance: userData.balance,
      });
      
      if (userData.is_admin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
      
    } catch (error) {
      console.error("Erro no processo de login:", error);
      toast({
        title: "Erro de login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
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
        const { user, error } = await updateSupabaseUserBalance(currentUser.id, newBalance);
        
        if (error) {
          toast({
            title: "Erro ao atualizar saldo",
            description: error,
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
    login,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
