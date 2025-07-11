import { invoke } from '@tauri-apps/api/core';
import {
    Champion,
    ChampionMastery,
    ChampionStats,
    ChampionBuild,
    ChampionMatchup,
    CounterData,
    ChampionRole,
    BuildSource,
    ChampionSortBy,
    ChampionFilters,
    MatchupDifficulty
} from '../types/champion';

// Riot Data Dragon CDN for champion assets
const DATA_DRAGON_VERSION = '14.1.1'; // Update this with latest patch version
const CHAMPION_SPLASH_BASE = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/`;
const CHAMPION_SQUARE_BASE = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/img/champion/`;

export class ChampionService {
    private static instance: ChampionService;
    private champions: Champion[] = [];
    private championMasteries: ChampionMastery[] = [];
    private builds: Map<string, ChampionBuild[]> = new Map();
    private matchups: Map<string, ChampionMatchup[]> = new Map();
    private counterData: Map<number, CounterData> = new Map();

    private constructor() {}

    public static getInstance(): ChampionService {
        if (!ChampionService.instance) {
            ChampionService.instance = new ChampionService();
        }
        return ChampionService.instance;
    }

    // Get all champions
    async getAllChampions(): Promise<Champion[]> {
        if (this.champions.length === 0) {
            try {
                const fetchedChampions = await invoke('get_all_champions') as Champion[];
                // Add image URLs to each champion
                this.champions = fetchedChampions.map(champion => ({
                    ...champion,
                    splashUrl: `${CHAMPION_SPLASH_BASE}${champion.key}_0.jpg`,
                    squareUrl: `${CHAMPION_SQUARE_BASE}${champion.key}.png`
                }));
            } catch (error) {
                console.error('Failed to fetch champions:', error);
                this.champions = this.getMockChampions();
            }
        }
        return this.champions;
    }

    // Get champion masteries for current summoner
    async getChampionMasteries(): Promise<ChampionMastery[]> {
        try {
            this.championMasteries = await invoke('get_champion_masteries');
            return this.championMasteries;
        } catch (error) {
            console.error('Failed to fetch champion masteries:', error);
            return this.getMockMasteries();
        }
    }

    // Get champion statistics for current summoner
    async getChampionStats(championId: number): Promise<ChampionStats | null> {
        try {
            return await invoke('get_champion_stats', { championId });
        } catch (error) {
            console.error('Failed to fetch champion stats:', error);
            return this.getMockChampionStats(championId);
        }
    }

    // Get builds for a champion and role
    async getChampionBuilds(championId: number, role: ChampionRole, rank: string): Promise<ChampionBuild[]> {
        const key = `${championId}-${role}-${rank}`;
        
        if (!this.builds.has(key)) {
            try {
                const builds = await this.aggregateBuildsFromSources(championId, role, rank);
                this.builds.set(key, builds);
            } catch (error) {
                console.error('Failed to fetch champion builds:', error);
                this.builds.set(key, this.getMockBuilds(championId, role));
            }
        }
        
        return this.builds.get(key) || [];
    }

    // Get matchups for a champion and role
    async getChampionMatchups(championId: number, role: ChampionRole, rank: string): Promise<ChampionMatchup[]> {
        const key = `${championId}-${role}`;
        
        if (!this.matchups.has(key)) {
            try {
                const matchups = await this.aggregateMatchupsFromSources(championId, role, rank);
                this.matchups.set(key, matchups);
            } catch (error) {
                console.error('Failed to fetch champion matchups:', error);
                this.matchups.set(key, this.getMockMatchups(championId, role));
            }
        }
        
        return this.matchups.get(key) || [];
    }

    // Get counter data for a champion
    async getCounterData(championId: number, role: ChampionRole, rank: string): Promise<CounterData> {
        if (!this.counterData.has(championId)) {
            try {
                const data = await this.aggregateCounterDataFromSources(championId, role, rank);
                this.counterData.set(championId, data);
            } catch (error) {
                console.error('Failed to fetch counter data:', error);
                this.counterData.set(championId, this.getMockCounterData(championId));
            }
        }
        
        return this.counterData.get(championId) || { counters: [], countered: [] };
    }

