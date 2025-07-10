import { create } from 'zustand';

export interface DashboardStats {}
export interface MatchPayload {}

interface AppState {
  inGame: boolean;
  dashboard: DashboardStats | null;
  matchData: MatchPayload | null;
  setInGame: (val: boolean) => void;
  setDashboard: (d: DashboardStats | null) => void;
  setMatchData: (m: MatchPayload | null) => void;
}

export const useStore = create<AppState>((set) => ({
  inGame: false,
  dashboard: null,
  matchData: null,
  setInGame: (inGame) => set({ inGame }),
  setDashboard: (dashboard) => set({ dashboard }),
  setMatchData: (matchData) => set({ matchData }),
}));
