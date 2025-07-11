import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface LiveMatchData {
  is_in_game: boolean;
  game_id?: number;
  game_start_time?: number;
  game_length?: number;
  game_mode?: string;
  game_type?: string;
  map_id?: number;
  participants?: ParticipantInfo[];
  detection_confidence: number;
  detection_method: string;
  last_updated: number;
  next_check_in_seconds: number;
  api_error?: string;
}

export interface ParticipantInfo {
  champion_id: string;
  summoner_name: string;
  team_id: string;
  spell1_id: number;
  spell2_id: number;
  is_bot: boolean;
}

export interface EnhancedMatchHistoryData {
  matches: HistoricalMatch[];
  total_analyzed: number;
  analytics_version: string;
  last_updated: number;
}

export interface HistoricalMatch {
  match_id: string;
  game_creation: number;
  game_duration: number;
  analytics_calculated: boolean;
  needs_processing: boolean;
}

export class LiveMatchDetectionService {
  private isMonitoring = false;
  private listeners: Set<(data: LiveMatchData) => void> = new Set();
  private errorListeners: Set<(error: string) => void> = new Set();
  private currentMatchData: LiveMatchData | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private async setupEventListeners() {
    // Listen for live match detection events
    await listen<LiveMatchData>('live-match-detected', (event) => {
      this.currentMatchData = event.payload;
      this.notifyListeners(event.payload);
    });

    // Listen for match status updates
    await listen<LiveMatchData>('match-status-update', (event) => {
      this.currentMatchData = event.payload;
      this.notifyListeners(event.payload);
    });

    // Listen for detection errors
    await listen<string>('match-detection-error', (event) => {
      this.notifyErrorListeners(event.payload);
    });
  }

  /**
   * Detect if the player is currently in a live match
   */
  async detectLiveMatch(summonerName: string, region: string): Promise<LiveMatchData> {
    try {
      const result = await invoke<LiveMatchData>('detect_live_match', {
        summonerName,
        region,
      });

      this.currentMatchData = result;
      this.notifyListeners(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyErrorListeners(`Live match detection failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Start continuous monitoring for live matches
   */
  async startMonitoring(summonerName: string, region: string): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Live match monitoring is already active');
      return;
    }

    try {
      await invoke<string>('start_live_match_monitoring', {
        summonerName,
        region,
      });

      this.isMonitoring = true;
      console.log('Live match monitoring started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyErrorListeners(`Failed to start monitoring: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Stop live match monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Live match monitoring stopped');
  }

  /**
   * Get enhanced match history with analytics
   */
  async getEnhancedMatchHistory(
    summonerName: string, 
    region: string, 
    count?: number
  ): Promise<EnhancedMatchHistoryData> {
    try {
      const result = await invoke<EnhancedMatchHistoryData>('get_enhanced_match_history', {
        summonerName,
        region,
        count,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyErrorListeners(`Failed to get enhanced match history: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get current match data if available
   */
  getCurrentMatchData(): LiveMatchData | null {
    return this.currentMatchData;
  }

  /**
   * Check if currently monitoring
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Add listener for live match updates
   */
  addMatchListener(callback: (data: LiveMatchData) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Add listener for error events
   */
  addErrorListener(callback: (error: string) => void): () => void {
    this.errorListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Get match status summary
   */
  getMatchStatusSummary(): {
    isInGame: boolean;
    gameLength?: string;
    detectionConfidence: number;
    lastUpdate: string;
  } {
    if (!this.currentMatchData) {
      return {
        isInGame: false,
        detectionConfidence: 0,
        lastUpdate: 'Never',
      };
    }

    const gameLength = this.currentMatchData.game_length 
      ? this.formatGameLength(this.currentMatchData.game_length)
      : undefined;

    const lastUpdate = new Date(this.currentMatchData.last_updated * 1000).toLocaleTimeString();

    return {
      isInGame: this.currentMatchData.is_in_game,
      gameLength,
      detectionConfidence: this.currentMatchData.detection_confidence,
      lastUpdate,
    };
  }

  /**
   * Get detailed match information for UI display
   */
  getDetailedMatchInfo(): {
    basic: {
      isInGame: boolean;
      gameMode?: string;
      gameType?: string;
      gameLength?: string;
    };
    technical: {
      detectionMethod: string;
      confidence: number;
      lastUpdated: string;
      nextCheckIn: number;
    };
    participants?: ParticipantInfo[];
    error?: string;
  } | null {
    if (!this.currentMatchData) return null;

    return {
      basic: {
        isInGame: this.currentMatchData.is_in_game,
        gameMode: this.currentMatchData.game_mode,
        gameType: this.currentMatchData.game_type,
        gameLength: this.currentMatchData.game_length 
          ? this.formatGameLength(this.currentMatchData.game_length)
          : undefined,
      },
      technical: {
        detectionMethod: this.currentMatchData.detection_method,
        confidence: Math.round(this.currentMatchData.detection_confidence * 100),
        lastUpdated: new Date(this.currentMatchData.last_updated * 1000).toLocaleString(),
        nextCheckIn: this.currentMatchData.next_check_in_seconds,
      },
      participants: this.currentMatchData.participants,
      error: this.currentMatchData.api_error,
    };
  }

  private notifyListeners(data: LiveMatchData): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in match listener callback:', error);
      }
    });
  }

  private notifyErrorListeners(error: string): void {
    this.errorListeners.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error listener callback:', err);
      }
    });
  }

  private formatGameLength(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const liveMatchService = new LiveMatchDetectionService();
