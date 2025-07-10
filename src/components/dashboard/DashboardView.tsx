import { Box, VStack } from '@chakra-ui/react';
import { DashboardStats } from '../../store';
import ChampionStats from './ChampionStats';
import SummonerForm from './SummonerForm';
import RankCard from './RankCard';
import RecentGames from './RecentGames';

interface Props {
  data: DashboardStats | null;
}

export default function DashboardView({ data }: Props) {
  return (
    <Box p={4} maxW="500px" mx="auto">
      <VStack align="stretch" spacing={4}>
        <SummonerForm />
        <RankCard rank={data?.rank} />
        <ChampionStats champions={data?.champions || []} />
        <RecentGames />
      </VStack>
    </Box>
  );
}
