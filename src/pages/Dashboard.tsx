import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Dashboard = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    const checkAuth = async () => {
      if (!loading && !currentUser) {
        console.log("Nenhum usuário autenticado, redirecionando para login");
        navigate("/login");
      } else if (currentUser) {
        console.log("Usuário autenticado:", currentUser);
        console.log("É admin?", currentUser.isAdmin);
        
        setUserName(currentUser.name);
        setUserEmail(currentUser.email);
        
        // Redirecionar para rota de admin se o usuário for administrador
        if (currentUser.isAdmin) {
          console.log("Usuário é admin, redirecionando para painel administrativo");
          navigate("/admin");
        } else {
          console.log("Usuário não é admin, permanecendo no dashboard");
        }
      }
    };

    checkAuth();
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
            <p>Verificando sua sessão</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow p-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">Bem-vindo, {userName}!</h1>
            <p className="text-gray-600">Email: {userEmail}</p>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Área do usuário</h2>
              <p className="text-blue-700">
                Esta é sua área pessoal onde você pode visualizar missões disponíveis e acompanhar seu progresso.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Suas Missões</h2>
            
            <div className="p-4 bg-gray-100 rounded-md text-center">
              <p className="text-gray-600">
                Em breve, você poderá ver e participar de missões disponíveis.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
