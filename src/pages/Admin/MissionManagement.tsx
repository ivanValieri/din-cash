import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Plus, Trash, CheckCircle, XCircle, Edit, Link } from "lucide-react";
import { Mission, getMissions, saveMissions } from "@/data/missionsData";
import { useToast } from "@/hooks/use-toast";

const MissionManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [url, setUrl] = useState("");
  const [isFixedForNewUsers, setIsFixedForNewUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/login");
      return;
    }

    // Load missions
    const loadedMissions = getMissions();
    setMissions(loadedMissions);
  }, [currentUser, navigate]);

  const handleAddMission = () => {
    // Validation
    if (!title || !description || !value) {
      toast({
        title: "Erro ao adicionar missão",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const missionValue = Number(value);
    if (isNaN(missionValue) || missionValue <= 0) {
      toast({
        title: "Erro ao adicionar missão",
        description: "O valor da missão deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Create new mission
    const newMission: Mission = {
      id: Date.now().toString(),
      title,
      description,
      value: missionValue,
      isFixedForNewUsers: isFixedForNewUsers,
      completions: [],
      pendingApproval: [],
      url: url.trim() || undefined, // Add URL if provided
    };

    // Add mission to state and save to localStorage
    const updatedMissions = [...missions, newMission];
    setMissions(updatedMissions);
    saveMissions(updatedMissions);

    // Reset form
    setTitle("");
    setDescription("");
    setValue("");
    setUrl("");
    setIsFixedForNewUsers(false);

    toast({
      title: "Missão adicionada",
      description: "A missão foi adicionada com sucesso",
    });
  };

  const handleDeleteMission = (id: string) => {
    const updatedMissions = missions.filter(mission => mission.id !== id);
    setMissions(updatedMissions);
    saveMissions(updatedMissions);

    toast({
      title: "Missão removida",
      description: "A missão foi removida com sucesso",
    });
  };

  const handleApproveMission = (missionId: string, userPhoneNumber: string) => {
    // Find the mission to get its value
    const mission = missions.find(m => m.id === missionId);
    if (!mission) {
      toast({
        title: "Erro",
        description: "Missão não encontrada.",
        variant: "destructive",
      });
      return;
    }

    // Update missions state
    const updatedMissions = missions.map(m => {
      if (m.id === missionId) {
        // Remove from pending and add to completions
        const updatedPendingApproval = m.pendingApproval.filter(
          phone => phone !== userPhoneNumber
        );
        return {
          ...m,
          pendingApproval: updatedPendingApproval,
          completions: [...m.completions, userPhoneNumber],
        };
      }
      return m;
    });
    
    setMissions(updatedMissions);
    saveMissions(updatedMissions);

    // Get users from localStorage
    const usersString = localStorage.getItem("dincashUsers");
    if (usersString) {
      const users = JSON.parse(usersString);
      
      if (users[userPhoneNumber]) {
        // Update the user's balance
        const currentBalance = users[userPhoneNumber].balance || 0;
        const newBalance = currentBalance + mission.value;
        
        users[userPhoneNumber].balance = newBalance;
        localStorage.setItem("dincashUsers", JSON.stringify(users));
        
        toast({
          title: "Missão aprovada",
          description: `A missão foi aprovada e o saldo do usuário foi atualizado para ${newBalance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Usuário não encontrado.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Erro",
        description: "Dados de usuário não encontrados.",
        variant: "destructive",
      });
    }
  };

  const handleRejectMission = (missionId: string, userPhoneNumber: string) => {
    const updatedMissions = missions.map(mission => {
      if (mission.id === missionId) {
        // Just remove from pending
        const updatedPendingApproval = mission.pendingApproval.filter(
          phone => phone !== userPhoneNumber
        );
        return {
          ...mission,
          pendingApproval: updatedPendingApproval,
        };
      }
      return mission;
    });
    
    setMissions(updatedMissions);
    saveMissions(updatedMissions);

    toast({
      title: "Missão rejeitada",
      description: "A missão foi rejeitada e voltará a aparecer para o usuário",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Get pending missions
  const pendingApprovals = missions.flatMap(mission => 
    mission.pendingApproval.map(phone => ({
      missionId: mission.id,
      missionTitle: mission.title,
      missionValue: mission.value,
      userPhone: phone,
    }))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Gerenciamento de Missões</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-1" /> Nova Missão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Missão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Missão</Label>
                    <Input
                      id="title"
                      placeholder="Digite o título da missão"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Digite a descrição detalhada da missão"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor da recompensa"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Link para realizar a missão (opcional)</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        <Link className="h-4 w-4" />
                      </span>
                      <Input
                        id="url"
                        placeholder="https://exemplo.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fixed-mission"
                      checked={isFixedForNewUsers}
                      onCheckedChange={setIsFixedForNewUsers}
                    />
                    <Label htmlFor="fixed-mission">
                      Missão fixa para novos usuários
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button className="btn-primary" onClick={handleAddMission}>
                    Adicionar Missão
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Todas as Missões</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Missões em Análise
                {pendingApprovals.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dincash-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {missions.map((mission) => (
                  <Card key={mission.id} className="card-hover">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        <div className="text-dincash-orange font-bold">
                          {formatCurrency(mission.value)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 text-sm">{mission.description}</p>
                      {mission.isFixedForNewUsers && (
                        <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mb-4 inline-block">
                          Fixa para novos usuários
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {mission.completions.length} completadas
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {missions.length === 0 && (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">
                    Nenhuma missão cadastrada. Clique em 'Nova Missão' para adicionar.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {pendingApprovals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left">Usuário</th>
                          <th className="py-3 px-4 text-left">Missão</th>
                          <th className="py-3 px-4 text-left">Valor</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.map((item, index) => (
                          <tr 
                            key={`${item.missionId}-${item.userPhone}`} 
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="py-3 px-4">{item.userPhone}</td>
                            <td className="py-3 px-4">{item.missionTitle}</td>
                            <td className="py-3 px-4">{formatCurrency(item.missionValue)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveMission(item.missionId, item.userPhone)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectMission(item.missionId, item.userPhone)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-500">
                      Não há missões pendentes para aprovação.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MissionManagement;
