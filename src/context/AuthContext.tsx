import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signInWithPhoneNumber, signUpUser, updateUserBalance as updateSupabaseUserBalance } from "@/services/supabaseService";
import { SupabaseUser } from "@/config/supabase";

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

    // Tentar autenticação via Supabase
    const { user, error } = await signInWithPhoneNumber(phoneNumber, password);

    if (user) {
      // Usuário existe
      setCurrentUser({
        id: user.id,
        phoneNumber: user.phone_number,
        isAdmin: user.is_admin,
        balance: user.balance,
      });
      
      if (user.is_admin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } else if (error) {
      // Verificar se o erro é porque o usuário não existe
      if (error.includes("not found")) {
        // Criar novo usuário
        const { user: newUser, error: signUpError } = await signUpUser(phoneNumber, "Novo Usuário", password);
        
        if (newUser) {
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
        } else {
          toast({
            title: "Erro ao criar conta",
            description: signUpError || "Ocorreu um erro ao criar a conta",
            variant: "destructive",
          });
        }
      } else {
        // Outro tipo de erro
        toast({
          title: "Erro de login",
          description: error,
          variant: "destructive",
        });
      }
    }
  };

  const logout = () => {
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
