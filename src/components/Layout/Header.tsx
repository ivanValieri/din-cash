
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Home } from "lucide-react";

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm w-full py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 
            className="text-2xl font-bold text-dincash-orange cursor-pointer"
            onClick={() => navigate(currentUser?.isAdmin ? '/admin' : currentUser ? '/dashboard' : '/')}
          >
            Din<span className="text-black">Cash</span>
          </h1>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-4">
            {!currentUser.isAdmin && (
              <>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1" 
                  onClick={() => navigate('/dashboard')}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Missões</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1" 
                  onClick={() => navigate('/withdrawal')}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Saque</span>
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-1" 
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        ) : (
          <Button 
            className="btn-primary" 
            onClick={() => navigate('/login')}
          >
            Acessar
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
