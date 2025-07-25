// External API integration service for fetching real champion data
// Integrates with U.GG, OP.GG, and Mobalytics APIs

import { ChampionBuild, ChampionMatchup, CounterData, ChampionRole } from '../types/champion';
import { configService } from './configService';

// API endpoints and configurations
const API_ENDPOINTS = {
    UGG: {
        base: 'https://u.gg/api',
        builds: '/lol/1v1/champions/{championName}/builds',
        matchups: '/lol/1v1/champions/{championName}/matchups'
    },
    OPGG: {
        base: 'https://op.gg/api/v1.0',
        builds: '/champions/{championId}/builds',
        matchups: '/champions/{championId}/matchups'
    },
    MOBALYTICS: {
        base: 'https://app.mobalytics.gg/api',
        builds: '/lol/champions/{championKey}/builds',
        performance: '/lol/champions/{championKey}/performance'
    }
};

// Rate limiting configuration
const RATE_LIMITS = {
    requestsPerMinute: 100,
    concurrentRequests: 5
};

export class ExternalAPIService {
    private static instance: ExternalAPIService;
    private requestQueue: Map<string, Promise<any>> = new Map();
    private lastRequestTime: Map<string, number> = new Map();
    private rateLimitDelay = 60000 / RATE_LIMITS.requestsPerMinute; // ms between requests

    private constructor() {}

    public static getInstance(): ExternalAPIService {
        if (!ExternalAPIService.instance) {
            ExternalAPIService.instance = new ExternalAPIService();
        }
        return ExternalAPIService.instance;
    }

    /**
     * Fetch champion builds from multiple sources and aggregate them
     */
    async getChampionBuilds(championId: number, championName: string, championKey: string, role: ChampionRole, rank: string): Promise<ChampionBuild[]> {
        // Check if external APIs are enabled
        if (!configService.isExternalAPIEnabled()) {
            if (configService.isDebugMode()) {
                console.log('External APIs disabled, returning empty array for builds');
            }
            return [];
        }

        const builds: ChampionBuild[] = [];

        try {
            // Fetch from multiple sources in parallel
            const [uggBuilds, opggBuilds, mobalyticsBuilds] = await Promise.allSettled([
                this.fetchUGGBuilds(championName, role, rank),
                this.fetchOPGGBuilds(championId, role, rank),
                this.fetchMobalyticsBuilds(championKey, role, rank)
            ]);

            // Process U.GG builds
            if (uggBuilds.status === 'fulfilled' && uggBuilds.value) {
                builds.push(...this.transformUGGBuilds(uggBuilds.value, championId));
            }

            // Process OP.GG builds
            if (opggBuilds.status === 'fulfilled' && opggBuilds.value) {
                builds.push(...this.transformOPGGBuilds(opggBuilds.value, championId));
            }

            // Process Mobalytics builds
            if (mobalyticsBuilds.status === 'fulfilled' && mobalyticsBuilds.value) {
                builds.push(...this.transformMobalyticsBuilds(mobalyticsBuilds.value, championId));
            }

            // Sort by pick rate and win rate
            builds.sort((a, b) => {
                const aScore = (a.pickRate || 0) * (a.winRate || 0);
                const bScore = (b.pickRate || 0) * (b.winRate || 0);
                return bScore - aScore;
            });

            return builds.slice(0, 5); // Return top 5 builds
        } catch (error) {
            console.error('Failed to fetch champion builds from external APIs:', error);
            return [];
        }
    }

    /**
     * Fetch champion matchups from multiple sources
     */
    async getChampionMatchups(championId: number, championName: string, _championKey: string, role: ChampionRole, rank: string): Promise<ChampionMatchup[]> {
        const matchups: ChampionMatchup[] = [];

        try {
            const [uggMatchups, opggMatchups] = await Promise.allSettled([
                this.fetchUGGMatchups(championName, role, rank),
                this.fetchOPGGMatchups(championId, role, rank)
            ]);

            if (uggMatchups.status === 'fulfilled' && uggMatchups.value) {
                matchups.push(...this.transformUGGMatchups(uggMatchups.value));
            }

            if (opggMatchups.status === 'fulfilled' && opggMatchups.value) {
                matchups.push(...this.transformOPGGMatchups(opggMatchups.value));
            }

            // Deduplicate and merge matchup data
            const mergedMatchups = this.mergeMatchupData(matchups);
            return mergedMatchups.sort((a, b) => (b.gamesPlayed || 0) - (a.gamesPlayed || 0));
        } catch (error) {
            console.error('Failed to fetch champion matchups from external APIs:', error);
            return [];
        }
    }

