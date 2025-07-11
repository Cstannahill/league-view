import {
  AdvancedAnalytics,
  ChampionAnalytics,
  TimelineAnalytics,
  PlayerPsychologyProfile,
  MetaAdaptationAnalysis,
  SkillProgressionData,
  SocialGameplayAnalytics,
  GamePhaseStats,
  MatchupAnalysis,
  ChampionRolePerformance,
  TrendData
} from '../types/analytics';

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  /**
   * Generate comprehensive analytics for a player
   */
  public generateAdvancedAnalytics(
    matchHistory: any[], 
    currentRank: any,
    recentGames: any[]
  ): AdvancedAnalytics {
    return {
      championAnalytics: this.analyzeChampionPerformance(matchHistory),
      timelineAnalytics: this.analyzeTimelinePerformance(matchHistory),
      psychologyProfile: this.analyzePsychologyProfile(matchHistory, recentGames),
      metaAdaptation: this.analyzeMetaAdaptation(matchHistory),
      skillProgression: this.analyzeSkillProgression(matchHistory, currentRank),
      socialAnalytics: this.analyzeSocialGameplay(matchHistory)
    };
  }

  /**
   * Analyze champion performance with advanced metrics
   */
  private analyzeChampionPerformance(matchHistory: any[]): ChampionAnalytics[] {
    const championMap = new Map<number, any[]>();
    
    // Group matches by champion
    matchHistory.forEach(match => {
      const championId = match.champion_id;
      if (!championMap.has(championId)) {
        championMap.set(championId, []);
      }
      championMap.get(championId)!.push(match);
    });

    return Array.from(championMap.entries()).map(([championId, matches]) => {
      return this.calculateChampionAnalytics(championId, matches);
    });
  }

  private calculateChampionAnalytics(championId: number, matches: any[]): ChampionAnalytics {
    const totalGames = matches.length;
    const wins = matches.filter(m => m.win).length;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    const avgKDA = {
      kills: matches.reduce((sum, m) => sum + m.kills, 0) / totalGames,
      deaths: matches.reduce((sum, m) => sum + m.deaths, 0) / totalGames,
      assists: matches.reduce((sum, m) => sum + m.assists, 0) / totalGames
    };

    // Mock advanced stats (in real implementation, get from detailed match data)
    const averageCS = 150 + Math.random() * 50;
    const averageGold = 12000 + Math.random() * 3000;
    const averageDamage = 15000 + Math.random() * 10000;
    const averageVisionScore = 20 + Math.random() * 15;

    const durations = matches.map(m => m.duration);
    const gameLength = {
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      shortest: Math.min(...durations),
      longest: Math.max(...durations)
    };

    // Calculate trend based on recent performance
    const recentMatches = matches.slice(0, Math.min(5, totalGames));
    const recentWinRate = recentMatches.filter(m => m.win).length / recentMatches.length;
    const recentTrend = recentWinRate > winRate / 100 ? 'improving' : 
                        recentWinRate < winRate / 100 ? 'declining' : 'stable';

    return {
      championId,
      championName: `Champion ${championId}`, // Would be resolved from Data Dragon
      totalGames,
      winRate,
      averageKDA: avgKDA,
      averageCS,
      averageGold,
      averageDamage,
      averageVisionScore,
      gameLength,
      performanceByRole: this.analyzeRolePerformance(matches),
      recentTrend,
      matchupData: this.analyzeMatchups(matches)
    };
  }

  private analyzeRolePerformance(matches: any[]): Record<string, ChampionRolePerformance> {
    // Mock role performance data
    const roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
    const rolePerformance: Record<string, ChampionRolePerformance> = {};

    roles.forEach(role => {
      const roleMatches = matches.filter(() => Math.random() > 0.7); // Mock role filtering
      if (roleMatches.length > 0) {
        rolePerformance[role] = {
          games: roleMatches.length,
          winRate: (roleMatches.filter(m => m.win).length / roleMatches.length) * 100,
          averageKDA: {
            kills: roleMatches.reduce((sum, m) => sum + m.kills, 0) / roleMatches.length,
            deaths: roleMatches.reduce((sum, m) => sum + m.deaths, 0) / roleMatches.length,
            assists: roleMatches.reduce((sum, m) => sum + m.assists, 0) / roleMatches.length
          },
          preferredItems: [], // Would be populated from detailed match data
          skillOrder: []
        };
      }
    });

    return rolePerformance;
  }

  private analyzeMatchups(_matches: any[]): MatchupAnalysis[] {
    // Mock matchup analysis - in real implementation would analyze actual matchups
    return [
      {
        enemyChampion: 'Yasuo',
        enemyChampionId: 157,
        games: 3,
        winRate: 66.7,
        avgKillDiff: 1.3,
        avgCSDiff: 15,
        lanePhaseWinRate: 75
      },
      {
        enemyChampion: 'Zed',
        enemyChampionId: 238,
        games: 2,
        winRate: 50,
        avgKillDiff: -0.5,
        avgCSDiff: -10,
        lanePhaseWinRate: 40
      }
    ];
  }

  /**
   * Analyze performance across different game phases
   */
  private analyzeTimelinePerformance(_matchHistory: any[]): TimelineAnalytics {
    // Mock timeline analysis - in real implementation would analyze game phases from match data
    const earlyGame: GamePhaseStats = {
      avgKills: 2.1,
      avgDeaths: 1.3,
      avgAssists: 3.2,
      avgGoldDiff: 150,
      avgCSDiff: 8,
      avgDamageShare: 0.22,
      winRateInPhase: 65,
      objectiveParticipation: 0.7
    };

    const midGame: GamePhaseStats = {
      avgKills: 4.5,
      avgDeaths: 2.8,
      avgAssists: 6.1,
      avgGoldDiff: 300,
      avgCSDiff: 12,
      avgDamageShare: 0.25,
      winRateInPhase: 58,
      objectiveParticipation: 0.8
    };

    const lateGame: GamePhaseStats = {
      avgKills: 6.2,
      avgDeaths: 4.1,
      avgAssists: 8.9,
      avgGoldDiff: 450,
      avgCSDiff: 5,
      avgDamageShare: 0.28,
      winRateInPhase: 62,
      objectiveParticipation: 0.85
    };

    return { earlyGame, midGame, lateGame };
  }

  /**
   * Analyze psychological traits and resilience
   */
  private analyzePsychologyProfile(matchHistory: any[], recentGames: any[]): PlayerPsychologyProfile {
    // Calculate tilt resistance based on performance after losses
    const tiltResistance = this.calculateTiltResistance(recentGames);
    
    // Calculate comeback potential
    const combackPotential = this.calculateComebackPotential(matchHistory);
    
    // Calculate clutch factor based on performance in close games
    const clutchFactor = this.calculateClutchFactor(matchHistory);
    
    // Calculate consistency score
    const consistencyScore = this.calculateConsistency(matchHistory);
    
    return {
      tiltResistance,
      combackPotential,
      clutchFactor,
      consistencyScore,
      adaptabilityScore: 75 + Math.random() * 20,
      teamplayRating: 80 + Math.random() * 15
    };
  }

  private calculateTiltResistance(recentGames: any[]): number {
    let tiltScore = 0;
    let scenarios = 0;

    for (let i = 1; i < recentGames.length; i++) {
      if (!recentGames[i - 1].win) { // Previous game was a loss
        scenarios++;
        const currentGame = recentGames[i];
        const avgKDA = (currentGame.kills + currentGame.assists) / Math.max(currentGame.deaths, 1);
        
        if (avgKDA > 2.0) tiltScore += 20;
        else if (avgKDA > 1.5) tiltScore += 10;
        else if (avgKDA > 1.0) tiltScore += 5;
      }
    }

    return scenarios > 0 ? Math.min(100, (tiltScore / scenarios) * 2) : 75;
  }

  private calculateComebackPotential(matchHistory: any[]): number {
    // Mock calculation based on performance in longer games
    const longGames = matchHistory.filter(m => m.duration > 1800); // 30+ minutes
    if (longGames.length === 0) return 70;

    const longGameWinRate = longGames.filter(m => m.win).length / longGames.length;
    return Math.min(100, longGameWinRate * 100 + 20);
  }

  private calculateClutchFactor(matchHistory: any[]): number {
    // Mock calculation - in reality would analyze close games and clutch moments
    const avgKDA = matchHistory.reduce((sum, m) => {
      return sum + (m.kills + m.assists) / Math.max(m.deaths, 1);
    }, 0) / matchHistory.length;

    return Math.min(100, Math.max(0, (avgKDA - 1) * 30 + 40));
  }

  private calculateConsistency(matchHistory: any[]): number {
    if (matchHistory.length < 5) return 50;

    const kdaRatios = matchHistory.map(m => (m.kills + m.assists) / Math.max(m.deaths, 1));
    const avgKDA = kdaRatios.reduce((sum, kda) => sum + kda, 0) / kdaRatios.length;
    
    const variance = kdaRatios.reduce((sum, kda) => sum + Math.pow(kda - avgKDA, 2), 0) / kdaRatios.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 20));
    return Math.min(100, consistencyScore);
  }

  /**
   * Analyze adaptation to meta changes
   */
  private analyzeMetaAdaptation(matchHistory: any[]): MetaAdaptationAnalysis {
    const uniqueChampions = new Set(matchHistory.map(m => m.champion_id)).size;
    
    return {
      currentPatchPerformance: 75 + Math.random() * 20,
      championPoolSize: uniqueChampions,
      roleFlexibility: Math.min(100, uniqueChampions * 15),
      itemBuildAdaptation: 70 + Math.random() * 25,
      runeAdaptation: 65 + Math.random() * 30,
      metaChampionUsage: 60 + Math.random() * 35
    };
  }

  /**
   * Analyze skill progression over time
   */
  private analyzeSkillProgression(_matchHistory: any[], _currentRank: any): SkillProgressionData {
    const skillTrends = {
      mechanical: this.generateTrendData(75),
      gameKnowledge: this.generateTrendData(68),
      positioning: this.generateTrendData(72),
      objectiveControl: this.generateTrendData(80),
      teamfight: this.generateTrendData(85)
    };

    return {
      overallRating: 74,
      skillTrends,
      rankProgression: [], // Would be populated from rank history
      improvementAreas: ['Positioning', 'Early Game Aggression'],
      strengthAreas: ['Teamfighting', 'Objective Control', 'Champion Mechanics']
    };
  }

  private generateTrendData(baseValue: number): TrendData {
    const change = (Math.random() - 0.5) * 20;
    return {
      current: Math.max(0, Math.min(100, baseValue + change)),
      trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      changePercent: Math.abs(change),
      confidence: 75 + Math.random() * 20
    };
  }

  /**
   * Analyze social and team gameplay aspects
   */
  private analyzeSocialGameplay(_matchHistory: any[]): SocialGameplayAnalytics {
    return {
      duoPerformance: [
        {
          partnerName: 'DuoPartner1',
          gamesPlayed: 15,
          winRate: 73.3,
          synergy: 85,
          preferredLanes: ['BOTTOM', 'UTILITY']
        }
      ],
      teamCompositionSuccess: [
        {
          composition: 'Poke/Siege',
          games: 8,
          winRate: 75,
          averageGameLength: 1650,
          preferredStrategy: 'Objective Control'
        },
        {
          composition: 'Teamfight/Engage',
          games: 12,
          winRate: 66.7,
          averageGameLength: 1980,
          preferredStrategy: 'Late Game Scaling'
        }
      ],
      communicationScore: 78,
      leadershipTendency: 65,
      supportivenessRating: 82
    };
  }

  /**
   * Generate mock analytics for demonstration
   */
  public generateMockAnalytics(): AdvancedAnalytics {
    const mockMatchHistory = Array.from({ length: 20 }, () => ({
      champion_id: Math.floor(Math.random() * 160) + 1,
      win: Math.random() > 0.4,
      kills: Math.floor(Math.random() * 15),
      deaths: Math.floor(Math.random() * 8),
      assists: Math.floor(Math.random() * 20),
      duration: 1200 + Math.random() * 1800
    }));

    return this.generateAdvancedAnalytics(mockMatchHistory, null, mockMatchHistory.slice(0, 10));
  }
}

export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance();
