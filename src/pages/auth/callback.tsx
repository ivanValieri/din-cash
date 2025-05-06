import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar parâmetros de erro na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorCode = hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description");

        if (errorCode || errorDescription) {
          console.error("Erro na autenticação:", errorCode, errorDescription);
          setError(errorDescription || "Erro de autenticação");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        // Verificar sessão atual
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erro ao obter sessão:", sessionError.message);
          setError("Erro ao verificar sessão");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        if (data?.session) {
          console.log("Sessão encontrada, redirecionando...");
          try {
            // Verificar se o usuário é admin
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("is_admin")
              .eq("id", data.session.user.id)
              .single();

            if (userError) {
              console.warn("Erro ao verificar perfil:", userError);
              navigate("/dashboard");
              return;
            }

            navigate(userData?.is_admin ? "/admin" : "/dashboard");
          } catch (err) {
            console.error("Erro ao redirecionar:", err);
            navigate("/dashboard");
          }
        } else {
          console.log("Nenhuma sessão encontrada");
          navigate("/login");
        }
      } catch (err) {
        console.error("Erro no processamento do callback:", err);
        setError("Ocorreu um erro ao processar a autenticação");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center">
          {error ? "Erro de autenticação" : "Processando autenticação..."}
        </h2>
        <p className="text-center text-gray-600">
          {error ? error : "Por favor, aguarde enquanto verificamos seu login."}
        </p>
        {!error && (
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <p className="text-center text-sm text-gray-500">
            Redirecionando para a página de login em alguns segundos...
          </p>
        )}
      </div>
    </div>
  );
} 