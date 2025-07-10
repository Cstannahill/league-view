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
  gameName: string;
  tagLine: string;
  region: string;
  setMode: (val: Mode) => void;
  setDashboard: (d: DashboardStats | null) => void;
  setMatchData: (m: MatchPayload | null) => void;
  setSummoner: (gameName: string, tagLine: string, region: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  mode: 'dashboard',
  dashboard: null,
  matchData: null,
  gameName: '',
  tagLine: '',
  region: 'NA1',
  setMode: (mode) => set({ mode }),
  setDashboard: (dashboard) => set({ dashboard }),
  setMatchData: (matchData) => set({ matchData }),
  setSummoner: async (gameName, tagLine, region) => {
    await invoke('set_tracked_summoner', { gameName, tagLine, region });
    set({ gameName, tagLine, region });
  },
}));
