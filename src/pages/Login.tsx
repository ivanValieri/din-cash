import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, signUpWithEmailAndPassword, signInWithEmailAndPassword } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("login"); // "login" ou "signup"

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

  // Limpar os campos quando trocar de aba
  useEffect(() => {
    setError("");
    setSuccessMessage("");
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validação básica
    if (!email || !password) {
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
      
      // Login com email e senha
      await signInWithEmailAndPassword(email, password);
      
      setSuccessMessage("Login realizado com sucesso! Redirecionando...");
      
      // Verificar se o usuário é admin para redirecionamento correto
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        
        setTimeout(() => {
          navigate(userData?.is_admin ? "/admin" : "/dashboard");
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validação básica
    if (!email || !password || !confirmPassword || !name) {
      setError("Preencha todos os campos");
      return;
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("E-mail inválido. Insira um e-mail válido.");
      return;
    }

    // Validação de senhas iguais
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    // Validação de senha forte
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsSubmitting(true);
      await signUpWithEmailAndPassword(email, password, name);
      setSuccessMessage("Conta criada com sucesso! Você já pode fazer login.");
      
      // Mudar para a aba de login após o registro bem-sucedido
      setTimeout(() => {
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-8">
        <Card className="w-[400px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-center">
              Login e cadastro fácil com seu e-mail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              {/* Aba de Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="block text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="login-password" className="block text-sm font-medium">
                      Senha
                    </label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="current-password"
                    />
                  </div>

                  {error && activeTab === "login" && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}
                  {successMessage && activeTab === "login" && (
                    <div className="text-green-500 text-sm">{successMessage}</div>
                  )}

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Aba de Cadastro */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="block text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="email"
                    />
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

                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="block text-sm font-medium">
                      Senha
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="block text-sm font-medium">
                      Confirmar Senha
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="new-password"
                    />
                  </div>

                  {error && activeTab === "signup" && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}
                  {successMessage && activeTab === "signup" && (
                    <div className="text-green-500 text-sm">{successMessage}</div>
                  )}

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Criando..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login; 