    /**
     * Fetch counter data from multiple sources
     */
    async getCounterData(championId: number, championName: string, championKey: string, role: ChampionRole, rank: string): Promise<CounterData> {
        try {
            const [matchups, _performance] = await Promise.allSettled([
                this.getChampionMatchups(championId, championName, championKey, role, rank),
                this.fetchMobalyticsPerformance(championKey, role, rank)
            ]);

            // Transform matchup data into counter data
            let hardCounters: any[] = [];
            let softCounters: any[] = [];
            let hardAdvantages: any[] = [];
            let softAdvantages: any[] = [];

            if (matchups.status === 'fulfilled' && matchups.value) {
                const sortedMatchups = matchups.value.sort((a, b) => a.winRate - b.winRate);
                
                hardCounters = sortedMatchups
                    .filter(m => m.winRate < 45)
                    .slice(0, 5)
                    .map(m => ({
                        championId: m.enemyChampionId,
                        championName: m.enemyChampionName,
                        winRateAgainst: m.winRate,
                        difficulty: 'Hard',
                        reason: this.generateCounterReason(m, 'counter')
                    }));

                softCounters = sortedMatchups
                    .filter(m => m.winRate >= 45 && m.winRate < 48)
                    .slice(0, 3)
                    .map(m => ({
                        championId: m.enemyChampionId,
                        championName: m.enemyChampionName,
                        winRateAgainst: m.winRate,
                        difficulty: 'Medium',
                        reason: this.generateCounterReason(m, 'soft_counter')
                    }));

                const advantageMatchups = sortedMatchups.sort((a, b) => b.winRate - a.winRate);
                
                hardAdvantages = advantageMatchups
                    .filter(m => m.winRate > 55)
                    .slice(0, 5)
                    .map(m => ({
                        championId: m.enemyChampionId,
                        championName: m.enemyChampionName,
                        winRateAgainst: m.winRate,
                        difficulty: 'Easy',
                        reason: this.generateCounterReason(m, 'advantage')
                    }));

                softAdvantages = advantageMatchups
                    .filter(m => m.winRate > 52 && m.winRate <= 55)
                    .slice(0, 3)
                    .map(m => ({
                        championId: m.enemyChampionId,
                        championName: m.enemyChampionName,
                        winRateAgainst: m.winRate,
                        difficulty: 'Medium-Easy',
                        reason: this.generateCounterReason(m, 'soft_advantage')
                    }));
            }

            return {
                championId,
                role,
                counters: {
                    hardCounters,
                    softCounters
                },
                goodAgainst: {
                    hardCounters: hardAdvantages,
                    softCounters: softAdvantages
                },
                banRecommendations: hardCounters.slice(0, 3).map(counter => ({
                    championId: counter.championId,
                    championName: counter.championName,
                    banRate: Math.round((100 - counter.winRateAgainst) * 0.8), // Estimate ban rate
                    reason: `Strong counter with ${counter.winRateAgainst.toFixed(1)}% win rate`
                }))
            };
        } catch (error) {
            console.error('Failed to fetch counter data from external APIs:', error);
            return {
                championId,
                role,
                counters: { hardCounters: [], softCounters: [] },
                goodAgainst: { hardCounters: [], softCounters: [] },
                banRecommendations: []
            };
        }
    }

    // Private API methods
    private async fetchUGGBuilds(championName: string, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.UGG.base + API_ENDPOINTS.UGG.builds
            .replace('{championName}', championName.toLowerCase())
            + `?role=${role.toLowerCase()}&rank=${rank}`;
        
        return this.makeRateLimitedRequest('ugg_builds', url);
    }

    private async fetchOPGGBuilds(championId: number, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.OPGG.base + API_ENDPOINTS.OPGG.builds
            .replace('{championId}', championId.toString())
            + `?role=${role.toLowerCase()}&tier=${rank}`;
        
        return this.makeRateLimitedRequest('opgg_builds', url);
    }

    private async fetchMobalyticsBuilds(championKey: string, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.MOBALYTICS.base + API_ENDPOINTS.MOBALYTICS.builds
            .replace('{championKey}', championKey.toLowerCase())
            + `?role=${role.toLowerCase()}&rank=${rank}`;
        
        return this.makeRateLimitedRequest('mobalytics_builds', url);
    }

