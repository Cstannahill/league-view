// Configuration for external API integration
export interface APIConfig {
    enabled: boolean;
    useExternalAPIs: boolean;
    fallbackToMock: boolean;
    rateLimitDelay: number;
    maxRetries: number;
    timeoutMs: number;
    debugMode: boolean;
    riotAPIKey?: string; // Optional Riot API key for legitimate data access
}

export const DEFAULT_API_CONFIG: APIConfig = {
    enabled: true,
    useExternalAPIs: false, // Start with false until we implement real API endpoints
    fallbackToMock: true,
    rateLimitDelay: 1000, // 1 second between requests
    maxRetries: 3,
    timeoutMs: 10000, // 10 second timeout
    debugMode: import.meta.env.DEV,
    riotAPIKey: undefined // User will need to configure this
};

export class ConfigService {
    private static instance: ConfigService;
    private config: APIConfig = { ...DEFAULT_API_CONFIG };

    private constructor() {
        this.loadConfigFromEnvironment();
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private loadConfigFromEnvironment(): void {
        // Load configuration from environment variables or localStorage
        if (typeof window !== 'undefined') {
            try {
                const savedConfig = localStorage.getItem('league-view-api-config');
                if (savedConfig) {
                    const parsed = JSON.parse(savedConfig);
                    this.config = { ...this.config, ...parsed };
                }
            } catch (error) {
                console.warn('Failed to load API config from localStorage:', error);
            }
        }

        // Override with environment variables if available
        if (import.meta.env.VITE_USE_EXTERNAL_APIS === 'true') {
            this.config.useExternalAPIs = true;
        }
        
        if (import.meta.env.VITE_API_DEBUG === 'true') {
            this.config.debugMode = true;
        }
    }

    public getConfig(): APIConfig {
        return { ...this.config };
    }

    public updateConfig(updates: Partial<APIConfig>): void {
        this.config = { ...this.config, ...updates };
        
        // Save to localStorage if available
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('league-view-api-config', JSON.stringify(this.config));
            } catch (error) {
                console.warn('Failed to save API config to localStorage:', error);
            }
        }
    }

    public enableExternalAPIs(): void {
        this.updateConfig({ useExternalAPIs: true });
    }

    public disableExternalAPIs(): void {
        this.updateConfig({ useExternalAPIs: false });
    }

    public isExternalAPIEnabled(): boolean {
        return this.config.enabled && this.config.useExternalAPIs;
    }

    public shouldFallbackToMock(): boolean {
        return this.config.fallbackToMock;
    }

    public getRateLimitDelay(): number {
        return this.config.rateLimitDelay;
    }

    public getMaxRetries(): number {
        return this.config.maxRetries;
    }

    public getTimeoutMs(): number {
        return this.config.timeoutMs;
    }

    public isDebugMode(): boolean {
        return this.config.debugMode;
    }

    public resetToDefaults(): void {
        this.config = { ...DEFAULT_API_CONFIG };
        // Save to localStorage if available
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('league-view-api-config', JSON.stringify(this.config));
            }
        } catch (error) {
            console.warn('Failed to save API config to localStorage:', error);
        }
    }
}

export const configService = ConfigService.getInstance();
