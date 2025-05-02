
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMissions, saveMissions, Mission } from "@/data/missionsData";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Check, AlertCircle, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { currentUser, updateBalance } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser || currentUser.isAdmin) {
      navigate("/");
      return;
    }

    // Load missions
    const loadedMissions = getMissions();
    setMissions(loadedMissions);
    
    // Check if user balance needs to be refreshed from localStorage
    if (currentUser) {
      const usersString = localStorage.getItem("dincashUsers");
      if (usersString) {
        const users = JSON.parse(usersString);
        if (users[currentUser.phoneNumber] && users[currentUser.phoneNumber].balance !== currentUser.balance) {
          // Update the balance in context if it's different from localStorage
          updateBalance(users[currentUser.phoneNumber].balance);
        }
      }
    }
  }, [currentUser, navigate, updateBalance]);

  const handleCompleteMission = (mission: Mission) => {
    // If the mission has a URL, open it in a new tab
    if (mission.url) {
      window.open(mission.url, '_blank');
      // We don't mark the mission as completed yet - user needs to come back and mark it as completed
      toast({
        title: "Missão aberta",
        description: `Complete a tarefa no site aberto e depois volte para marcar como concluída.`,
      });
      return;
    }

    // For missions without URLs, mark as pending approval immediately
    const updatedMissions = missions.map(m => {
      if (m.id === mission.id && currentUser) {
        return {
          ...m,
          pendingApproval: [...m.pendingApproval, currentUser.phoneNumber]
        };
      }
      return m;
    });
    
    setMissions(updatedMissions);
    saveMissions(updatedMissions);
    
    toast({
      title: "Missão enviada para análise",
      description: `Sua missão "${mission.title}" foi enviada para aprovação.`,
    });
  };

  // Filter missions available for the user
  const availableMissions = missions.filter(mission => {
    if (!currentUser) return false;
    
    // User hasn't completed this mission and it's not pending
    const notCompleted = !mission.completions.includes(currentUser.phoneNumber);
    const notPending = !mission.pendingApproval.includes(currentUser.phoneNumber);
    
    return notCompleted && notPending;
  });

  const pendingMissions = missions.filter(mission => {
    if (!currentUser) return false;
    return mission.pendingApproval.includes(currentUser.phoneNumber);
  });

  const completedMissions = missions.filter(mission => {
    if (!currentUser) return false;
    return mission.completions.includes(currentUser.phoneNumber);
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          {/* User welcome and balance */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Olá, amigo!</h1>
            <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Seu saldo atual</p>
                <p className="text-2xl font-bold text-dincash-orange">
                  {currentUser ? formatCurrency(currentUser.balance) : "R$ 0,00"}
                </p>
              </div>
              <Button
                onClick={() => navigate("/withdrawal")}
                className="btn-primary"
              >
                Sacar
              </Button>
            </div>
          </div>

          {/* Available Missions */}
          <h2 className="text-xl font-bold mb-4">Missões Disponíveis</h2>
          {availableMissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {availableMissions.map((mission) => (
                <Card key={mission.id} className="card-hover">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                      <Badge className="bg-dincash-orange">{formatCurrency(mission.value)}</Badge>
                    </div>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => handleCompleteMission(mission)}
                      className={`w-full ${mission.url ? "flex gap-2 items-center" : "btn-primary"}`}
                      variant={mission.url ? "outline" : "default"}
                    >
                      {mission.url && <Link className="h-4 w-4" />}
                      {mission.url ? "Acessar Missão" : "Completar Missão"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-6">
                <p className="text-center text-gray-500">
                  Não há missões disponíveis no momento. Volte mais tarde!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pending Missions */}
          {pendingMissions.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-4">Missões em Análise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {pendingMissions.map((mission) => (
                  <Card key={mission.id} className="border-l-4 border-yellow-400">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        <Badge className="bg-yellow-500">{formatCurrency(mission.value)}</Badge>
                      </div>
                      <CardDescription>{mission.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="bg-yellow-50">
                      <div className="flex items-center gap-2 text-yellow-700 w-full justify-center">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Aguardando aprovação</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-4">Missões Completadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedMissions.map((mission) => (
                  <Card key={mission.id} className="border-l-4 border-green-400">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        <Badge className="bg-green-500">{formatCurrency(mission.value)}</Badge>
                      </div>
                      <CardDescription>{mission.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="bg-green-50">
                      <div className="flex items-center gap-2 text-green-700 w-full justify-center">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Concluída</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
