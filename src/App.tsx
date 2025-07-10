import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { ChakraProvider } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import MatchView from './components/match/MatchView';
import DashboardView from './components/dashboard/DashboardView';
import PreMatchView from './components/match/PreMatchView';

function App() {
  const { mode, matchData, dashboard, setMode, setMatchData, setDashboard } = useStore();

  useEffect(() => {
    const unlistenStart = listen('gameStarted', () => {
      setMode('loading');
    });
    const unlistenMatch = listen('matchData', (e) => {
      setMatchData(e.payload as any);
      setMode('ingame');
    });
    const unlistenEnd = listen('gameEnded', async () => {
      setMode('dashboard');
      const data = await invoke('refresh_dashboard');
      setDashboard(data as any);
    });
    return () => {
      unlistenStart.then((f) => f());
      unlistenMatch.then((f) => f());
      unlistenEnd.then((f) => f());
    };
  }, []);

  return (
    <ChakraProvider>
      <AnimatePresence mode="wait">
        {mode === 'dashboard' && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DashboardView data={dashboard} />
          </motion.div>
        )}
        {mode === 'loading' && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PreMatchView />
          </motion.div>
        )}
        {mode === 'ingame' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MatchView data={matchData} />
          </motion.div>
        )}
      </AnimatePresence>
    </ChakraProvider>
  );
}

export default App;
