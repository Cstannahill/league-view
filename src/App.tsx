import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import MatchView from './components/match/MatchView';
import DashboardView from './components/dashboard/DashboardView';
import PreMatchView from './components/match/PreMatchView';

function App() {
  const { mode, matchData, dashboard, setMode, setMatchData, setDashboard } = useStore();

  useEffect(() => {
    let unlistenFunctions: UnlistenFn[] = [];

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

    // Initialize listeners
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
  }, [setMode, setMatchData, setDashboard]);

  return (
    <div className="app-container">
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