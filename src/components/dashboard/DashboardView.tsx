import { Box, VStack, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { DashboardStats } from '../../store';
import { useStore } from '../../store';
import ChampionStats from './ChampionStats';
import SummonerForm from './SummonerForm';
import RankCard from './RankCard';
import RecentGames from './RecentGames';
import PerformanceInsights from './PerformanceInsights';
import BadgeDisplay from '../badges/BadgeDisplay';
import AdvancedAnalyticsDashboard from '../analytics/AdvancedAnalyticsDashboard';
import LiveMatchStatus from '../live/LiveMatchStatus';

interface Props {
  data: DashboardStats | null;
}

function hasValidSummoner(gameName: string, tagLine: string, region: string) {
  return Boolean(gameName && tagLine && region);
}

export default function DashboardView({ data }: Props) {
  const { gameName, tagLine, region } = useStore();

  // Create full summoner name for live match detection
  const summonerName = gameName && tagLine ? `${gameName}#${tagLine}` : '';
  const hasSummoner = hasValidSummoner(gameName, tagLine, region);

  return (
    <Box p={4} maxW="1400px" mx="auto">
      <VStack align="stretch" spacing={4}>
        <SummonerForm />

        {/* Only show components that require summoner data if we have a valid summoner */}
        {hasSummoner ? (
          <>
            <LiveMatchStatus
              summonerName={summonerName}
              region={region}
              autoStart={true}
            />
            <RankCard rank={data?.rank} />
            <ChampionStats champions={data?.champions || []} />
            <PerformanceInsights data={data?.performance || null} />

            {/* Only show components that need API calls if we have dashboard data or are confirmed no user */}
            {data !== null ? (
              <>
                <RecentGames />
                <BadgeDisplay compactView={false} hasValidSummoner={hasSummoner} />
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
