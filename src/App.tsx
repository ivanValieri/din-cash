import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WithdrawalPage from "./pages/Withdrawal";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import MissionManagement from "./pages/Admin/MissionManagement";
import UserManagement from "./pages/Admin/UserManagement";
import WithdrawalRequests from "./pages/Admin/WithdrawalRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="max-w-lg w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-4">Bem-vindo ao DinCash</h1>
          <p className="text-center mb-6">
            Sua plataforma para completar missões e ganhar recompensas.
          </p>
          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => navigate('/login')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Entrar na plataforma
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
