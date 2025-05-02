export interface Mission {
  id: string;
  title: string;
  description: string;
  value: number;
  isFixedForNewUsers?: boolean;
  completions: string[]; // Array of phone numbers who completed the mission
  pendingApproval: string[]; // Array of phone numbers waiting for approval
  url?: string; // Optional URL for mission redirection
}

// Init missions from localStorage if it exists, otherwise use default missions
export const getMissions = (): Mission[] => {
  const savedMissions = localStorage.getItem("dincashMissions");
  if (savedMissions) {
    return JSON.parse(savedMissions);
  }
  
  return [
    {
      id: "1",
      title: "Instale o aplicativo DinCash",
      description: "Faça o download do aplicativo DinCash na loja de aplicativos e complete o cadastro.",
      value: 5,
      isFixedForNewUsers: true,
      completions: [],
      pendingApproval: [],
    },
    {
      id: "2",
      title: "Compartilhe nas redes sociais",
      description: "Compartilhe o DinCash em suas redes sociais e envie um print da postagem.",
      value: 10,
      completions: [],
      pendingApproval: [],
    },
    {
      id: "3",
      title: "Assista um vídeo tutorial",
      description: "Assista ao vídeo completo sobre como maximizar seus ganhos no DinCash.",
      value: 3,
      completions: [],
      pendingApproval: [],
    },
    {
      id: "4",
      title: "Complete seu perfil",
      description: "Preencha todas as informações do seu perfil para desbloquear mais missões.",
      value: 5,
      completions: [],
      pendingApproval: [],
    },
    {
      id: "5",
      title: "Faça uma avaliação do serviço",
      description: "Avalie nosso serviço com 5 estrelas e comente sua experiência.",
      value: 7,
      completions: [],
      pendingApproval: [],
    },
  ];
};

// Save missions to localStorage
export const saveMissions = (missions: Mission[]) => {
  localStorage.setItem("dincashMissions", JSON.stringify(missions));
};

// Get withdrawals from localStorage or initialize with empty array
export interface Withdrawal {
  id: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const getWithdrawals = (): Withdrawal[] => {
  const savedWithdrawals = localStorage.getItem("dincashWithdrawals");
  return savedWithdrawals ? JSON.parse(savedWithdrawals) : [];
};

export const saveWithdrawals = (withdrawals: Withdrawal[]) => {
  localStorage.setItem("dincashWithdrawals", JSON.stringify(withdrawals));
};
