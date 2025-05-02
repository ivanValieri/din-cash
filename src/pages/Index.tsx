
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, Wallet, Calendar } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.isAdmin ? "/admin" : "/dashboard");
    }
  }, [currentUser, navigate]);

  const benefits = [
    {
      icon: <Check className="h-8 w-8 text-dincash-orange" />,
      title: "Ganhe dinheiro com missões simples",
      description: "Complete tarefas fáceis e rápidas para ganhar recompensas em dinheiro real."
    },
    {
      icon: <Calendar className="h-8 w-8 text-dincash-orange" />,
      title: "Missões novas toda semana",
      description: "Sempre há novas oportunidades para aumentar seus ganhos."
    },
    {
      icon: <Wallet className="h-8 w-8 text-dincash-orange" />,
      title: "Saque fácil a partir de R$20",
      description: "Transfira seu dinheiro para sua conta sem complicações."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Ganhe dinheiro <span className="text-dincash-orange">real</span> com missões simples
              </h1>
              <p className="text-lg mb-8 text-gray-700">
                O DinCash é uma plataforma que te recompensa por completar pequenas tarefas. 
                Ganhe dinheiro de verdade a qualquer hora, de qualquer lugar.
              </p>
              <Button 
                onClick={() => navigate("/login")} 
                className="btn-primary text-lg px-8 py-6"
              >
                Começar Agora
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="bg-dincash-orange rounded-full w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shadow-xl animate-float">
                  <div className="bg-white rounded-full w-56 h-56 md:w-72 md:h-72 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-bold text-dincash-orange">R$</div>
                      <div className="text-2xl md:text-3xl font-medium mt-2">Ganhe Dinheiro</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md card-hover border border-gray-100">
                  <div className="mb-4 flex justify-center">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">{benefit.title}</h3>
                  <p className="text-gray-600 text-center">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-dincash-orange py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pronto para começar a ganhar?
            </h2>
            <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
              Não perca mais tempo! Registre-se agora no DinCash e comece a 
              completar missões para ganhar dinheiro real.
            </p>
            <Button 
              onClick={() => navigate("/login")} 
              className="bg-white text-dincash-orange hover:bg-gray-100 py-2 px-8 rounded-full text-lg font-medium"
            >
              Acessar Agora
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
