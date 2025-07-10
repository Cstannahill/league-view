import { Box } from '@chakra-ui/react';
import { DashboardStats } from '../../store';
import ChampionStats from './ChampionStats';

interface Props {
  data: DashboardStats | null;
}

export default function DashboardView({ data }: Props) {
  return (
    <Box p={4}>
      <ChampionStats />
    </Box>
  );
}
