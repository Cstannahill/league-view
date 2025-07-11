import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface ChampionStat {
  id: number;
  name: string;
  level: number;
  points: number;
}

export interface RankInfo {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winrate: number;
}
export interface DashboardStats {
  champions: ChampionStat[];
  rank?: RankInfo | null;
  performance?: PerformanceData | null;
}

export interface PerformanceData {
  average_kda: { kills: number; deaths: number; assists: number };
  win_rate: number;
  total_lp_gain: number;
  games_analyzed: number;
  recent_form: "hot" | "cold" | "neutral";
  playstyle_traits: string[];
}

export interface GameSummary {
  champion_id: number;
  champion_name: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  duration: number;
}
export interface MatchPayload {
  game: any;
  ranked: any[][];
  traits: string[][];
}
export type Mode = "dashboard" | "loading" | "ingame" | "champions";

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
  setSummoner: (
    gameName: string,
    tagLine: string,
    region: string
  ) => Promise<void>;
}

const stored = (() => {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("summoner") || "null");
  } catch {
    return null;
  }
})();

export const useStore = create<AppState>((set) => ({
  mode: "dashboard",
  dashboard: null,
  matchData: null,
  gameName: stored?.gameName || "",
  tagLine: stored?.region || "NA1",
  region: stored?.region || "NA1",
  setMode: (mode) => set({ mode }),
  setDashboard: (dashboard) => set({ dashboard }),
  setMatchData: (matchData) => set({ matchData }),
  setSummoner: async (gameName, tagLine, region) => {
    console.log("Setting summoner:", gameName, tagLine, region);
    await invoke("set_tracked_summoner", { gameName, tagLine, region });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "summoner",
        JSON.stringify({ gameName, tagLine, region })
      );
    }
    set({ gameName, tagLine, region });
  },
}));
