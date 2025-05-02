
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { currentUser, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.isAdmin ? "/admin" : "/dashboard");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!phoneNumber || !password) {
      setError("Preencha todos os campos");
      return;
    }

    // Phone number format validation
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Número de telefone inválido. Use apenas números (10 ou 11 dígitos)");
      return;
    }

    try {
      setIsSubmitting(true);
      login(phoneNumber, password);
    } catch (err) {
      console.error(err);
      setError("Erro ao fazer login. Tente novamente.");
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
                <label htmlFor="phoneNumber" className="block text-sm font-medium">
                  Número de Telefone
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Digite seu número"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                  autoComplete="tel"
                />
                <p className="text-xs text-gray-500">
                  Formato: DDD + número (apenas dígitos)
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Entrar"}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Se este número for novo no sistema, uma conta será criada automaticamente.
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
