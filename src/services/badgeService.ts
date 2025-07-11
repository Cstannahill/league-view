import { Badge, BadgeRequirement, PlayerStats, PlayerBadgeData, BADGE_DEFINITIONS, BadgeTier } from '../types/badges';

export class BadgeCalculationService {
  
  /**
   * Evaluates all badges for a player based on their stats
   */
  static evaluatePlayerBadges(playerStats: PlayerStats): PlayerBadgeData {
    const earnedBadges: Badge[] = [];
    const badgeProgress = new Map<string, number>();
    
    for (const badgeDefinition of BADGE_DEFINITIONS) {
      const { isEarned, progress } = this.evaluateBadge(badgeDefinition, playerStats);
      
      if (isEarned) {
        earnedBadges.push({
          ...badgeDefinition,
          achievedAt: new Date(),
          progress: 100
        });
      } else {
        badgeProgress.set(badgeDefinition.id, progress);
      }
    }
    
    return {
      playerId: '', // To be set by caller
      badges: earnedBadges,
      badgeProgress,
      stats: playerStats
    };
  }
  
  /**
   * Evaluates a single badge against player stats
   */
  private static evaluateBadge(badge: Badge, playerStats: PlayerStats): { isEarned: boolean; progress: number } {
    const requirements = badge.requirements;
    let metRequirements = 0;
    let totalProgress = 0;
    
    for (const requirement of requirements) {
      const { isMet, progress } = this.evaluateRequirement(requirement, playerStats);
      if (isMet) {
        metRequirements++;
      }
      totalProgress += progress;
    }
    
    const overallProgress = Math.min(100, (totalProgress / requirements.length));
    const isEarned = metRequirements === requirements.length;
    
    return { isEarned, progress: overallProgress };
  }
  
  /**
   * Evaluates a single requirement against player stats
   */
  private static evaluateRequirement(requirement: BadgeRequirement, playerStats: PlayerStats): { isMet: boolean; progress: number } {
    const statValue = this.getStatValue(requirement.metric, playerStats);
    
    if (statValue === undefined) {
      return { isMet: false, progress: 0 };
    }
    
    const threshold = requirement.threshold;
    let isMet = false;
    let progress = 0;
    
    switch (requirement.operator) {
      case 'gte':
        isMet = statValue >= threshold;
        progress = Math.min(100, (statValue / threshold) * 100);
        break;
      case 'gt':
        isMet = statValue > threshold;
        progress = Math.min(100, (statValue / threshold) * 100);
        break;
      case 'lte':
        isMet = statValue <= threshold;
        progress = statValue <= threshold ? 100 : Math.max(0, 100 - ((statValue - threshold) / threshold) * 100);
        break;
      case 'lt':
        isMet = statValue < threshold;
        progress = statValue < threshold ? 100 : Math.max(0, 100 - ((statValue - threshold) / threshold) * 100);
        break;
      case 'eq':
        isMet = statValue === threshold;
        progress = statValue === threshold ? 100 : Math.max(0, 100 - Math.abs(statValue - threshold) / threshold * 100);
        break;
    }
    
    return { isMet, progress };
  }
  
  /**
   * Extracts a stat value from player stats using the metric key
   */
  private static getStatValue(metric: string, playerStats: PlayerStats): number | undefined {
    // Use dynamic property access to get the stat value
    return (playerStats as any)[metric];
  }
  
  /**
   * Calculates tier-based versions of badges
   */
  static calculateBadgeTiers(badge: Badge): Badge[] {
    const tierMultipliers = {
      [BadgeTier.BRONZE]: 0.6,
      [BadgeTier.SILVER]: 0.8,
      [BadgeTier.GOLD]: 1.0,
      [BadgeTier.PLATINUM]: 1.2,
      [BadgeTier.DIAMOND]: 1.5
    };
    
    const tieredBadges: Badge[] = [];
    
    for (const [tier, multiplier] of Object.entries(tierMultipliers)) {
      const tieredRequirements = badge.requirements.map(req => ({
        ...req,
        threshold: req.threshold * multiplier
      }));
      
      const tieredBadge: Badge = {
        ...badge,
        id: `${badge.id}_${tier}`,
        tier: tier as BadgeTier,
        requirements: tieredRequirements
      };
      
      tieredBadges.push(tieredBadge);
    }
    
    return tieredBadges;
  }
  
  /**
   * Gets the highest earned tier for a specific badge
   */
  static getHighestBadgeTier(baseBadgeId: string, playerStats: PlayerStats): BadgeTier | null {
    const baseBadge = BADGE_DEFINITIONS.find(b => b.id === baseBadgeId);
    if (!baseBadge) return null;
    
    const tieredBadges = this.calculateBadgeTiers(baseBadge);
    
    // Check from highest tier to lowest
    const tierOrder = [BadgeTier.DIAMOND, BadgeTier.PLATINUM, BadgeTier.GOLD, BadgeTier.SILVER, BadgeTier.BRONZE];
    
    for (const tier of tierOrder) {
      const tieredBadge = tieredBadges.find(b => b.tier === tier);
      if (tieredBadge) {
        const { isEarned } = this.evaluateBadge(tieredBadge, playerStats);
        if (isEarned) {
          return tier;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Gets badge suggestions for improvement
   */
  static getBadgeSuggestions(playerStats: PlayerStats, limit: number = 3): Array<{ badge: Badge; missingRequirements: BadgeRequirement[]; progress: number }> {
    const suggestions = [];
    
    for (const badge of BADGE_DEFINITIONS) {
      const { isEarned, progress } = this.evaluateBadge(badge, playerStats);
      
      if (!isEarned && progress > 50) { // Only suggest badges that are at least 50% complete
        const missingRequirements = badge.requirements.filter(req => {
          const { isMet } = this.evaluateRequirement(req, playerStats);
          return !isMet;
        });
        
        suggestions.push({
          badge,
          missingRequirements,
          progress
        });
      }
    }
    
    // Sort by progress (highest first) and limit results
    return suggestions
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);
  }
  
  /**
   * Analyzes player's badge distribution across categories
   */
  static analyzeBadgeDistribution(playerBadgeData: PlayerBadgeData): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const badge of playerBadgeData.badges) {
      const category = badge.category;
      distribution[category] = (distribution[category] || 0) + 1;
    }
    
    return distribution;
  }
  
  /**
   * Gets player's badge completion percentage
   */
  static getBadgeCompletionPercentage(playerBadgeData: PlayerBadgeData): number {
    const totalBadges = BADGE_DEFINITIONS.length;
    const earnedBadges = playerBadgeData.badges.length;
    return Math.round((earnedBadges / totalBadges) * 100);
  }
  
  /**
   * Gets a badge definition by ID
   */
  static getBadgeDefinition(badgeId: string): Badge | undefined {
    return BADGE_DEFINITIONS.find(badge => badge.id === badgeId);
  }
}

/**
 * Mock data generator for testing badge system
 */
export class MockDataGenerator {
  
