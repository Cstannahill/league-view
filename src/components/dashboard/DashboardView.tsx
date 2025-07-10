import { Box } from '@chakra-ui/react';
import { DashboardStats } from '../../store';
import ChampionStats from './ChampionStats';
import SummonerForm from './SummonerForm';

interface Props {
  data: DashboardStats | null;
}

export default function DashboardView({ data }: Props) {
  return (
    <Box p={4}>
      <SummonerForm />
      <ChampionStats champions={data?.champions || []} />
    </Box>
  );
}
