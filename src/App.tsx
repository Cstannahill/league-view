import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast, Box } from '@chakra-ui/react';
import { useStore } from './store';
import MatchView from './components/match/MatchView';
import DashboardView from './components/dashboard/DashboardView';
import PreMatchView from './components/match/PreMatchView';
import ChampionsView from './components/champions/ChampionsView';
import Navigation from './components/navigation/Navigation';
import ConnectionStatus from './components/common/ConnectionStatus';

function hasValidSummoner(gameName: string, tagLine: string, region: string) {
  return Boolean(gameName && tagLine && region);
}

// Memoized view components to prevent unnecessary re-renders
const MemoizedDashboardView = React.memo(DashboardView);
const MemoizedMatchView = React.memo(MatchView);
const MemoizedPreMatchView = React.memo(PreMatchView);
const MemoizedChampionsView = React.memo(ChampionsView);
const MemoizedNavigation = React.memo(Navigation);
const MemoizedConnectionStatus = React.memo(ConnectionStatus);

function App() {
  const { mode, matchData, dashboard, setMode, setMatchData, setDashboard, gameName, tagLine, region, setSummoner } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [matchTimeoutError, setMatchTimeoutError] = useState<string | null>(null);
  const toast = useToast();

  // Memoized values to prevent unnecessary re-computations
  const showNavigation = useMemo(() => 
    mode === 'dashboard' || mode === 'champions', 
    [mode]
  );

  const hasValidSummonerMemo = useMemo(() =>
    hasValidSummoner(gameName, tagLine, region),
    [gameName, tagLine, region]
  );

  // Memoized callbacks to prevent function recreation on every render
  const handleGameStarted = useCallback(() => {
    console.log('Game started event received');
    setMode('loading');
  }, [setMode]);

  const handleMatchData = useCallback((e: any) => {
    console.log('Match data received:', e.payload);
    if (!e.payload || typeof e.payload !== 'object') {
      setMatchTimeoutError('Received invalid or empty match data from backend.');
      return;
    }
    setMatchData(e.payload as any);
    setMode('ingame');
    setMatchTimeoutError(null);
  }, [setMatchData, setMode]);

  const handleGameEnded = useCallback(async () => {
    console.log('Game ended event received');
    setMode('dashboard');
    try {
      const data = await invoke('refresh_dashboard');
      setDashboard(data as any);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }, [setMode, setDashboard]);

  const handleConnectionError = useCallback((e: any) => {
    console.warn('Connection error received:', e.payload);
    const errorData = e.payload as any;
    
    if (errorData.reconnecting) {
      setConnectionStatus('reconnecting');
    } else {
      setConnectionStatus('disconnected');
      toast({
        title: 'Connection Lost',
        description: 'Lost connection to League of Legends client',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleConnectionRestored = useCallback(() => {
    console.log('Connection restored');
    setConnectionStatus('connected');
    toast({
      title: 'Connection Restored',
      description: 'Successfully reconnected to League of Legends client',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);


  useEffect(() => {
    let unlistenFunctions: UnlistenFn[] = [];
    let matchTimeout: ReturnType<typeof setTimeout> | null = null;

    // On mount, check for persisted summoner and load dashboard if present
    const initialize = async () => {
      // Check localStorage for summoner
      let persisted: { gameName: string; tagLine: string; region: string } | null = null;
      try {
        if (typeof localStorage !== 'undefined') {
          persisted = JSON.parse(localStorage.getItem('summoner') || 'null');
        }
      } catch { }

      if (persisted && hasValidSummoner(persisted.gameName, persisted.tagLine, persisted.region)) {
        try {
          // Set summoner in store if not already set
          if (!hasValidSummoner(gameName, tagLine, region)) {
            await setSummoner(persisted.gameName, persisted.tagLine, persisted.region);
          }

          // Try to refresh dashboard immediately after setting summoner
          console.log('Attempting to refresh dashboard for persisted summoner:', persisted);
          const data = await invoke('refresh_dashboard');
          setDashboard(data as any);
          console.log('Dashboard refreshed successfully:', data);
        } catch (error) {
          console.warn('Failed to refresh dashboard on startup:', error);
          // Try again after a short delay if the first attempt fails
          setTimeout(async () => {
            try {
              console.log('Retrying dashboard refresh...');
              const data = await invoke('refresh_dashboard');
              setDashboard(data as any);
              console.log('Dashboard refresh retry successful:', data);
            } catch (retryError) {
              console.error('Dashboard refresh retry failed:', retryError);
              setDashboard(null);
            }
          }, 1000);
        }
      }
      setInitialized(true);
    };

    const initializeEventListeners = async () => {
      try {
        // Game started listener
        const unlistenStart = await listen('gameStarted', () => {
          console.log('Game started event received');
          setMode('loading');
          setMatchTimeoutError(null);
          // Start a timeout for match data
          if (matchTimeout) clearTimeout(matchTimeout);
          matchTimeout = setTimeout(() => {
            setMatchTimeoutError('Timed out waiting for match data from backend.');
          }, 10000); // 10 seconds
        });

        // Match data listener
        const unlistenMatch = await listen('matchData', (e) => {
          console.log('Match data received:', e.payload);
          if (matchTimeout) clearTimeout(matchTimeout);
          handleMatchData(e);
        });

        // Game ended listener
        const unlistenEnd = await listen('gameEnded', async () => {
          console.log('Game ended event received');
          setMode('dashboard');
          try {
            const data = await invoke('refresh_dashboard');
            setDashboard(data as any);
          } catch (error) {
            console.error('Failed to refresh dashboard:', error);
          }
        });

        // Connection error listener
        const unlistenConnectionError = await listen('connectionError', (e) => {
          console.warn('Connection error received:', e.payload);
          const errorData = e.payload as any;
          
          setConnectionStatus('reconnecting');
          
          toast({
            title: 'Connection Issue',
            description: `Experiencing connectivity problems. Retrying... (${errorData.consecutive_failures || 1} attempts)`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });

          // Reset connection status after a delay if no more errors
          setTimeout(() => {
            setConnectionStatus('connected');
          }, 10000);
        });

        // Store all unlisten functions for cleanup
        unlistenFunctions = [unlistenStart, unlistenMatch, unlistenEnd, unlistenConnectionError];
      } catch (error) {
        console.error('Failed to initialize event listeners:', error);
      }
    };

    const cleanupListeners = useCallback(() => {
      unlistenFunctions.forEach(unlisten => {
          try {
              unlisten();
          } catch (error) {
              console.error('Error during event listener cleanup:', error);
          }
      });
      if (matchTimeout) clearTimeout(matchTimeout);
    }, [unlistenFunctions, matchTimeout]);

    initialize();
    initializeEventListeners();

    return cleanupListeners;
  }, [
    setSummoner,
    setDashboard,
    hasValidSummonerMemo,
    handleGameStarted,
    handleMatchData,
    handleGameEnded,
    handleConnectionError,
    handleConnectionRestored
  ]);

  if (!initialized) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      {/* Connection Status Indicator */}
      <MemoizedConnectionStatus status={connectionStatus} />
      
      {/* Show navigation for dashboard and champions modes */}
      {showNavigation && <MemoizedNavigation />}

      {matchTimeoutError && mode === 'loading' && (
        <Box p={6} textAlign="center" color="red.500" fontWeight="bold">
          {matchTimeoutError}
        </Box>
      )}

      <AnimatePresence mode="wait">
        {mode === 'dashboard' && (
          <motion.div
            key="dash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <MemoizedDashboardView data={dashboard} />
          </motion.div>
        )}
        {mode === 'loading' && !matchTimeoutError && (
          <motion.div
            key="load"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MemoizedPreMatchView />
          </motion.div>
        )}
        {mode === 'champions' && (
          <motion.div
            key="champions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MemoizedChampionsView />
          </motion.div>
        )}
        {mode === 'ingame' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MemoizedMatchView data={matchData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(App);