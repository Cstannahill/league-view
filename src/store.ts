import { create } from 'zustand';

export interface DashboardStats {}
export interface MatchPayload {
  game: any;
  ranked: any[][];
  traits: string[][];
}
export type Mode = 'dashboard' | 'loading' | 'ingame';

interface AppState {
  mode: Mode;
  dashboard: DashboardStats | null;
  matchData: MatchPayload | null;
  setMode: (val: Mode) => void;
  setDashboard: (d: DashboardStats | null) => void;
  setMatchData: (m: MatchPayload | null) => void;
}

export const useStore = create<AppState>((set) => ({
  mode: 'dashboard',
  dashboard: null,
  matchData: null,
  setMode: (mode) => set({ mode }),
  setDashboard: (dashboard) => set({ dashboard }),
  setMatchData: (matchData) => set({ matchData }),
}));
