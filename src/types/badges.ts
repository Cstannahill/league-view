// Badge system types and interfaces

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconUrl?: string;
  requirements: BadgeRequirement[];
  achievedAt?: Date;
  progress?: number; // 0-100 percentage
}

export enum BadgeCategory {
  STRATEGIC_MACRO = "Strategic & Macro Play",
  RESOURCE_MANAGEMENT = "Resource Management", 
  TEAMPLAY_SUPPORT = "Teamplay & Support",
  ADAPTABILITY_RESILIENCE = "Adaptability & Resilience",
  EARLY_GAME_LANING = "Early Game & Laning",
  LATE_GAME_SCALING = "Late Game & Scaling",
  ANTI_CARRY_DISRUPTION = "Anti-Carry & Disruption"
}

export enum BadgeTier {
  BRONZE = "bronze",
  SILVER = "silver", 
  GOLD = "gold",
  PLATINUM = "platinum",
  DIAMOND = "diamond"
}

export interface BadgeRequirement {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  period?: 'game' | 'last_10_games' | 'last_30_days' | 'all_time';
  role?: string;
  champion?: string;
}

export interface PlayerBadgeData {
  playerId: string;
  badges: Badge[];
  badgeProgress: Map<string, number>;
  stats: PlayerStats;
}

export interface PlayerStats {
  // Strategic & Macro Play
  objectiveDamageShare: number;
  objectiveKillParticipation: number;
  objectiveSecureRate: number;
  visionScorePerMinute: number;
  controlWardEfficiency: number;
  visionDenial: number;
  teleportEffectivenessRate?: number; // Top lane specific
  
  // Resource Management
  goldPerMinute: number;
  goldToDamageConversion: number;
  itemCompletionSpeed: number;
  csPerMinute: number;
  csDifferentialAt10: number;
  csDifferentialAt20: number;
  
  // Teamplay & Support
  engagementSuccessRate: number;
  ccScoreContribution: number;
  damageShieldedHealed: number;
  ccOnEnemiesAttackingAllies: number;
  numberOfSaves: number;
  roamSuccessRate: number;
  roamGoldXpSwing: number;
  
  // Adaptability & Resilience
  winRateFromGoldDeficit: number;
  kdaWhenBehind: number;
  objectiveSecuresWhenBehind: number;
  championPoolSize: number;
  roleFlexibility: number;
  metaAdaptationScore: number;
  
  // Early Game & Laning
  goldDifferentialAt10: number;
  killParticipationInLane: number;
  soloKillRate: number;
  pressureScore: number;
  firstBloodParticipationRate: number;
  
  // Late Game & Scaling
  lateGameDamageDealt: number;
  lateGameDamageTaken: number;
  lateGameObjectiveSecureRate: number;
  winRateGames30Plus: number;
  lateGameGoldToDamageConversion: number;
  
  // Anti-Carry & Disruption
  damageToEnemyCarries: number;
  ccOnEnemyCarries: number;
  killParticipationOnCarries: number;
  totalCcDuration: number;
  multiTargetCcHits: number;
  ccFollowUpRate: number;
  
  // General stats
  kda: number;
  winRate: number;
  gamesPlayed: number;
  currentRank: string;
  role: string;
}

