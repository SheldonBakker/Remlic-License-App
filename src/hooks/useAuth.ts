import { create } from 'zustand';

interface AuthState {
  sessionToken: string | null;
  setSessionToken: (token: string | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  sessionToken: null,
  setSessionToken: (token) => set({ sessionToken: token }),
})); 