    // Sort and filter champions
    sortAndFilterChampions(
        champions: Champion[],
        masteries: ChampionMastery[],
        sortBy: ChampionSortBy,
        filters: ChampionFilters,
        ascending: boolean = true
    ): Champion[] {
        let filtered = champions.filter(champion => {
            // Search filter
            if (filters.search && !champion.name.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }

            // Role filter
            if (filters.roles.length > 0 && !filters.roles.some(role => champion.roles.includes(role))) {
                return false;
            }

            // Mastery level filter
            if (filters.masteryLevel !== null) {
                const mastery = masteries.find(m => m.championId === champion.id);
                if (!mastery || mastery.championLevel < filters.masteryLevel) {
                    return false;
                }
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case ChampionSortBy.NAME:
                    comparison = a.name.localeCompare(b.name);
                    break;
                case ChampionSortBy.MASTERY_LEVEL:
                    const masteryA = masteries.find(m => m.championId === a.id);
                    const masteryB = masteries.find(m => m.championId === b.id);
                    comparison = (masteryB?.championLevel || 0) - (masteryA?.championLevel || 0);
                    break;
                case ChampionSortBy.MASTERY_POINTS:
                    const pointsA = masteries.find(m => m.championId === a.id);
                    const pointsB = masteries.find(m => m.championId === b.id);
                    comparison = (pointsB?.championPoints || 0) - (pointsA?.championPoints || 0);
                    break;
                default:
                    comparison = a.name.localeCompare(b.name);
            }

            return ascending ? comparison : -comparison;
        });

        return filtered;
    }

    // Private methods for data aggregation
    private async aggregateBuildsFromSources(championId: number, role: ChampionRole, _rank: string): Promise<ChampionBuild[]> {
        // In a real implementation, this would fetch from multiple sources
        // For now, return mock data
        return this.getMockBuilds(championId, role);
    }

    private async aggregateMatchupsFromSources(championId: number, role: ChampionRole, _rank: string): Promise<ChampionMatchup[]> {
        // In a real implementation, this would fetch from multiple sources
        return this.getMockMatchups(championId, role);
    }

    private async aggregateCounterDataFromSources(championId: number, _role: ChampionRole, _rank: string): Promise<CounterData> {
        // In a real implementation, this would fetch from multiple sources
        return this.getMockCounterData(championId);
    }

    // Mock data generators for development
    private getMockChampions(): Champion[] {
        const mockChampions = [
            {
                id: 266, name: 'Aatrox', key: 'Aatrox', title: 'the Darkin Blade',
                roles: [ChampionRole.TOP], image: '/champions/aatrox.png', tags: ['Fighter', 'Tank']
            },
            {
                id: 103, name: 'Ahri', key: 'Ahri', title: 'the Nine-Tailed Fox',
                roles: [ChampionRole.MIDDLE], image: '/champions/ahri.png', tags: ['Mage', 'Assassin']
            },
            {
                id: 84, name: 'Akali', key: 'Akali', title: 'the Rogue Assassin',
                roles: [ChampionRole.MIDDLE, ChampionRole.TOP], image: '/champions/akali.png', tags: ['Assassin']
            },
            {
                id: 12, name: 'Alistar', key: 'Alistar', title: 'the Minotaur',
                roles: [ChampionRole.SUPPORT], image: '/champions/alistar.png', tags: ['Tank', 'Support']
            },
            {
                id: 32, name: 'Amumu', key: 'Amumu', title: 'the Sad Mummy',
                roles: [ChampionRole.JUNGLE], image: '/champions/amumu.png', tags: ['Tank', 'Mage']
            }
        ];

        // Add image URLs to mock champions
        return mockChampions.map(champion => ({
            ...champion,
            splashUrl: `${CHAMPION_SPLASH_BASE}${champion.key}_0.jpg`,
            squareUrl: `${CHAMPION_SQUARE_BASE}${champion.key}.png`
        }));
    }

    private getMockMasteries(): ChampionMastery[] {
        return [
            {
                championId: 266, championLevel: 7, championPoints: 234567,
                lastPlayTime: Date.now() - 86400000, championPointsSinceLastLevel: 0,
                championPointsUntilNextLevel: 0, chestGranted: true, tokensEarned: 0, summonerId: 'test'
            },
            {
                championId: 103, championLevel: 5, championPoints: 45678,
                lastPlayTime: Date.now() - 172800000, championPointsSinceLastLevel: 2345,
                championPointsUntilNextLevel: 12345, chestGranted: false, tokensEarned: 1, summonerId: 'test'
            }
        ];
    }

