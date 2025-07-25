import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/core';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
  onError?: (error: any, attempt: number) => void;
}

interface UseApiWithRetryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useApiWithRetry<T>(
  apiFunction: () => Promise<T>,
  options: RetryOptions = {}
): UseApiWithRetryResult<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    onRetry,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const executeWithRetry = useCallback(async () => {
    setLoading(true);
    setError(null);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await apiFunction();
        setData(result);
        setLoading(false);
        
        if (attempt > 1) {
          toast({
            title: 'Connection Restored',
            description: `Successfully reconnected after ${attempt} attempts`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        return;
      } catch (err: any) {
        const errorMessage = err?.toString() || 'Unknown error occurred';
        
        if (onError) {
          onError(err, attempt);
        }

        if (attempt === maxAttempts) {
          setError(errorMessage);
          setLoading(false);
          
          toast({
            title: 'Connection Failed',
            description: `Failed to connect after ${maxAttempts} attempts. Please check your connection.`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        if (onRetry) {
          onRetry(attempt);
        }

        if (attempt < maxAttempts) {
          toast({
            title: 'Retrying Connection',
            description: `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay/1000}s...`,
            status: 'warning',
            duration: 2000,
            isClosable: true,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
  }, [apiFunction, maxAttempts, delay, onRetry, onError, toast]);

  const retry = useCallback(() => executeWithRetry(), [executeWithRetry]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute: executeWithRetry,
    retry,
    reset,
  };
}

// Specialized hook for Tauri command invocations
export function useTauriCommandWithRetry<T>(
  command: string,
  args?: Record<string, any>,
  options: RetryOptions = {}
): UseApiWithRetryResult<T> {
  const apiFunction = useCallback(async () => {
    return await invoke(command, args) as T;
  }, [command, args]);

  return useApiWithRetry(apiFunction, options);
}

// Hook for handling dashboard refresh with retry
export function useDashboardRefresh() {
  return useTauriCommandWithRetry<any>('refresh_dashboard', undefined, {
    maxAttempts: 3,
    delay: 2000,
    onRetry: (attempt) => {
      console.log(`Retrying dashboard refresh - attempt ${attempt}`);
    },
    onError: (error, attempt) => {
      console.error(`Dashboard refresh attempt ${attempt} failed:`, error);
    },
  });
}

// Hook for handling recent games with retry
export function useRecentGames(count?: number) {
  return useTauriCommandWithRetry('recent_games', { count }, {
    maxAttempts: 3,
    delay: 1500,
    onRetry: (attempt) => {
      console.log(`Retrying recent games fetch - attempt ${attempt}`);
    },
    onError: (error, attempt) => {
      console.error(`Recent games fetch attempt ${attempt} failed:`, error);
    },
  });
}

// Hook for setting tracked summoner with retry
export function useSetTrackedSummoner() {
  const [isSettingSummoner, setIsSettingSummoner] = useState(false);
  const toast = useToast();

  const setSummoner = useCallback(async (gameName: string, tagLine: string, region: string) => {
    setIsSettingSummoner(true);
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await invoke('set_tracked_summoner', { gameName, tagLine, region });
        setIsSettingSummoner(false);
        
        if (attempt > 1) {
          toast({
            title: 'Summoner Set Successfully',
            description: `Connected after ${attempt} attempts`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
        return true;
      } catch (err: any) {
        if (attempt === 3) {
          setIsSettingSummoner(false);
          toast({
            title: 'Failed to Set Summoner',
            description: err?.toString() || 'Please check your summoner name and try again',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return false;
        }

        if (attempt < 3) {
          toast({
            title: 'Retrying...',
            description: `Attempt ${attempt}/3 failed. Retrying...`,
            status: 'warning',
            duration: 2000,
            isClosable: true,
          });
          
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    setIsSettingSummoner(false);
    return false;
  }, [toast]);

  return {
    setSummoner,
    isSettingSummoner,
  };
}
