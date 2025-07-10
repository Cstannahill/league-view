import { Box, Text } from '@chakra-ui/react';

interface Props {
  player: any;
  ranked: any[];
}

export default function PlayerCard({ player, ranked }: Props) {
  const entry = ranked && ranked[0];
  return (
    <Box borderWidth="1px" p={2}>
      <Text fontWeight="bold">{player.summonerName}</Text>
      {entry && <Text>{entry.tier} {entry.rank}</Text>}
    </Box>
  );
}