    private async fetchUGGMatchups(championName: string, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.UGG.base + API_ENDPOINTS.UGG.matchups
            .replace('{championName}', championName.toLowerCase())
            + `?role=${role.toLowerCase()}&rank=${rank}`;
        
        return this.makeRateLimitedRequest('ugg_matchups', url);
    }

    private async fetchOPGGMatchups(championId: number, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.OPGG.base + API_ENDPOINTS.OPGG.matchups
            .replace('{championId}', championId.toString())
            + `?role=${role.toLowerCase()}&tier=${rank}`;
        
        return this.makeRateLimitedRequest('opgg_matchups', url);
    }

    private async fetchMobalyticsPerformance(championKey: string, role: ChampionRole, rank: string): Promise<any> {
        const url = API_ENDPOINTS.MOBALYTICS.base + API_ENDPOINTS.MOBALYTICS.performance
            .replace('{championKey}', championKey.toLowerCase())
            + `?role=${role.toLowerCase()}&rank=${rank}`;
        
        return this.makeRateLimitedRequest('mobalytics_performance', url);
    }

    // Rate limiting and request management
    private async makeRateLimitedRequest(key: string, url: string): Promise<any> {
        // Check if there's already a pending request for this key
        if (this.requestQueue.has(key)) {
            return this.requestQueue.get(key);
        }

        // Apply rate limiting
        const lastRequest = this.lastRequestTime.get(key) || 0;
        const timeSinceLastRequest = Date.now() - lastRequest;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }

        const requestPromise = this.performRequest(url).finally(() => {
            this.requestQueue.delete(key);
            this.lastRequestTime.set(key, Date.now());
        });

