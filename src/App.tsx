import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { ChakraProvider } from '@chakra-ui/react';
import { useStore } from './store';
import MatchView from './components/match/MatchView';
import DashboardView from './components/dashboard/DashboardView';

function App() {
  const { inGame, matchData, dashboard, setInGame, setMatchData, setDashboard } = useStore();

  useEffect(() => {
    const unlistenMatch = listen('matchData', (e) => {
      setMatchData(e.payload as any);
      setInGame(true);
    });
    const unlistenEnd = listen('gameEnded', async () => {
      setInGame(false);
      const data = await invoke('refresh_dashboard');
      setDashboard(data as any);
    });
    return () => {
      unlistenMatch.then((f) => f());
      unlistenEnd.then((f) => f());
    };
  }, []);

  return (
    <ChakraProvider>
      {inGame ? <MatchView data={matchData} /> : <DashboardView data={dashboard} />}
    </ChakraProvider>
  );
}

export default App;
