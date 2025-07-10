import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

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
  summonerName: string;
  region: string;
  setMode: (val: Mode) => void;
  setDashboard: (d: DashboardStats | null) => void;
  setMatchData: (m: MatchPayload | null) => void;
  setSummoner: (name: string, region: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  mode: 'dashboard',
  dashboard: null,
  matchData: null,
  summonerName: '',
  region: 'NA1',
  setMode: (mode) => set({ mode }),
  setDashboard: (dashboard) => set({ dashboard }),
  setMatchData: (matchData) => set({ matchData }),
  setSummoner: async (name, region) => {
    await invoke('set_tracked_summoner', { name, region });
    set({ summonerName: name, region });
  },
}));