        this.requestQueue.set(key, requestPromise);
        return requestPromise;
    }

    private async performRequest(url: string): Promise<any> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'League-View-App/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`Failed to fetch from ${url}:`, error);
            return null;
        }
    }

    // Data transformation methods
    private transformUGGBuilds(data: any, championId: number): ChampionBuild[] {
        if (!data || !data.builds) return [];
        
        return data.builds.map((build: any, index: number) => ({
            id: `ugg-${championId}-${index}`,
            name: build.name || `U.GG Build ${index + 1}`,
            items: this.parseItemBuild(build.items || []),
            runes: this.parseRuneBuild(build.runes || {}),
            abilities: this.parseAbilityOrder(build.abilities || []),
            summoners: this.parseSummonerSpells(build.summoners || []),
            winRate: build.winRate || 0,
            pickRate: build.pickRate || 0,
            gameCount: build.gameCount || 0,
            source: 'U.GG',
            description: build.description || 'Popular build from U.GG'
        }));
    }

    private transformOPGGBuilds(data: any, championId: number): ChampionBuild[] {
        if (!data || !data.data) return [];
        
        return data.data.map((build: any, index: number) => ({
            id: `opgg-${championId}-${index}`,
            name: build.buildName || `OP.GG Build ${index + 1}`,
            items: this.parseItemBuild(build.items || []),
            runes: this.parseRuneBuild(build.runes || {}),
            abilities: this.parseAbilityOrder(build.skillOrder || []),
            summoners: this.parseSummonerSpells(build.summoners || []),
            winRate: build.win || 0,
            pickRate: build.pick || 0,
            gameCount: build.count || 0,
            source: 'OP.GG',
            description: build.description || 'Recommended build from OP.GG'
        }));
    }

    private transformMobalyticsBuilds(data: any, championId: number): ChampionBuild[] {
        if (!data || !data.builds) return [];
        
        return data.builds.map((build: any, index: number) => ({
            id: `mobalytics-${championId}-${index}`,
            name: build.title || `Mobalytics Build ${index + 1}`,
            items: this.parseItemBuild(build.itemBuild || []),
            runes: this.parseRuneBuild(build.runeTree || {}),
            abilities: this.parseAbilityOrder(build.skillOrder || []),
            summoners: this.parseSummonerSpells(build.summonerSpells || []),
            winRate: build.winrate || 0,
            pickRate: build.playrate || 0,
            gameCount: build.matches || 0,
            source: 'Mobalytics',
            description: build.description || 'Optimized build from Mobalytics'
        }));
    }

    private transformUGGMatchups(data: any): ChampionMatchup[] {
        if (!data || !data.matchups) return [];
        
        return data.matchups.map((matchup: any) => ({
            enemyChampionId: matchup.championId || 0,
            enemyChampionName: matchup.championName || 'Unknown',
            winRate: matchup.winRate || 50,
            gamesPlayed: matchup.games || 0,
            averageKDA: matchup.kda || 1.0,
            averageCS: matchup.cs || 150,
            difficulty: this.getDifficultyFromWinRate(matchup.winRate || 50),
            tips: matchup.tips || []
        }));
    }

    private transformOPGGMatchups(data: any): ChampionMatchup[] {
        if (!data || !data.matchups) return [];
        
        return data.matchups.map((matchup: any) => ({
            enemyChampionId: matchup.opponent_id || 0,
            enemyChampionName: matchup.opponent_name || 'Unknown',
            winRate: matchup.win_rate || 50,
            gamesPlayed: matchup.game_count || 0,
            averageKDA: matchup.avg_kda || 1.0,
            averageCS: matchup.avg_cs || 150,
            difficulty: this.getDifficultyFromWinRate(matchup.win_rate || 50),
            tips: matchup.advice || []
        }));
    }

    // Helper methods for parsing API data
    private parseItemBuild(items: any[]): number[] {
        if (!Array.isArray(items)) return [];
        return items.map(item => typeof item === 'number' ? item : item.id || 0).filter(id => id > 0);
    }

    private parseRuneBuild(runes: any): { primary: number[], secondary: number[], shards: number[] } {
        return {
            primary: Array.isArray(runes.primary) ? runes.primary : runes.primaryTree || [],
            secondary: Array.isArray(runes.secondary) ? runes.secondary : runes.secondaryTree || [],
            shards: Array.isArray(runes.shards) ? runes.shards : runes.statShards || []
        };
    }

    private parseAbilityOrder(abilities: any[]): string[] {
        if (!Array.isArray(abilities)) return [];
        return abilities.map(ability => {
            if (typeof ability === 'string') return ability;
            if (typeof ability === 'object' && ability.skill) return ability.skill;
            return 'Q'; // Default fallback
        });
    }

    private parseSummonerSpells(summoners: any[]): number[] {
        if (!Array.isArray(summoners)) return [4, 12]; // Default Flash + Teleport
        return summoners.map(spell => typeof spell === 'number' ? spell : spell.id || 4);
    }

    private getDifficultyFromWinRate(winRate: number): 'Easy' | 'Medium' | 'Hard' {
        if (winRate >= 55) return 'Easy';
        if (winRate >= 45) return 'Medium';
        return 'Hard';
    }

    private mergeMatchupData(matchups: ChampionMatchup[]): ChampionMatchup[] {
        // Merge and deduplicate matchup data from multiple sources
        const merged = new Map<number, ChampionMatchup>();
        
        for (const matchup of matchups) {
            const existing = merged.get(matchup.enemyChampionId);
            if (existing) {
                // Merge data, prioritizing higher sample sizes
                if ((matchup.gamesPlayed || 0) > (existing.gamesPlayed || 0)) {
                    merged.set(matchup.enemyChampionId, matchup);
                }
            } else {
                merged.set(matchup.enemyChampionId, matchup);
            }
        }
        
        return Array.from(merged.values());
    }

    private generateCounterReason(_matchup: ChampionMatchup, type: 'counter' | 'soft_counter' | 'advantage' | 'soft_advantage'): string {
        const reasons = {
            counter: [
                'Strong early game pressure and kill potential',
                'Superior scaling and teamfight presence',
                'Effective crowd control and burst damage',
                'Range advantage and poke potential',
                'Strong all-in potential and sustain'
            ],
            soft_counter: [
                'Better wave management and map pressure',
                'Favorable trading patterns in lane',
                'Superior objective control and roaming',
                'Effective itemization options available',
                'Better late game scaling potential'
            ],
            advantage: [
                'Easy to engage and burst down',
                'Limited escape options and mobility',
                'Vulnerable to crowd control and ganks',
                'Poor early game and scaling issues',
                'Predictable patterns and counterplay'
            ],
            soft_advantage: [
                'Favorable laning phase and trades',
                'Better map presence and utility',
                'Superior teamfight positioning',
                'Effective counter-itemization available',
                'Good scaling differential'
            ]
        };

        const reasonList = reasons[type];
        return reasonList[Math.floor(Math.random() * reasonList.length)];
    }
}

export const externalAPIService = ExternalAPIService.getInstance();
