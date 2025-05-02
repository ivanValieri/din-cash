
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Users, ListChecks, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMissions, getWithdrawals } from "@/data/missionsData";

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const featuredCards = [
    {
      title: "Gerenciar Missões",
      description: "Adicionar, editar ou remover missões do sistema",
      icon: <ListChecks className="h-12 w-12 text-dincash-orange" />,
      link: "/admin/missions",
    },
    {
      title: "Missões em Análise",
      description: "Revisar e aprovar missões completadas pelos usuários",
      icon: <FileText className="h-12 w-12 text-dincash-orange" />,
      link: "/admin/missions",
      count: getMissions().reduce((count, mission) => count + mission.pendingApproval.length, 0),
    },
    {
      title: "Gerenciar Usuários",
      description: "Visualizar informações de todos os usuários registrados",
      icon: <Users className="h-12 w-12 text-dincash-orange" />,
      link: "/admin/users",
    },
    {
      title: "Solicitações de Saque",
      description: "Aprovar ou rejeitar solicitações de saque",
      icon: <CreditCard className="h-12 w-12 text-dincash-orange" />,
      link: "/admin/withdrawals",
      count: getWithdrawals().filter(w => w.status === "pending").length,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Painel de Administração</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredCards.map((card, index) => (
              <Card key={index} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{card.title}</CardTitle>
                    {card.count !== undefined && card.count > 0 && (
                      <div className="bg-dincash-orange text-white text-sm font-bold px-3 py-1 rounded-full">
                        {card.count}
                      </div>
                    )}
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    {card.icon}
                    <Button 
                      onClick={() => navigate(card.link)} 
                      className="btn-primary w-full"
                    >
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
