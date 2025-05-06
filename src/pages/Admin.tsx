import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Usar currentUser do contexto de autenticação
        if (loading) return;
        
        if (!currentUser) {
          console.log('Nenhum usuário conectado, redirecionando...');
          navigate('/login');
          return;
        }

        // Verificar se o usuário é admin usando o contexto
        if (!currentUser.isAdmin) {
          console.log('Usuário não é administrador, redirecionando...');
          navigate('/dashboard');
          return;
        }

        // Se chegou aqui, o usuário é admin
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        navigate('/login');
      }
    };

    checkAdmin();
  }, [currentUser, navigate, loading]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
            <p>Verificando permissões de administrador</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Painel de Administração</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Gestão de Missões</h2>
            <p className="mb-4">Bem-vindo ao painel de administração. Aqui você pode gerenciar missões e usuários.</p>
            
            {/* Conteúdo do painel admin será implementado aqui */}
            <div className="bg-gray-100 p-4 rounded-md">
              <p>Funcionalidades do painel de administração serão implementadas em breve.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin; 