// Badge definitions following the AGENTS.md specifications
export const BADGE_DEFINITIONS: Badge[] = [
  // Strategic & Macro Play Badges
  {
    id: "objective_seizer",
    name: "Objective Seizer",
    description: "Recognizes players who consistently contribute significantly to securing major objectives.",
    category: BadgeCategory.STRATEGIC_MACRO,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "objectiveDamageShare", threshold: 15, operator: "gte", period: "last_10_games" },
      { metric: "objectiveKillParticipation", threshold: 70, operator: "gte", period: "last_10_games" },
      { metric: "objectiveSecureRate", threshold: 60, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "visionary_architect", 
    name: "Visionary Architect",
    description: "Awards players for superior vision control that directly leads to advantages or prevents disadvantages.",
    category: BadgeCategory.STRATEGIC_MACRO,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "visionScorePerMinute", threshold: 2.5, operator: "gte", period: "last_10_games" },
      { metric: "controlWardEfficiency", threshold: 80, operator: "gte", period: "last_10_games" },
      { metric: "visionDenial", threshold: 15, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "teleport_master",
    name: "Teleport Master", 
    description: "Recognizes optimal and impactful teleport usage (Top Lane Specific).",
    category: BadgeCategory.STRATEGIC_MACRO,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "teleportEffectivenessRate", threshold: 70, operator: "gte", period: "last_10_games", role: "top" }
    ]
  },
  
  // Resource Management Badges
  {
    id: "gold_efficiency_expert",
    name: "Gold Efficiency Expert",
    description: "Rewards players who maximize their gold income and convert it effectively into power.",
    category: BadgeCategory.RESOURCE_MANAGEMENT,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "goldPerMinute", threshold: 400, operator: "gte", period: "last_10_games" },
      { metric: "goldToDamageConversion", threshold: 1.2, operator: "gte", period: "last_10_games" },
      { metric: "itemCompletionSpeed", threshold: 85, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "cs_dominator",
    name: "CS Dominator",
    description: "Recognizes players with exceptional farming mechanics and lane pressure through minion control.",
    category: BadgeCategory.RESOURCE_MANAGEMENT,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "csPerMinute", threshold: 7.5, operator: "gte", period: "last_10_games" },
      { metric: "csDifferentialAt10", threshold: 10, operator: "gte", period: "last_10_games" },
      { metric: "csDifferentialAt20", threshold: 15, operator: "gte", period: "last_10_games" }
    ]
  },
  
  // Teamplay & Support Badges
  {
    id: "teamfight_initiator",
    name: "Teamfight Initiator",
    description: "Awards players who consistently make impactful engagements that lead to successful teamfights.",
    category: BadgeCategory.TEAMPLAY_SUPPORT,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "engagementSuccessRate", threshold: 65, operator: "gte", period: "last_10_games" },
      { metric: "ccScoreContribution", threshold: 80, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "peel_specialist",
    name: "Peel Specialist",
    description: "Recognizes players who effectively protect their carries from enemy threats (Support/Tank Specific).",
    category: BadgeCategory.TEAMPLAY_SUPPORT,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "damageShieldedHealed", threshold: 5000, operator: "gte", period: "game" },
      { metric: "ccOnEnemiesAttackingAllies", threshold: 10, operator: "gte", period: "game" },
      { metric: "numberOfSaves", threshold: 2, operator: "gte", period: "game" }
    ]
  },
  {
    id: "roam_impact",
    name: "Roam Impact",
    description: "Awards players whose map movements outside their lane/jungle consistently create advantages for other lanes.",
    category: BadgeCategory.TEAMPLAY_SUPPORT,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "roamSuccessRate", threshold: 60, operator: "gte", period: "last_10_games" },
      { metric: "roamGoldXpSwing", threshold: 1500, operator: "gte", period: "game" }
    ]
  },
  
  // Adaptability & Resilience Badges
  {
    id: "comeback_king_queen",
    name: "Comeback King/Queen",
    description: "Recognizes players who consistently perform well and contribute to victories in games where their team was significantly behind.",
    category: BadgeCategory.ADAPTABILITY_RESILIENCE,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "winRateFromGoldDeficit", threshold: 40, operator: "gte", period: "last_30_days" },
      { metric: "kdaWhenBehind", threshold: 1.5, operator: "gte", period: "last_30_days" },
      { metric: "objectiveSecuresWhenBehind", threshold: 30, operator: "gte", period: "last_30_days" }
    ]
  },
  {
    id: "meta_flexer",
    name: "Meta Flexer", 
    description: "Awards players who demonstrate proficiency across a wide range of champions and roles, adapting to meta shifts.",
    category: BadgeCategory.ADAPTABILITY_RESILIENCE,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "championPoolSize", threshold: 8, operator: "gte", period: "last_30_days" },
      { metric: "roleFlexibility", threshold: 2, operator: "gte", period: "last_30_days" },
      { metric: "metaAdaptationScore", threshold: 75, operator: "gte", period: "last_30_days" }
    ]
  },
  
  // Early Game & Laning Badges
  {
    id: "lane_bully",
    name: "Lane Bully",
    description: "Recognizes players who consistently dominate their laning phase.",
    category: BadgeCategory.EARLY_GAME_LANING,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "goldDifferentialAt10", threshold: 300, operator: "gte", period: "last_10_games" },
      { metric: "killParticipationInLane", threshold: 60, operator: "gte", period: "last_10_games" },
      { metric: "soloKillRate", threshold: 20, operator: "gte", period: "last_10_games" },
      { metric: "pressureScore", threshold: 75, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "first_blood_contributor",
    name: "First Blood Contributor",
    description: "Awards players who are consistently involved in securing the first kill of the game.",
    category: BadgeCategory.EARLY_GAME_LANING,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "firstBloodParticipationRate", threshold: 40, operator: "gte", period: "last_10_games" }
    ]
  },
  
  // Late Game & Scaling Badges
  {
    id: "late_game_powerhouse",
    name: "Late Game Powerhouse",
    description: "Recognizes players who consistently scale effectively into the late game and have high impact in decisive late-game teamfights.",
    category: BadgeCategory.LATE_GAME_SCALING,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "lateGameDamageDealt", threshold: 20000, operator: "gte", period: "game" },
      { metric: "lateGameObjectiveSecureRate", threshold: 70, operator: "gte", period: "last_10_games" },
      { metric: "winRateGames30Plus", threshold: 65, operator: "gte", period: "last_30_days" },
      { metric: "lateGameGoldToDamageConversion", threshold: 1.5, operator: "gte", period: "last_10_games" }
    ]
  },
  
  // Anti-Carry & Disruption Badges
  {
    id: "threat_neutralizer",
    name: "Threat Neutralizer",
    description: "Awards players who consistently shut down high-priority enemy carries (Tank/Support/Assassin Specific).",
    category: BadgeCategory.ANTI_CARRY_DISRUPTION,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "damageToEnemyCarries", threshold: 8000, operator: "gte", period: "game" },
      { metric: "ccOnEnemyCarries", threshold: 5, operator: "gte", period: "game" },
      { metric: "killParticipationOnCarries", threshold: 70, operator: "gte", period: "last_10_games" }
    ]
  },
  {
    id: "cc_chain_master",
    name: "CC Chain Master",
    description: "Recognizes players who consistently land effective crowd control abilities, enabling team plays.",
    category: BadgeCategory.ANTI_CARRY_DISRUPTION,
    tier: BadgeTier.GOLD,
    requirements: [
      { metric: "totalCcDuration", threshold: 15, operator: "gte", period: "game" },
      { metric: "multiTargetCcHits", threshold: 3, operator: "gte", period: "game" },
      { metric: "ccFollowUpRate", threshold: 75, operator: "gte", period: "last_10_games" }
    ]
  }
];
