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
    iconUrl?: string; // Small icon URL
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
    userStats?: {
        gamesPlayed: number;
        wins: number;
        losses: number;
        winRate: number;
        kda: {
            kills: number;
            deaths: number;
            assists: number;
            ratio: number;
        };
        averageStats: {
            cs: number;
            csPerMinute: number;
            gold: number;
            damage: number;
            damageToChampions: number;
            visionScore: number;
            gameLength: number;
        };
        masteryInfo: {
            level: number;
            points: number;
            tokensEarned: number;
            chestGranted: boolean;
        };
        recentForm: {
            last10Games: {
                wins: number;
                losses: number;
                winRate: number;
            };
            trend: string;
        };
    };
    globalStats?: {
        pickRate: number;
        banRate: number;
        winRate: number;
        tier: string;
        rank: number;
    };
    rolePerformance?: {
        [key: string]: {
            gamesPlayed: number;
            winRate: number;
            kda: number;
            primaryRole: boolean;
        };
    };
    itemStats?: {
        mostBuilt: Array<{
            itemId: number;
            itemName: string;
            buildRate: number;
            winRate: number;
        }>;
        highestWinRate: Array<{
            itemId: number;
            itemName: string;
            buildRate: number;
            winRate: number;
        }>;
    };
    skillOrder?: {
        mostPopular: string;
        highestWinRate: string;
        userPreference: string;
    };
    // Legacy fields for backward compatibility
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
    id?: string;
    name: string;
    source?: string;
    pickRate?: number;
    winRate?: number;
    games?: number;
    role?: ChampionRole;
    rank?: string;
    items?: {
        core?: number[];
        boots?: number[];
        situational?: number[];
        starter?: number[];
        luxury?: number[];
        fullBuild?: number[];
    };
    runes?: {
        primary?: {
            tree: string;
            keystone: string;
            runes: string[];
        };
        secondary?: {
            tree: string;
            runes: string[];
        };
        shards?: string[];
    };
    skillOrder?: string;
    startingItems?: number[];
    summonerSpells?: string[];
    sampleSize?: number;
    sources?: BuildSource[];
    spells?: SummonerSpells;
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
    gamesPlayed?: number;
    games?: number; // Alternative name for gamesPlayed
    goldDiff15?: number;
    csDiff15?: number;
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
    championId: number;
    role: ChampionRole;
    counters?: {
        hardCounters: Array<{
            championId: number;
            championName: string;
            winRateAgainst: number;
            difficulty: string;
            reason: string;
        }>;
        softCounters: Array<{
            championId: number;
            championName: string;
            winRateAgainst: number;
            difficulty: string;
            reason: string;
        }>;
    };
    goodAgainst?: {
        hardCounters: Array<{
            championId: number;
            championName: string;
            winRateAgainst: number;
            difficulty: string;
            reason: string;
        }>;
        softCounters: Array<{
            championId: number;
            championName: string;
            winRateAgainst: number;
            difficulty: string;
            reason: string;
        }>;
    };
    banRecommendations?: Array<{
        championId: number;
        championName: string;
        banRate: number;
        reason: string;
    }>;
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
