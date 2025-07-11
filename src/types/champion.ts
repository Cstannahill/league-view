// Champion-related type definitions
export interface Champion {
    id: number;
    name: string;
    key: string;
    title: string;
    roles: ChampionRole[];
    image: string;
    tags: string[];
    splashUrl?: string; // Splash art URL
    squareUrl?: string; // Square icon URL
}

export enum ChampionRole {
    TOP = 'top',
    JUNGLE = 'jungle',
    MIDDLE = 'middle',
    BOTTOM = 'bottom',
    SUPPORT = 'support'
}

export interface ChampionMastery {
    championId: number;
    championLevel: number;
    championPoints: number;
    lastPlayTime: number;
    championPointsSinceLastLevel: number;
    championPointsUntilNextLevel: number;
    chestGranted: boolean;
    tokensEarned: number;
    summonerId: string;
}

export interface ChampionStats {
    championId: number;
    championName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    averageKda: {
        kills: number;
        deaths: number;
        assists: number;
        kda: number;
    };
    averageStats: {
        cs: number;
        gold: number;
        damage: number;
        visionScore: number;
        gameLength: number;
    };
    recentPerformance: ChampionMatchHistory[];
    bestPerformance: ChampionMatchHistory;
    roles: { [key in ChampionRole]?: RoleStats };
}

export interface RoleStats {
    gamesPlayed: number;
    winRate: number;
    averageKda: { kills: number; deaths: number; assists: number; kda: number };
}

export interface ChampionMatchHistory {
    matchId: string;
    gameCreation: number;
    gameDuration: number;
    win: boolean;
    role: ChampionRole;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    gold: number;
    damage: number;
    items: number[];
    runes: RuneBuild;
    skillOrder: string;
}

// Build system types
export interface ChampionBuild {
    id: string;
    name: string;
    role: ChampionRole;
    rank: string;
    items: ItemBuild;
    runes: RuneBuild;
    skillOrder: SkillOrder;
    spells: SummonerSpells;
    winRate: number;
    pickRate: number;
    sampleSize: number;
    sources: BuildSource[];
}

export interface ItemBuild {
    starter: number[];
    core: number[];
    boots: number;
    situational: number[];
    luxury: number[];
    fullBuild: number[];
}

export interface RuneBuild {
    primaryTree: number;
    keystone: number;
    primaryRunes: number[];
    secondaryTree: number;
    secondaryRunes: number[];
    statShards: number[];
}

export interface SkillOrder {
    order: string; // e.g., "QWEQWRQWQWRWWEEREE"
    maxOrder: string; // e.g., "Q>W>E"
    description: string;
}

export interface SummonerSpells {
    spell1: number;
    spell2: number;
}

export enum BuildSource {
    UGG = 'u.gg',
    OPGG = 'op.gg',
    MOBALYTICS = 'mobalytics',
    LEAGUEOFGRAPHS = 'leagueofgraphs'
}

// Matchup types
export interface ChampionMatchup {
    enemyChampionId: number;
    enemyChampionName: string;
    role: ChampionRole;
    winRate: number;
    gamesPlayed: number;
    averageKda: { kills: number; deaths: number; assists: number };
    difficulty: MatchupDifficulty;
    tips: string[];
    recommendedBuilds: string[]; // Build IDs
    lanePhase: {
        earlyGame: MatchupPhase;
        midGame: MatchupPhase;
        lateGame: MatchupPhase;
    };
}

export interface MatchupPhase {
    advantage: 'strong' | 'even' | 'weak';
    notes: string;
}

export enum MatchupDifficulty {
    VERY_EASY = 'very_easy',
    EASY = 'easy',
    EVEN = 'even',
    HARD = 'hard',
    VERY_HARD = 'very_hard'
}

export interface CounterData {
    counters: ChampionCounter[]; // Champions that counter this champion
    countered: ChampionCounter[]; // Champions this champion counters
}

export interface ChampionCounter {
    championId: number;
    championName: string;
    winRate: number;
    gamesPlayed: number;
    advantage: number; // Percentage advantage
    confidence: number; // Confidence in the data (0-1)
    sources: BuildSource[];
}

// Sorting and filtering
export enum ChampionSortBy {
    NAME = 'name',
    MASTERY_LEVEL = 'masteryLevel',
    MASTERY_POINTS = 'masteryPoints',
    WIN_RATE = 'winRate',
    GAMES_PLAYED = 'gamesPlayed',
    LAST_PLAYED = 'lastPlayed',
    ROLE = 'role'
}

export interface ChampionFilters {
    roles: ChampionRole[];
    masteryLevel: number | null;
    minGames: number;
    search: string;
}
