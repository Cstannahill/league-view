export interface ChampionAnalytics {
  championId: number;
  championName: string;
  totalGames: number;
  winRate: number;
  averageKDA: {
    kills: number;
    deaths: number;
    assists: number;
  };
  averageCS: number;
  averageGold: number;
  averageDamage: number;
  averageVisionScore: number;
  gameLength: {
    average: number;
    shortest: number;
    longest: number;
  };
  performanceByRole: Record<string, ChampionRolePerformance>;
  recentTrend: 'improving' | 'declining' | 'stable';
  matchupData: MatchupAnalysis[];
}

export interface ChampionRolePerformance {
  games: number;
  winRate: number;
  averageKDA: { kills: number; deaths: number; assists: number };
  preferredItems: ItemUsage[];
  skillOrder: string[];
}

export interface MatchupAnalysis {
  enemyChampion: string;
  enemyChampionId: number;
  games: number;
  winRate: number;
  avgKillDiff: number;
  avgCSDiff: number;
  lanePhaseWinRate: number;
}

export interface ItemUsage {
  itemId: number;
  itemName: string;
  frequency: number;
  winRateWithItem: number;
}

export interface TimelineAnalytics {
  earlyGame: GamePhaseStats; // 0-15 minutes
  midGame: GamePhaseStats;   // 15-25 minutes  
  lateGame: GamePhaseStats;  // 25+ minutes
}

export interface GamePhaseStats {
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgGoldDiff: number;
  avgCSDiff: number;
  avgDamageShare: number;
  winRateInPhase: number;
  objectiveParticipation: number;
}

export interface PlayerPsychologyProfile {
  tiltResistance: number; // 0-100 scale
  combackPotential: number; // How well they perform when behind
  clutchFactor: number; // Performance in high-pressure situations
  consistencyScore: number; // Variance in performance
  adaptabilityScore: number; // Ability to adjust to meta changes
  teamplayRating: number; // How well they work with team
}

export interface MetaAdaptationAnalysis {
  currentPatchPerformance: number;
  championPoolSize: number;
  roleFlexibility: number;
  itemBuildAdaptation: number;
  runeAdaptation: number;
  metaChampionUsage: number;
}

export interface AdvancedAnalytics {
  championAnalytics: ChampionAnalytics[];
  timelineAnalytics: TimelineAnalytics;
  psychologyProfile: PlayerPsychologyProfile;
  metaAdaptation: MetaAdaptationAnalysis;
  skillProgression: SkillProgressionData;
  socialAnalytics: SocialGameplayAnalytics;
}

export interface SkillProgressionData {
  overallRating: number;
  skillTrends: {
    mechanical: TrendData;
    gameKnowledge: TrendData;
    positioning: TrendData;
    objectiveControl: TrendData;
    teamfight: TrendData;
  };
  rankProgression: RankProgressionPoint[];
  improvementAreas: string[];
  strengthAreas: string[];
}

export interface TrendData {
  current: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
  confidence: number;
}

export interface RankProgressionPoint {
  date: string;
  rank: string;
  lp: number;
  tier: string;
}

export interface SocialGameplayAnalytics {
  duoPerformance: DuoAnalysis[];
  teamCompositionSuccess: TeamCompAnalysis[];
  communicationScore: number;
  leadershipTendency: number;
  supportivenessRating: number;
}

export interface DuoAnalysis {
  partnerName: string;
  gamesPlayed: number;
  winRate: number;
  synergy: number;
  preferredLanes: string[];
}

export interface TeamCompAnalysis {
  composition: string;
  games: number;
  winRate: number;
  averageGameLength: number;
  preferredStrategy: string;
}
