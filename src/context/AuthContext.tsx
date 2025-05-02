
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  phoneNumber: string;
  isAdmin: boolean;
  balance: number;
}

interface AuthContextType {
  currentUser: User | null;
  login: (phoneNumber: string, password: string) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
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

  // Mock users database
  const adminUser = {
    phoneNumber: "73982505494",
    password: "admgeral",
    isAdmin: true,
    balance: 0,
  };

  // Mock regular users database
  const [users, setUsers] = useState<{[key: string]: {password: string, isAdmin: boolean, balance: number}}>(() => {
    const savedUsers = localStorage.getItem("dincashUsers");
    return savedUsers ? JSON.parse(savedUsers) : { 
      [adminUser.phoneNumber]: {
        password: adminUser.password,
        isAdmin: adminUser.isAdmin,
        balance: adminUser.balance,
      }
    };
  });

  // Save users whenever it changes
  useEffect(() => {
    localStorage.setItem("dincashUsers", JSON.stringify(users));
  }, [users]);

  const login = (phoneNumber: string, password: string) => {
    // Admin check
    if (phoneNumber === adminUser.phoneNumber) {
      if (password === adminUser.password) {
        setCurrentUser({
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
      } else {
        toast({
          title: "Erro de login",
          description: "Senha incorreta para administrador",
          variant: "destructive",
        });
        return;
      }
    }

    // Regular user check
    if (users[phoneNumber]) {
      if (users[phoneNumber].password === password) {
        setCurrentUser({
          phoneNumber,
          isAdmin: false,
          balance: users[phoneNumber].balance,
        });
        navigate("/dashboard");
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!",
        });
      } else {
        toast({
          title: "Erro de login",
          description: "Senha incorreta",
          variant: "destructive",
        });
      }
    } else {
      // Create new user
      const newUser = {
        password,
        isAdmin: false,
        balance: 0,
      };
      
      setUsers(prevUsers => ({
        ...prevUsers,
        [phoneNumber]: newUser
      }));
      
      setCurrentUser({
        phoneNumber,
        isAdmin: false,
        balance: 0,
      });
      
      navigate("/dashboard");
      toast({
        title: "Conta criada com sucesso",
        description: "Bem-vindo ao DinCash!",
      });
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

  const updateBalance = (newBalance: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, balance: newBalance });
      
      // Update users state as well
      setUsers(prevUsers => ({
        ...prevUsers,
        [currentUser.phoneNumber]: {
          ...prevUsers[currentUser.phoneNumber],
          balance: newBalance
        }
      }));
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
