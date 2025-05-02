
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Search } from "lucide-react";

interface User {
  phoneNumber: string;
  password: string;
  isAdmin: boolean;
  balance: number;
}

const UserManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Redirect if not admin
    if (!currentUser?.isAdmin) {
      navigate("/login");
      return;
    }

    // Load users
    const usersString = localStorage.getItem("dincashUsers");
    if (usersString) {
      const usersData = JSON.parse(usersString);
      const formattedUsers = Object.entries(usersData).map(([phoneNumber, data]: [string, any]) => ({
        phoneNumber,
        password: data.password,
        isAdmin: data.isAdmin,
        balance: data.balance || 0,
      }));
      setUsers(formattedUsers);
    }
  }, [currentUser, navigate]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredUsers = users.filter(user => 
    user.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Gerenciamento de Usuários</h1>
          
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por telefone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left">Telefone</th>
                    <th className="py-3 px-4 text-left">Senha</th>
                    <th className="py-3 px-4 text-left">Saldo</th>
                    <th className="py-3 px-4 text-left">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.phoneNumber}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-3 px-4">{user.phoneNumber}</td>
                      <td className="py-3 px-4">{user.password}</td>
                      <td className="py-3 px-4">{formatCurrency(user.balance)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.isAdmin 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.isAdmin ? "Administrador" : "Usuário"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center p-8">
                <p className="text-gray-500">
                  {searchTerm 
                    ? "Nenhum usuário encontrado com esse número." 
                    : "Nenhum usuário cadastrado."}
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserManagement;
