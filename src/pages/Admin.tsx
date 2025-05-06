import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Verificar se o usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Verificar se o usuário é admin
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error || !data?.is_admin) {
          console.error('Acesso negado ou erro:', error);
          navigate('/dashboard');
          return;
        }

        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
        navigate('/login');
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p>Carregando...</p>
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