  /**
   * Generates mock player stats for testing
   */
  static generateMockPlayerStats(role: string = 'mid'): PlayerStats {
    const baseStats: PlayerStats = {
      // Strategic & Macro Play
      objectiveDamageShare: Math.random() * 25 + 5,
      objectiveKillParticipation: Math.random() * 40 + 40,
      objectiveSecureRate: Math.random() * 40 + 40,
      visionScorePerMinute: Math.random() * 2 + 1,
      controlWardEfficiency: Math.random() * 40 + 40,
      visionDenial: Math.random() * 20 + 5,
      
      // Resource Management
      goldPerMinute: Math.random() * 200 + 300,
      goldToDamageConversion: Math.random() * 0.8 + 0.8,
      itemCompletionSpeed: Math.random() * 30 + 70,
      csPerMinute: Math.random() * 3 + 5,
      csDifferentialAt10: Math.random() * 20 - 10,
      csDifferentialAt20: Math.random() * 30 - 15,
      
      // Teamplay & Support
      engagementSuccessRate: Math.random() * 40 + 40,
      ccScoreContribution: Math.random() * 40 + 40,
      damageShieldedHealed: Math.random() * 8000 + 2000,
      ccOnEnemiesAttackingAllies: Math.random() * 15 + 5,
      numberOfSaves: Math.random() * 4 + 1,
      roamSuccessRate: Math.random() * 40 + 40,
      roamGoldXpSwing: Math.random() * 2000 + 1000,
      
      // Adaptability & Resilience
      winRateFromGoldDeficit: Math.random() * 30 + 20,
      kdaWhenBehind: Math.random() * 1 + 1,
      objectiveSecuresWhenBehind: Math.random() * 40 + 20,
      championPoolSize: Math.floor(Math.random() * 10 + 3),
      roleFlexibility: Math.floor(Math.random() * 3 + 1),
      metaAdaptationScore: Math.random() * 40 + 50,
      
      // Early Game & Laning
      goldDifferentialAt10: Math.random() * 600 - 300,
      killParticipationInLane: Math.random() * 40 + 40,
      soloKillRate: Math.random() * 30 + 10,
      pressureScore: Math.random() * 40 + 40,
      firstBloodParticipationRate: Math.random() * 40 + 20,
      
      // Late Game & Scaling
      lateGameDamageDealt: Math.random() * 15000 + 15000,
      lateGameDamageTaken: Math.random() * 15000 + 10000,
      lateGameObjectiveSecureRate: Math.random() * 40 + 40,
      winRateGames30Plus: Math.random() * 40 + 40,
      lateGameGoldToDamageConversion: Math.random() * 0.8 + 1,
      
      // Anti-Carry & Disruption
      damageToEnemyCarries: Math.random() * 10000 + 5000,
      ccOnEnemyCarries: Math.random() * 8 + 2,
      killParticipationOnCarries: Math.random() * 40 + 40,
      totalCcDuration: Math.random() * 20 + 5,
      multiTargetCcHits: Math.random() * 5 + 1,
      ccFollowUpRate: Math.random() * 40 + 50,
      
      // General stats
      kda: Math.random() * 2 + 1,
      winRate: Math.random() * 40 + 40,
      gamesPlayed: Math.floor(Math.random() * 200 + 50),
      currentRank: 'Gold II',
      role: role
    };
    
    // Role-specific adjustments
    if (role === 'support') {
      baseStats.visionScorePerMinute *= 1.5;
      baseStats.damageShieldedHealed *= 1.5;
      baseStats.ccScoreContribution *= 1.2;
      baseStats.goldPerMinute *= 0.7;
      baseStats.csPerMinute *= 0.3;
    } else if (role === 'jungle') {
      baseStats.objectiveDamageShare *= 1.3;
      baseStats.roamSuccessRate *= 1.2;
      baseStats.firstBloodParticipationRate *= 1.2;
      baseStats.csPerMinute *= 0.8;
    } else if (role === 'adc') {
      baseStats.lateGameDamageDealt *= 1.4;
      baseStats.goldToDamageConversion *= 1.2;
      baseStats.csPerMinute *= 1.2;
    } else if (role === 'top') {
      baseStats.teleportEffectivenessRate = Math.random() * 40 + 40;
      baseStats.soloKillRate *= 1.3;
      baseStats.pressureScore *= 1.1;
    }
    
    return baseStats;
  }
}
