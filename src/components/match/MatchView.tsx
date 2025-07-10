import { Box, SimpleGrid } from '@chakra-ui/react';
import { MatchPayload } from '../../store';
import PlayerCard from './PlayerCard';

interface Props {
  data: MatchPayload | null;
}

export default function MatchView({ data }: Props) {
  if (!data) return <Box>Loading...</Box>;

  return (
    <SimpleGrid columns={2} spacing={2} p={4}>
      {data.game.participants.map((p: any, idx: number) => (
        <PlayerCard
          key={idx}
          player={p}
          ranked={data.ranked[idx]}
          traits={data.traits[idx]}
        />
      ))}
    </SimpleGrid>
  );
}
