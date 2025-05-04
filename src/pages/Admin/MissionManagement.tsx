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
import { useToast } from "@/hooks/use-toast";
import { 
  getAllMissions, 
  createMission, 
  deleteMission, 
  getPendingMissionCompletions,
  approveMissionCompletion,
  rejectMissionCompletion
} from "@/services/supabaseService";
import { SupabaseMission, SupabaseMissionCompletion } from "@/config/supabase";
import { supabase } from "@/config/supabase";

const MissionManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [missions, setMissions] = useState<SupabaseMission[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [url, setUrl] = useState("");
  const [isFixedForNewUsers, setIsFixedForNewUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/login");
      return;
    }

    loadData();
  }, [currentUser, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar missões
      const { missions: loadedMissions, error: missionsError } = await getAllMissions();
      if (missionsError) {
        toast({
          title: "Erro ao carregar missões",
          description: missionsError,
          variant: "destructive",
        });
      } else {
        setMissions(loadedMissions);
      }

      // Carregar missões pendentes
      const { pendingCompletions: loadedPendingCompletions, error: pendingError } = 
        await getPendingMissionCompletions();
      
      if (pendingError) {
        toast({
          title: "Erro ao carregar missões pendentes",
          description: pendingError,
          variant: "destructive",
        });
      } else {
        setPendingCompletions(loadedPendingCompletions);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMission = async () => {
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

    setLoading(true);
    try {
      // Create new mission
      const newMissionData = {
        title,
        description,
        value: missionValue,
        is_fixed_for_new_users: isFixedForNewUsers,
        url: url.trim() || undefined
      };

      console.log("Dados da missão para criar:", newMissionData);

      // Verificar se o usuário está autenticado
      const { data: authData } = await supabase.auth.getSession();
      console.log("Sessão atual (antes de criar missão):", authData);

      const { mission, error } = await createMission(newMissionData);

      if (error) {
        console.error("Erro retornado pelo createMission:", error);
        toast({
          title: "Erro ao adicionar missão",
          description: error,
          variant: "destructive",
        });
      } else {
        setMissions(prev => [...prev, mission]);

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
      }
    } catch (error) {
      console.error("Erro ao adicionar missão:", error);
      toast({
        title: "Erro ao adicionar missão",
        description: "Ocorreu um erro ao adicionar a missão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMission = async (id: string) => {
    setLoading(true);
    try {
      const { success, error } = await deleteMission(id);

      if (error) {
        toast({
          title: "Erro ao remover missão",
          description: error,
          variant: "destructive",
        });
      } else {
        setMissions(prev => prev.filter(mission => mission.id !== id));

        toast({
          title: "Missão removida",
          description: "A missão foi removida com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao remover missão:", error);
      toast({
        title: "Erro ao remover missão",
        description: "Ocorreu um erro ao remover a missão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMission = async (completionId: string, userId: string, missionValue: number) => {
    setLoading(true);
    try {
      const { success, error } = await approveMissionCompletion(completionId, userId, missionValue);

      if (error) {
        toast({
          title: "Erro ao aprovar missão",
          description: error,
          variant: "destructive",
        });
      } else {
        // Atualizar a lista de missões pendentes
        setPendingCompletions(prev => prev.filter(completion => completion.id !== completionId));

        toast({
          title: "Missão aprovada",
          description: "A missão foi aprovada e o saldo do usuário foi atualizado",
        });
      }
    } catch (error) {
      console.error("Erro ao aprovar missão:", error);
      toast({
        title: "Erro ao aprovar missão",
        description: "Ocorreu um erro ao aprovar a missão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMission = async (completionId: string) => {
    setLoading(true);
    try {
      const { success, error } = await rejectMissionCompletion(completionId);

      if (error) {
        toast({
          title: "Erro ao rejeitar missão",
          description: error,
          variant: "destructive",
        });
      } else {
        // Atualizar a lista de missões pendentes
        setPendingCompletions(prev => prev.filter(completion => completion.id !== completionId));

        toast({
          title: "Missão rejeitada",
          description: "A missão foi rejeitada com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao rejeitar missão:", error);
      toast({
        title: "Erro ao rejeitar missão",
        description: "Ocorreu um erro ao rejeitar a missão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
                    <Label htmlFor="url">URL (opcional)</Label>
                    <Input
                      id="url"
                      placeholder="URL para redirecionamento"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fixed-new-users"
                      checked={isFixedForNewUsers}
                      onCheckedChange={setIsFixedForNewUsers}
                    />
                    <Label htmlFor="fixed-new-users">Fixar para novos usuários</Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddMission}
                    disabled={loading}
                  >
                    {loading ? "Adicionando..." : "Adicionar Missão"}
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
                {pendingCompletions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dincash-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingCompletions.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {loading ? (
                <div className="text-center p-8">
                  <p>Carregando missões...</p>
                </div>
              ) : (
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
                        {mission.is_fixed_for_new_users && (
                          <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mb-4 inline-block">
                            Fixa para novos usuários
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteMission(mission.id)}
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4 mr-1" /> Remover
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && missions.length === 0 && (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">
                    Nenhuma missão cadastrada. Clique em 'Nova Missão' para adicionar.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending">
              {loading ? (
                <div className="text-center p-8">
                  <p>Carregando missões pendentes...</p>
                </div>
              ) : pendingCompletions.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">
                    Não há missões pendentes de aprovação.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCompletions.map(completion => (
                    <Card key={completion.id} className="card-hover">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {completion.missions.title}
                          </CardTitle>
                          <div className="text-dincash-orange font-bold">
                            {formatCurrency(completion.missions.value)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-sm font-semibold">Usuário: </span>
                          <span className="text-sm">{completion.users.name} ({completion.users.phone_number})</span>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectMission(completion.id)}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => 
                              handleApproveMission(
                                completion.id, 
                                completion.users.id, 
                                completion.missions.value
                              )
                            }
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MissionManagement;
