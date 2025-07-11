import { useEffect, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import MatchView from './components/match/MatchView';
import DashboardView from './components/dashboard/DashboardView';
import PreMatchView from './components/match/PreMatchView';
import ChampionsView from './components/champions/ChampionsView';
import Navigation from './components/navigation/Navigation';


function hasValidSummoner(gameName: string, tagLine: string, region: string) {
  return Boolean(gameName && tagLine && region);
}

function App() {
  const { mode, matchData, dashboard, setMode, setMatchData, setDashboard, gameName, tagLine, region, setSummoner } = useStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unlistenFunctions: UnlistenFn[] = [];

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
        });

        // Match data listener
        const unlistenMatch = await listen('matchData', (e) => {
          console.log('Match data received:', e.payload);
          setMatchData(e.payload as any);
          setMode('ingame');
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

        // Store all unlisten functions for cleanup
        unlistenFunctions = [unlistenStart, unlistenMatch, unlistenEnd];
      } catch (error) {
        console.error('Failed to initialize event listeners:', error);
      }
    };

    initialize();
    initializeEventListeners();

    // Cleanup function
    return () => {
      unlistenFunctions.forEach(unlisten => {
        try {
          unlisten();
        } catch (error) {
          console.error('Error during event listener cleanup:', error);
        }
      });
    };
  }, [setMode, setMatchData, setDashboard, setSummoner, gameName, tagLine, region]);

  if (!initialized) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      {/* Show navigation for dashboard and champions modes */}
      {(mode === 'dashboard' || mode === 'champions') && <Navigation />}

      <AnimatePresence mode="wait">
        {mode === 'dashboard' && (
          <motion.div
            key="dash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardView data={dashboard} />
          </motion.div>
        )}
        {mode === 'loading' && (
          <motion.div
            key="load"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PreMatchView />
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
            <ChampionsView />
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
            <MatchView data={matchData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;