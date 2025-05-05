import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, signUpWithMagicLink, updateUserProfile } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verificar se o usuário é administrador
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Erro ao verificar admin:", userError);
          return;
        }

        navigate(userData?.is_admin ? "/admin" : "/dashboard");
      }
    };

    checkSession();
  }, [navigate]);

  // Verificar se a sessão foi criada após clicar no Magic Link
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await updateUserProfile(email, name);
          setSuccessMessage("Perfil atualizado com sucesso! Redirecionando...");
          const { data: userData } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          navigate(userData?.is_admin ? "/admin" : "/dashboard");
        } catch (err) {
          setError("Erro ao atualizar perfil. Veja o console para detalhes.");
          console.error("Erro ao atualizar perfil:", err);
        }
        clearInterval(interval);
      }
    }, 1000); // Verifica a cada segundo

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [email, name, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validação básica
    if (!email || !name) {
      setError("Preencha todos os campos");
      return;
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("E-mail inválido. Insira um e-mail válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signUpWithMagicLink(email, name);
      setSuccessMessage("Magic Link enviado! Verifique seu e-mail.");
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar Magic Link. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-8">
        <Card className="w-[350px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Acesse sua conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                  autoComplete="email"
                />
                <p className="text-xs text-gray-500">
                  Insira um e-mail válido para receber o Magic Link
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                  autoComplete="name"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              {successMessage && (
                <div className="text-green-500 text-sm">{successMessage}</div>
              )}

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Magic Link"}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Você receberá um link mágico para acessar sua conta.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login; 