import { Box, VStack, Text, Spinner, Alert, AlertIcon, Button, HStack, Icon } from '@chakra-ui/react';
import { FaRedo } from 'react-icons/fa';
import { DashboardStats } from '../../store';
import { useStore } from '../../store';
import { useDashboardRefresh } from '../../hooks/useApiWithRetry';
import ChampionStats from './ChampionStats';
import SummonerForm from './SummonerForm';
import RankCard from './RankCard';
import RecentGames from './RecentGames';
import PerformanceInsights from './PerformanceInsights';
// import { BadgeCard, BadgeProgressCard } from '../badges/BadgeDisplay';
import AdvancedAnalyticsDashboard from '../analytics/AdvancedAnalyticsDashboard';
import LiveMatchStatus from '../live/LiveMatchStatus';
import ConnectionTestButton from '../common/ConnectionTestButton';

interface Props {
  data: DashboardStats | null;
}

function hasValidSummoner(gameName: string, tagLine: string, region: string) {
  return Boolean(gameName && tagLine && region);
}

export default function DashboardView({ data }: Props) {
  const { gameName, tagLine, region, setDashboard } = useStore();
  const { 
    data: retryData, 
    loading: retryLoading, 
    error: retryError, 
    retry 
  } = useDashboardRefresh();

  // Create full summoner name for live match detection
  const summonerName = gameName && tagLine ? `${gameName}#${tagLine}` : '';
  const hasSummoner = hasValidSummoner(gameName, tagLine, region);

  // Use retry data if available, otherwise use prop data
  const dashboardData = (retryData as DashboardStats) || data;

  const handleRetry = async () => {
    await retry();
    if (retryData) {
      setDashboard(retryData as DashboardStats);
    }
  };

  return (
    <Box p={4} maxW="1400px" mx="auto">
      <VStack align="stretch" spacing={4}>
        <SummonerForm />

        {/* Connection Test Button (for development/testing) */}
        <ConnectionTestButton />

        {/* Only show components that require summoner data if we have a valid summoner */}
        {hasSummoner ? (
          <>
            <LiveMatchStatus
              summonerName={summonerName}
              region={region}
              autoStart={true}
            />
            <RankCard rank={dashboardData?.rank} />
            <ChampionStats champions={dashboardData?.champions || []} />
            <PerformanceInsights data={dashboardData?.performance || null} />

            {/* Show error state with retry option */}
            {retryError && (
              <Alert status="error">
                <AlertIcon />
                <VStack align="start" flex="1" spacing={2}>
                  <Text fontWeight="bold">Connection Error</Text>
                  <Text>{retryError}</Text>
                  <HStack>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<Icon as={FaRedo} />}
                      onClick={handleRetry}
                      isLoading={retryLoading}
                    >
                      Retry Connection
                    </Button>
                  </HStack>
                </VStack>
              </Alert>
            )}

            {/* Only show components that need API calls if we have dashboard data or are confirmed no user */}
            {dashboardData !== null ? (
              <>
                <RecentGames />
                {/* Replace BadgeDisplay with BadgeCard/BadgeProgressCard usage as needed */}
                {/* Example usage: <BadgeCard badge={...} /> or <BadgeProgressCard badgeId={...} progress={...} /> */}
                <AdvancedAnalyticsDashboard enabled={true} compactView={false} hasValidSummoner={hasSummoner} />
              </>
            ) : (
              <Box p={4} textAlign="center">
                <Spinner size="lg" />
                <Text mt={2} color="gray.500">Loading dashboard data...</Text>
              </Box>
            )}
          </>
        ) : (
          <Alert status="info">
            <AlertIcon />
            <Text>Please enter your summoner information above to view your stats and analytics.</Text>
          </Alert>
        )}
      </VStack>
    </Box>
  );
}