    private getMockChampionStats(championId: number): ChampionStats {
        return {
            championId,
            championName: 'Aatrox',
            gamesPlayed: 47,
            wins: 29,
            losses: 18,
            winRate: 61.7,
            averageKda: { kills: 8.2, deaths: 5.1, assists: 6.8, kda: 2.94 },
            averageStats: {
                cs: 156.3, gold: 12450, damage: 23890, visionScore: 18.2, gameLength: 28.5
            },
            recentPerformance: [],
            bestPerformance: {} as any,
            roles: {
                [ChampionRole.TOP]: {
                    gamesPlayed: 43, winRate: 65.1,
                    averageKda: { kills: 8.5, deaths: 4.9, assists: 6.2, kda: 3.0 }
                },
                [ChampionRole.MIDDLE]: {
                    gamesPlayed: 4, winRate: 25.0,
                    averageKda: { kills: 6.8, deaths: 7.2, assists: 9.5, kda: 2.26 }
                }
            }
        };
    }

    private getMockBuilds(championId: number, role: ChampionRole): ChampionBuild[] {
        return [
            {
                id: `${championId}-${role}-1`,
                name: 'Goredrinker Build',
                role,
                rank: 'Diamond+',
                items: {
                    starter: [1054, 2003], // Doran's Shield + Health Potions
                    core: [6630, 3071, 3742], // Goredrinker, Black Cleaver, Dead Man's Plate
                    boots: 3047, // Plated Steelcaps
                    situational: [3193, 3065, 3143], // Gargoyle, Spirit Visage, Randuin's
                    luxury: [3748, 3026], // Titanic Hydra, Guardian Angel
                    fullBuild: [6630, 3071, 3047, 3742, 3193, 3748]
                },
                runes: {
                    primaryTree: 8000, // Precision
                    keystone: 8010, // Conqueror
                    primaryRunes: [9101, 9111, 8014], // Overheal, Legend: Alacrity, Coup de Grace
                    secondaryTree: 8400, // Resolve
                    secondaryRunes: [8429, 8453], // Conditioning, Revitalize
                    statShards: [5008, 5008, 5002] // Adaptive Force x2, Armor
                },
                skillOrder: {
                    order: 'QWEQWRQWQWRWWEEREE',
                    maxOrder: 'Q>W>E',
                    description: 'Max Q first for damage, W second for sustain'
                },
                spells: { spell1: 4, spell2: 12 }, // Flash, Teleport
                winRate: 63.2,
                pickRate: 45.8,
                sampleSize: 15420,
                sources: [BuildSource.UGG, BuildSource.OPGG]
            }
        ];
    }

    private getMockMatchups(_championId: number, role: ChampionRole): ChampionMatchup[] {
        return [
            {
                enemyChampionId: 92, // Riven
                enemyChampionName: 'Riven',
                role,
                winRate: 45.2,
                gamesPlayed: 1250,
                averageKda: { kills: 6.8, deaths: 6.2, assists: 5.9 },
                difficulty: MatchupDifficulty.HARD,
                tips: ['Play safe early', 'Rush Bramble Vest', 'Use W to interrupt her combos'],
                recommendedBuilds: ['goredrinker-anti-ad'],
                lanePhase: {
                    earlyGame: { advantage: 'weak', notes: 'Riven has strong early all-in potential' },
                    midGame: { advantage: 'even', notes: 'Both champions scale similarly' },
                    lateGame: { advantage: 'strong', notes: 'Better teamfight presence' }
                }
            }
        ];
    }

    private getMockCounterData(_championId: number): CounterData {
        return {
            counters: [
                {
                    championId: 58, championName: 'Renekton', winRate: 54.2,
                    gamesPlayed: 892, advantage: 8.5, confidence: 0.85,
                    sources: [BuildSource.UGG, BuildSource.OPGG]
                },
                {
                    championId: 92, championName: 'Riven', winRate: 52.1,
                    gamesPlayed: 1250, advantage: 4.8, confidence: 0.92,
                    sources: [BuildSource.UGG, BuildSource.MOBALYTICS]
                }
            ],
            countered: [
                {
                    championId: 150, championName: 'Gnar', winRate: 42.8,
                    gamesPlayed: 743, advantage: -12.4, confidence: 0.78,
                    sources: [BuildSource.UGG, BuildSource.LEAGUEOFGRAPHS]
                },
                {
                    championId: 17, championName: 'Teemo', winRate: 38.9,
                    gamesPlayed: 456, advantage: -18.2, confidence: 0.71,
                    sources: [BuildSource.OPGG, BuildSource.MOBALYTICS]
                }
            ]
        };
    }
}

export const championService = ChampionService.getInstance();
