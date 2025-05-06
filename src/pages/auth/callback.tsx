import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event);
        
        if (event === "SIGNED_IN" && session) {
          // Verificar se o usuário é admin para redirecionamento
          try {
            const { data } = await supabase
              .from("users")
              .select("is_admin")
              .eq("id", session.user.id)
              .single();
            navigate(data?.is_admin ? "/admin" : "/dashboard");
          } catch (error) {
            console.error("Erro ao verificar administrador:", error);
            navigate("/dashboard");
          }
        } else if (event === "SIGNED_OUT") {
          navigate("/");
        }
      }
    );

    // Monitorar a URL para parâmetros de erro
    const handleHashChange = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substr(1));
      const error = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");

      if (error) {
        console.error("Erro de autenticação:", error, errorDescription);
        navigate(`/?error=${error}&error_description=${errorDescription}`);
        return;
      }

      // Se não houver erro, verificar e processar a sessão
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Erro ao obter sessão:", sessionError.message);
        navigate("/");
        return;
      }

      if (data?.session) {
        // Verificar se o usuário é admin
        const { data: userData } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", data.session.user.id)
          .single();

        navigate(userData?.is_admin ? "/admin" : "/dashboard");
      } else {
        navigate("/");
      }
    };

    handleHashChange();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center">Processando autenticação...</h2>
        <p className="text-center text-gray-600">
          Por favor, aguarde enquanto verificamos seu login.
        </p>
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate.spin"></div>
        </div>
      </div>
    </div>
  );
} 