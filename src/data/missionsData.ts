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

// Init missions from localStorage if it exists, otherwise use empty array
export const getMissions = (): Mission[] => {
  const savedMissions = localStorage.getItem("dincashMissions");
  if (savedMissions) {
    return JSON.parse(savedMissions);
  }
  
  return []; // Return empty array instead of default missions
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
