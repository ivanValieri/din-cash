
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { CheckCircle, XCircle } from "lucide-react";
import { getWithdrawals, saveWithdrawals, Withdrawal } from "@/data/missionsData";
import { useToast } from "@/hooks/use-toast";

const WithdrawalRequests = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/login");
      return;
    }

    // Load withdrawals
    const loadedWithdrawals = getWithdrawals();
    setWithdrawals(loadedWithdrawals);
  }, [currentUser, navigate]);

  const handleApproveWithdrawal = (id: string) => {
    const updatedWithdrawals = withdrawals.map(withdrawal => {
      if (withdrawal.id === id) {
        return { ...withdrawal, status: "approved" as const };
      }
      return withdrawal;
    });
    
    setWithdrawals(updatedWithdrawals);
    saveWithdrawals(updatedWithdrawals);
    
    // Update user balance
    const withdrawal = withdrawals.find(w => w.id === id);
    if (withdrawal) {
      // Get users from localStorage
      const usersString = localStorage.getItem("dincashUsers");
      if (usersString) {
        const users = JSON.parse(usersString);
        if (users[withdrawal.phoneNumber]) {
          users[withdrawal.phoneNumber].balance -= withdrawal.amount;
          localStorage.setItem("dincashUsers", JSON.stringify(users));
        }
      }
    }

    toast({
      title: "Saque aprovado",
      description: "O saque foi aprovado e o saldo do usuário foi atualizado",
    });
  };

  const handleRejectWithdrawal = (id: string) => {
    const updatedWithdrawals = withdrawals.map(withdrawal => {
      if (withdrawal.id === id) {
        return { ...withdrawal, status: "rejected" as const };
      }
      return withdrawal;
    });
    
    setWithdrawals(updatedWithdrawals);
    saveWithdrawals(updatedWithdrawals);

    toast({
      title: "Saque rejeitado",
      description: "O saque foi rejeitado",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const approvedWithdrawals = withdrawals.filter(w => w.status === "approved");
  const rejectedWithdrawals = withdrawals.filter(w => w.status === "rejected");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Solicitações de Saque</h1>
          
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="pending" className="relative">
                Pendentes
                {pendingWithdrawals.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dincash-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingWithdrawals.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                {pendingWithdrawals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left">Usuário</th>
                          <th className="py-3 px-4 text-left">Valor</th>
                          <th className="py-3 px-4 text-left">Data</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingWithdrawals.map((withdrawal, index) => (
                          <tr 
                            key={withdrawal.id} 
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="py-3 px-4">{withdrawal.phoneNumber}</td>
                            <td className="py-3 px-4">{formatCurrency(withdrawal.amount)}</td>
                            <td className="py-3 px-4">{formatDate(withdrawal.createdAt)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectWithdrawal(withdrawal.id)}
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
                      Não há solicitações de saque pendentes.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                {approvedWithdrawals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left">Usuário</th>
                          <th className="py-3 px-4 text-left">Valor</th>
                          <th className="py-3 px-4 text-left">Data</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedWithdrawals.map((withdrawal, index) => (
                          <tr 
                            key={withdrawal.id} 
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="py-3 px-4">{withdrawal.phoneNumber}</td>
                            <td className="py-3 px-4">{formatCurrency(withdrawal.amount)}</td>
                            <td className="py-3 px-4">{formatDate(withdrawal.createdAt)}</td>
                            <td className="py-3 px-4 text-right">
                              <Badge className="bg-green-600">Aprovado</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-500">
                      Não há solicitações de saque aprovadas.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card>
                {rejectedWithdrawals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left">Usuário</th>
                          <th className="py-3 px-4 text-left">Valor</th>
                          <th className="py-3 px-4 text-left">Data</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedWithdrawals.map((withdrawal, index) => (
                          <tr 
                            key={withdrawal.id} 
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="py-3 px-4">{withdrawal.phoneNumber}</td>
                            <td className="py-3 px-4">{formatCurrency(withdrawal.amount)}</td>
                            <td className="py-3 px-4">{formatDate(withdrawal.createdAt)}</td>
                            <td className="py-3 px-4 text-right">
                              <Badge variant="destructive">Rejeitado</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-500">
                      Não há solicitações de saque rejeitadas.
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WithdrawalRequests;
