
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Wallet, AlertTriangle } from "lucide-react";
import { getWithdrawals, saveWithdrawals, Withdrawal } from "@/data/missionsData";
import { useToast } from "@/hooks/use-toast";

const WithdrawalPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<string>("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser || currentUser.isAdmin) {
      navigate("/");
      return;
    }

    // Load withdrawals
    const loadedWithdrawals = getWithdrawals();
    setWithdrawals(loadedWithdrawals);
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors("");

    // Validate amount
    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setErrors("Digite um valor válido");
      return;
    }

    if (withdrawalAmount < 20) {
      setErrors("O valor mínimo para saque é R$20");
      return;
    }

    if (!currentUser) {
      setErrors("Usuário não encontrado");
      return;
    }

    if (withdrawalAmount > currentUser.balance) {
      setErrors("Saldo insuficiente para este saque");
      return;
    }

    // Create new withdrawal request
    const newWithdrawal: Withdrawal = {
      id: Date.now().toString(),
      phoneNumber: currentUser.phoneNumber,
      amount: withdrawalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save withdrawal
    const updatedWithdrawals = [...withdrawals, newWithdrawal];
    setWithdrawals(updatedWithdrawals);
    saveWithdrawals(updatedWithdrawals);

    // Reset form
    setAmount("");

    // Show success message
    toast({
      title: "Solicitação de saque enviada",
      description: "Sua solicitação foi recebida e está em análise.",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Get user's pending withdrawals
  const pendingWithdrawals = withdrawals.filter(
    (w) => w.phoneNumber === currentUser?.phoneNumber && w.status === "pending"
  );

  // Get user's approved withdrawals
  const completedWithdrawals = withdrawals.filter(
    (w) => w.phoneNumber === currentUser?.phoneNumber && w.status === "approved"
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">Solicitar Saque</h1>
          
          {/* Balance Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Saldo Disponível</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-dincash-orange bg-opacity-10 p-3 rounded-full">
                  <Wallet className="h-8 w-8 text-dincash-orange" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-dincash-orange">
                    {currentUser ? formatCurrency(currentUser.balance) : "R$ 0,00"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Saldo disponível para saque
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
              <CardDescription>
                O valor mínimo para saque é de R$20,00
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="block text-sm font-medium">
                    Valor para Saque (R$)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="20"
                    step="0.01"
                    placeholder="Digite o valor"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Número para recebimento
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={currentUser?.phoneNumber || ""}
                    disabled
                    className="w-full bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    O saque será enviado para o mesmo número usado no cadastro.
                  </p>
                </div>

                {errors && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2 items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="text-red-600 text-sm">{errors}</div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={!currentUser || currentUser.balance < 20}
                >
                  Solicitar Saque
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Withdrawals */}
          {pendingWithdrawals.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Saques em Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Em análise
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Withdrawals */}
          {completedWithdrawals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saques Aprovados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="bg-green-50 border border-green-200 rounded-md p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Aprovado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WithdrawalPage;
